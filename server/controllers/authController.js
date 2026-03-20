const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const db       = require('../config/db');

const signup = async (req, res) => {
  try {
    const { name, email, password, phone, location, role, aadhar, pan } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, email, password and role are required.' });
    }

    if (!['buyer', 'seller'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be buyer or seller.' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists.' });
    }

    if (role === 'seller' && (!aadhar || !pan)) {
      return res.status(400).json({ success: false, message: 'Sellers must provide Aadhar and PAN numbers.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, phone, location, role, aadhar, pan) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, phone || null, location || null, role, aadhar || null, pan || null]
    );

    const token = jwt.sign(
      { id: result.insertId, name, email, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      token,
      user: { id: result.insertId, name, email, role, phone, location },
    });

  } catch (err) {
    console.error('Signup error:', err);
    return res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'No account found with this email.' });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id:       user.id,
        name:     user.name,
        email:    user.email,
        role:     user.role,
        phone:    user.phone,
        location: user.location,
      },
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

const getMe = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, location, aadhar, pan, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    return res.status(200).json({ success: true, user: rows[0] });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
};

module.exports = { signup, login, getMe };