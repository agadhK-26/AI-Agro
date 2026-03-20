const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/bank', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM seller_bank WHERE seller_id = ?', [req.user.id]);
    return res.json({ success: true, bank: rows[0] || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

router.post('/bank', verifyToken, requireRole('seller'), async (req, res) => {
  try {
    const { accountName, accountNumber, ifsc, bankName, upiId } = req.body;
    await db.query(
      `INSERT INTO seller_bank (seller_id, accountName, accountNumber, ifsc, bankName, upiId)
       VALUES (?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         accountName=VALUES(accountName), accountNumber=VALUES(accountNumber),
         ifsc=VALUES(ifsc), bankName=VALUES(bankName), upiId=VALUES(upiId), updatedAt=NOW()`,
      [req.user.id, accountName, accountNumber, ifsc, bankName, upiId || '']
    );
    return res.json({ success: true, message: 'Bank details saved.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Server error.' });
  }
});

module.exports = router;