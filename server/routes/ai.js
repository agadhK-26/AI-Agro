const express    = require('express');
const router     = express.Router();
const { verifyToken, requireRole } = require('../middleware/auth');
const {
  getBuyerInsights,
  getSellerSuggestions,
  getPricePrediction,
  chatAssistant,
} = require('../controllers/aiController');

router.get('/buyer-insights',      verifyToken, requireRole('buyer'),  getBuyerInsights);
router.get('/seller-suggestions',  verifyToken, requireRole('seller'), getSellerSuggestions);
router.get('/price-prediction',    verifyToken,                        getPricePrediction);
router.post('/chat',               verifyToken,                        chatAssistant);

module.exports = router;