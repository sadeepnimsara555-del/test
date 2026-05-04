const express = require('express');
const {
  createReview,
  updateReview,
  getReviewsByRestaurant,
  getAllReviewsForRestaurant,
  getReviewsByMenuItem,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createReview);
router.route('/restaurant/:restaurantId').get(getReviewsByRestaurant);
router.route('/restaurant/:restaurantId/all').get(protect, getAllReviewsForRestaurant);

router.route('/menu/:menuItemId').get(getReviewsByMenuItem);
router.route('/:id').put(protect, updateReview).delete(protect, deleteReview);


module.exports = router;
