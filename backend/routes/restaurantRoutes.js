const express = require('express');
const {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantLogo,
  updateRestaurantCoverImage,
} = require('../controllers/restaurantController');
const { protect, restaurantOwner } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').get(getRestaurants).post(protect, restaurantOwner, createRestaurant);
router.put('/:id/logo', protect, restaurantOwner, upload.single('image'), updateRestaurantLogo);
router.put('/:id/cover', protect, restaurantOwner, upload.single('image'), updateRestaurantCoverImage);
router
  .route('/:id')
  .get(getRestaurantById)
  .put(protect, restaurantOwner, updateRestaurant)
  .delete(protect, restaurantOwner, deleteRestaurant);

module.exports = router;
