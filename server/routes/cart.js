const express    = require('express');
const router     = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} = require('../controllers/cartController');

router.get('/',         verifyToken, requireRole('buyer'), getCart);
router.post('/',        verifyToken, requireRole('buyer'), addToCart);
router.put('/:id',      verifyToken, requireRole('buyer'), updateCartItem);
router.delete('/:id',   verifyToken, requireRole('buyer'), removeFromCart);
router.delete('/',      verifyToken, requireRole('buyer'), clearCart);

module.exports = router;