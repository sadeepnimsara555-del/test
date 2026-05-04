const express = require('express');
const {
  getAvailableOrders,
  toggleOnlineStatus,
  acceptOrder,
  updateDeliveryProgress,
  getDriverStats,
  getActiveDelivery,
  requestWithdrawal
} = require('../controllers/deliveryController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Middleware to ensure the user is a delivery driver
const deliveryOnly = (req, res, next) => {
  if (req.user && req.user.role === 'delivery') {
    next();
  } else {
    res.status(403);
    throw new Error('Not authorized. Delivery personnel only.');
  }
};

router.get('/available', protect, deliveryOnly, getAvailableOrders);
router.put('/status', protect, deliveryOnly, toggleOnlineStatus);
router.put('/accept/:orderId', protect, deliveryOnly, acceptOrder);
router.put('/progress/:orderId', protect, deliveryOnly, updateDeliveryProgress);
router.get('/stats', protect, deliveryOnly, getDriverStats);
router.get('/active', protect, deliveryOnly, getActiveDelivery);
router.post('/withdraw', protect, deliveryOnly, requestWithdrawal);

module.exports = router;
