const express = require('express');
const {
  createDeliveryReview,
  getDriverReviews,
} = require('../controllers/deliveryReviewController');
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

router.post('/', protect, createDeliveryReview);
router.get('/driver', protect, deliveryOnly, getDriverReviews);

module.exports = router;
