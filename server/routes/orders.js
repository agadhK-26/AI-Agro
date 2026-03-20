const express    = require('express');
const router     = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  adminGetAllOrders,
  adminUpdateOrderStatus,
} = require('../controllers/orderController');

router.post('/',             verifyToken, requireRole('buyer'),         placeOrder);
router.get('/',              verifyToken, requireRole('buyer'),         getMyOrders);
router.get('/:id',           verifyToken, requireRole('buyer'),         getOrderById);
router.put('/:id/cancel',    verifyToken, requireRole('buyer'),         cancelOrder);

router.get('/admin/all',     verifyToken, requireRole('admin'),         adminGetAllOrders);
router.put('/admin/:id',     verifyToken, requireRole('admin'),         adminUpdateOrderStatus);

module.exports = router;