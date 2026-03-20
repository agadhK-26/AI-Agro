const db = require('../config/db');

const getAllProducts = async (req, res) => {
  try {
    const { category, location, search } = req.query;
    let query = `
      SELECT p.*, u.name AS seller_name, u.location AS seller_location
      FROM products p
      JOIN users u ON p.seller_id = u.id
      WHERE p.status = 'active'
    `;
    const params = [];

    if (category) { query += ' AND p.category = ?'; params.push(category); }
    if (location) { query += ' AND p.location LIKE ?'; params.push(`%${location}%`); }
    if (search)   { query += ' AND (p.title LIKE ? OR p.description LIKE ?)'; params.push(`%${search}%`, `%${search}%`); }

    query += ' ORDER BY p.created_at DESC';

    const [rows] = await db.query(query, params);
    return res.status(200).json({ success: true, products: rows });
  } catch (err) {
    console.error('getAllProducts error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getProductById = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT p.*, u.name AS seller_name FROM products p JOIN users u ON p.seller_id = u.id WHERE p.id = ?',
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Product not found.' });
    return res.status(200).json({ success: true, product: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getMyProducts = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    return res.status(200).json({ success: true, products: rows });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const addProduct = async (req, res) => {
  try {
    const { title, description, price, stock, category, image_url, location } = req.body;

    if (!title || !price) {
      return res.status(400).json({ success: false, message: 'Title and price are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO products (seller_id, title, description, price, stock, category, image_url, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, title, description || '', price, stock || 0, category || 'Other', image_url || '', location || '']
    );

    return res.status(201).json({ success: true, message: 'Product listed successfully.', productId: result.insertId });
  } catch (err) {
    console.error('addProduct error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { title, description, price, stock, category, image_url, location, status } = req.body;

    const [existing] = await db.query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Product not found or not yours.' });

    await db.query(
      'UPDATE products SET title=?, description=?, price=?, stock=?, category=?, image_url=?, location=?, status=? WHERE id=?',
      [title, description, price, stock, category, image_url, location, status || 'active', req.params.id]
    );

    return res.status(200).json({ success: true, message: 'Product updated successfully.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const [existing] = await db.query('SELECT id FROM products WHERE id = ? AND seller_id = ?', [req.params.id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Product not found or not yours.' });

    await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
    return res.status(200).json({ success: true, message: 'Product deleted.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

const getSellerStats = async (req, res) => {
  try {
    const sellerId = req.user.id;

    const [[{ totalProducts }]] = await db.query('SELECT COUNT(*) AS totalProducts FROM products WHERE seller_id = ?', [sellerId]);
    const [[{ activeProducts }]] = await db.query("SELECT COUNT(*) AS activeProducts FROM products WHERE seller_id = ? AND status = 'active'", [sellerId]);
    const [[{ totalEarnings }]] = await db.query('SELECT COALESCE(SUM(oi.price * oi.quantity), 0) AS totalEarnings FROM order_items oi WHERE oi.seller_id = ?', [sellerId]);
    const [[{ totalOrders }]] = await db.query('SELECT COUNT(DISTINCT order_id) AS totalOrders FROM order_items WHERE seller_id = ?', [sellerId]);

    const [monthlyEarnings] = await db.query(`
      SELECT DATE_FORMAT(o.created_at, '%b') AS month,
             COALESCE(SUM(oi.price * oi.quantity), 0) AS earnings
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      WHERE oi.seller_id = ? AND o.created_at >= DATE_SUB(NOW(), INTERVAL 7 MONTH)
      GROUP BY DATE_FORMAT(o.created_at, '%b'), MONTH(o.created_at)
      ORDER BY MONTH(o.created_at)
    `, [sellerId]);

    return res.status(200).json({
      success: true,
      stats: { totalProducts, activeProducts, totalEarnings, totalOrders },
      monthlyEarnings,
    });
  } catch (err) {
    console.error('getSellerStats error:', err);
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { getAllProducts, getProductById, getMyProducts, addProduct, updateProduct, deleteProduct, getSellerStats };