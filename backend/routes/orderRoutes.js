const express = require('express');
const {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
  payDeliveryFee,
  getRestaurantStats,
  requestRestaurantWithdrawal
} = require('../controllers/orderController');
const { protect, restaurantOwner } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, addOrderItems);
router.route('/myorders').get(protect, getMyOrders);
router.route('/restaurant/:restaurantId').get(protect, restaurantOwner, getRestaurantOrders);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/status').put(protect, restaurantOwner, updateOrderStatus);
router.route('/:id/pay-driver').put(protect, restaurantOwner, payDeliveryFee);
router.route('/:id/cancel').put(protect, cancelOrder);
router.route('/restaurant-stats/:restaurantId').get(protect, restaurantOwner, getRestaurantStats);
router.route('/restaurant-withdraw').post(protect, restaurantOwner, requestRestaurantWithdrawal);

module.exports = router;
