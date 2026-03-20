const db = require('../config/db');

const placeOrder = async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [cartItems] = await conn.query(`
      SELECT c.quantity, c.product_id, p.price, p.stock, p.seller_id
      FROM cart c
      JOIN products p ON c.product_id = p.id
      WHERE c.buyer_id = ?
    `, [req.user.id]);

    if (cartItems.length === 0) {
      await conn.rollback();
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }

    for (const item of cartItems) {
      if (item.stock < item.quantity) {
        await conn.rollback();
        return res.status(400).json({ success: false, message: `Insufficient stock for product ID ${item.product_id}.` });
      }
    }

    const subtotal       = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const platform_fee   = parseFloat((subtotal * 0.03).toFixed(2));
    const processing_fee = 15;
    const grand_total    = parseFloat((subtotal + platform_fee + processing_fee).toFixed(2));

    const [orderResult] = await conn.query(
      'INSERT INTO orders (buyer_id, total_amount, platform_fee, processing_fee, grand_total) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, subtotal, platform_fee, processing_fee, grand_total]
    );

    const orderId = orderResult.insertId;

    for (const item of cartItems) {
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, seller_id, quantity, price) VALUES (?, ?, ?, ?, ?)',
        [orderId, item.product_id, item.seller_id, item.quantity, item.price]
      );
      await conn.query('UPDATE products SET stock = stock - ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    await conn.query('DELETE FROM cart WHERE buyer_id = ?', [req.user.id]);

    await conn.commit();

    return res.status(201).json({
      success: true,
      message: 'Order placed successfully.',
      order: { id: orderId, subtotal, platform_fee, processing_fee, grand_total },
    });
  } catch (err) {
    await conn.rollback();
    console.error('placeOrder error:', err);
    return res.status(500).json({ success: false, message: 'Server error placing order.' });
  } finally {
    conn.release();
  }
};

const getMyOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.id, o.total_amount, o.platform_fee, o.processing_fee, o.grand_total,
             o.status, o.created_at
      FROM orders o
      WHERE o.buyer_id = ?
      ORDER BY o.created_at DESC
    `, [req.user.id]);

    for (const order of orders) {
      const [items] = await db.query(`
        SELECT oi.quantity, oi.price,
               p.title, p.image_url, p.category,
               u.name AS seller_name
        FROM order_items oi
        JOIN products p ON oi.product_id = p.id
        JOIN users u ON oi.seller_id = u.id
        WHERE oi.order_id = ?
      `, [order.id]);
      order.items = items;
    }

    return res.status(200).json({ success: true, orders });
  } catch (err) {
    console.error('getMyOrders error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getOrderById = async (req, res) => {
  try {
    const [orders] = await db.query(
      'SELECT * FROM orders WHERE id = ? AND buyer_id = ?',
      [req.params.id, req.user.id]
    );
    if (orders.length === 0) return res.status(404).json({ success: false, message: 'Order not found.' });

    const [items] = await db.query(`
      SELECT oi.quantity, oi.price, p.title, p.image_url, u.name AS seller_name
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN users u ON oi.seller_id = u.id
      WHERE oi.order_id = ?
    `, [req.params.id]);

    return res.status(200).json({ success: true, order: { ...orders[0], items } });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const [orders] = await db.query(
      "SELECT * FROM orders WHERE id = ? AND buyer_id = ? AND status = 'pending'",
      [req.params.id, req.user.id]
    );
    if (orders.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found or cannot be cancelled.' });
    }

    await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [req.params.id]);

    const [items] = await db.query('SELECT product_id, quantity FROM order_items WHERE order_id = ?', [req.params.id]);
    for (const item of items) {
      await db.query('UPDATE products SET stock = stock + ? WHERE id = ?', [item.quantity, item.product_id]);
    }

    return res.status(200).json({ success: true, message: 'Order cancelled and stock restored.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminGetAllOrders = async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT o.*, u.name AS buyer_name, u.email AS buyer_email
      FROM orders o
      JOIN users u ON o.buyer_id = u.id
      ORDER BY o.created_at DESC
    `);
    return res.status(200).json({ success: true, orders });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const adminUpdateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'delivered', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, req.params.id]);
    return res.status(200).json({ success: true, message: `Order status updated to ${status}.` });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { placeOrder, getMyOrders, getOrderById, cancelOrder, adminGetAllOrders, adminUpdateOrderStatus };