const db = require('../config/db');

const getCart = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT c.id, c.quantity, c.product_id,
             p.title, p.price, p.image_url, p.location, p.stock, p.category,
             u.name AS seller_name
      FROM cart c
      JOIN products p ON c.product_id = p.id
      JOIN users u ON p.seller_id = u.id
      WHERE c.buyer_id = ?
    `, [req.user.id]);

    const subtotal       = rows.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const platform_fee   = parseFloat((subtotal * 0.03).toFixed(2));
    const processing_fee = 15;
    const grand_total    = parseFloat((subtotal + platform_fee + processing_fee).toFixed(2));

    return res.status(200).json({
      success: true,
      cart: rows,
      billing: { subtotal, platform_fee, processing_fee, grand_total },
    });
  } catch (err) {
    console.error('getCart error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const addToCart = async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;

    if (!product_id) return res.status(400).json({ success: false, message: 'Product ID is required.' });

    const [product] = await db.query("SELECT id, stock, seller_id FROM products WHERE id = ? AND status = 'active'", [product_id]);
    if (product.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });

    if (product[0].seller_id === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot add your own product to cart.' });
    }

    const [existing] = await db.query('SELECT id, quantity FROM cart WHERE buyer_id = ? AND product_id = ?', [req.user.id, product_id]);

    if (existing.length > 0) {
      await db.query('UPDATE cart SET quantity = quantity + ? WHERE id = ?', [quantity, existing[0].id]);
    } else {
      await db.query('INSERT INTO cart (buyer_id, product_id, quantity) VALUES (?, ?, ?)', [req.user.id, product_id, quantity]);
    }

    return res.status(200).json({ success: true, message: 'Item added to cart.' });
  } catch (err) {
    console.error('addToCart error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!quantity || quantity < 1) return res.status(400).json({ success: false, message: 'Invalid quantity.' });

    await db.query('UPDATE cart SET quantity = ? WHERE id = ? AND buyer_id = ?', [quantity, req.params.id, req.user.id]);
    return res.status(200).json({ success: true, message: 'Cart updated.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const removeFromCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE id = ? AND buyer_id = ?', [req.params.id, req.user.id]);
    return res.status(200).json({ success: true, message: 'Item removed from cart.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const clearCart = async (req, res) => {
  try {
    await db.query('DELETE FROM cart WHERE buyer_id = ?', [req.user.id]);
    return res.status(200).json({ success: true, message: 'Cart cleared.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };