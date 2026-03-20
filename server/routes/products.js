const express    = require('express');
const router     = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getAllProducts,
  getProductById,
  getMyProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  getSellerStats,
} = require('../controllers/productController');

router.get('/',              getAllProducts);
router.get('/:id',           getProductById);

router.get('/seller/mine',   verifyToken, requireRole('seller'), getMyProducts);
router.get('/seller/stats',  verifyToken, requireRole('seller'), getSellerStats);
router.post('/',             verifyToken, requireRole('seller'), addProduct);
router.put('/:id',           verifyToken, requireRole('seller'), updateProduct);
router.delete('/:id',        verifyToken, requireRole('seller', 'admin'), deleteProduct);

module.exports = router;