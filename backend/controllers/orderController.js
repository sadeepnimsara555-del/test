const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const Withdrawal = require('../models/Withdrawal');

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res, next) => {
  const {
    restaurant,
    items,
    totalAmount,
    orderType,
    deliveryAddress,
    paymentMethod,
    paymentStatus,
    onlineProvider,
  } = req.body;

  try {
    if (items && items.length === 0) {
      res.status(400);
      throw new Error('No order items');
    } else {
      const deliveryFee = orderType === 'delivery' ? 2.50 : 0;
      const deliveryFeeStatus = orderType === 'delivery' ? 'pending' : 'n/a';

      const order = new Order({
        user: req.user._id,
        restaurant,
        items,
        totalAmount,
        orderType,
        deliveryAddress,
        paymentMethod,
        paymentStatus: paymentStatus || 'pending',
        onlineProvider,
        deliveryFee,
        deliveryFeeStatus,
      });

      const createdOrder = await order.save();
      res.status(201).json(createdOrder);
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user._id }).populate('deliveryPerson', 'name profileImage').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email')
      .populate('restaurant', 'name address')
      .populate('deliveryPerson', 'name profileImage');

    if (order) {
      res.json(order);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get orders for a restaurant
// @route   GET /api/orders/restaurant/:restaurantId
// @access  Private/Owner
const getRestaurantOrders = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to view these orders');
    }

    const orders = await Order.find({ restaurant: req.params.restaurantId }).populate('user', 'name profileImage').sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Owner/Admin
const updateOrderStatus = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const restaurant = await Restaurant.findById(order.restaurant);
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this order');
      }

      if (req.body.status === 'ready_for_delivery') {
         // Special case: if owner is forced to reset because driver doesn't show up
         if (order.deliveryPerson) {
            const User = require('../models/User');
            const driver = await User.findById(order.deliveryPerson);
            if (driver) {
               driver.activeDelivery = null;
               await driver.save();
            }
            order.deliveryPerson = null;
         }
      }

      order.orderStatus = req.body.status || order.orderStatus;
      if (req.body.paymentStatus) {
        order.paymentStatus = req.body.paymentStatus;
      }

      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      if (order.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to cancel this order');
      }

      if (order.orderStatus !== 'placed') {
        res.status(400);
        throw new Error('Cannot cancel order after it has been confirmed/prepared');
      }

      order.orderStatus = 'cancelled';
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Pay delivery fee to driver
// @route   PUT /api/orders/:id/pay-driver
// @access  Private/Owner
const payDeliveryFee = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);

    if (order) {
      const restaurant = await Restaurant.findById(order.restaurant);
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to perform this payment');
      }

      if (order.orderStatus !== 'delivered') {
        res.status(400);
        throw new Error('Can only pay driver for delivered orders');
      }

      if (order.deliveryFeeStatus === 'paid') {
        res.status(400);
        throw new Error('Delivery fee already paid');
      }

      order.deliveryFeeStatus = 'paid';
      const updatedOrder = await order.save();
      res.json(updatedOrder);
    } else {
      res.status(404);
      throw new Error('Order not found');
    }
  } catch (error) {
    next(error);
  }
};



// @desc    Get restaurant stats and history
// @route   GET /api/orders/restaurant-stats/:restaurantId
// @access  Private/Owner
const getRestaurantStats = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    const allOrders = await Order.find({ restaurant: req.params.restaurantId, orderStatus: 'delivered' }).sort({ createdAt: -1 });
    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });

    const totalWithdrawnAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // Food subtotal for restaurant (excluding delivery fee)
    const totalLifetimeFoodEarnings = allOrders.reduce((sum, o) => sum + (o.totalAmount - (o.deliveryFee || 0)), 0);

    // AUTO-SYNC LOGIC for previous withdrawals
    const currentlyMarkedWithdrawn = allOrders
      .filter(o => o.restaurantWithdrawalStatus === 'withdrawn')
      .reduce((sum, o) => sum + (o.totalAmount - (o.deliveryFee || 0)), 0);

    if (totalWithdrawnAmount > currentlyMarkedWithdrawn) {
      let gap = totalWithdrawnAmount - currentlyMarkedWithdrawn;
      const unwithdrawnPaid = allOrders
        .filter(o => o.restaurantWithdrawalStatus !== 'withdrawn')
        .sort((a, b) => a.updatedAt - b.updatedAt);

      for (const order of unwithdrawnPaid) {
        if (gap <= 0) break;
        order.restaurantWithdrawalStatus = 'withdrawn';
        await order.save();
        gap -= (order.totalAmount - (order.deliveryFee || 0));
      }
      return getRestaurantStats(req, res, next);
    }

    const availableBalance = totalLifetimeFoodEarnings - totalWithdrawnAmount;
    const activeHistory = allOrders.filter(o => o.restaurantWithdrawalStatus !== 'withdrawn');
    const withdrawnLogs = allOrders.filter(o => o.restaurantWithdrawalStatus === 'withdrawn');

    res.json({
      history: activeHistory,
      withdrawnLogs: withdrawnLogs,
      withdrawals: withdrawals,
      totalEarnings: availableBalance,
      lifetimeEarnings: totalLifetimeFoodEarnings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request restaurant withdrawal
// @route   POST /api/orders/restaurant-withdraw
// @access  Private/Owner
const requestRestaurantWithdrawal = async (req, res, next) => {
  try {
    const { amount, method, restaurantId } = req.body;

    if (!amount || amount < 60) {
      res.status(400);
      throw new Error('Minimum withdrawal amount for restaurants is $60.00');
    }

    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant || restaurant.ownerId.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized');
    }

    // Calculate balance using the same logic as stats
    const allDeliveredOrders = await Order.find({ 
      restaurant: restaurantId, 
      orderStatus: 'delivered' 
    });
    const withdrawals = await Withdrawal.find({ user: req.user._id });
    
    const totalLifetimeFoodEarnings = allDeliveredOrders.reduce((sum, o) => sum + (o.totalAmount - (o.deliveryFee || 0)), 0);
    const totalWithdrawnAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalLifetimeFoodEarnings - totalWithdrawnAmount;

    if (amount > availableBalance) {
      res.status(400);
      throw new Error(`Insufficient funds available. Available: $${availableBalance.toFixed(2)}`);
    }

    // Mark orders as withdrawn
    const orders = await Order.find({ 
      restaurant: restaurantId, 
      orderStatus: 'delivered',
      restaurantWithdrawalStatus: { $ne: 'withdrawn' }
    }).sort({ updatedAt: 1 });

    let remaining = amount;
    for (const order of orders) {
      if (remaining <= 0) break;
      order.restaurantWithdrawalStatus = 'withdrawn';
      await order.save();
      remaining -= (order.totalAmount - (order.deliveryFee || 0));
    }

    const withdrawal = await Withdrawal.create({
      user: req.user._id,
      amount,
      method,
      status: 'completed'
    });

    res.status(201).json(withdrawal);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addOrderItems,
  getMyOrders,
  getOrderById,
  getRestaurantOrders,
  updateOrderStatus,
  cancelOrder,
  payDeliveryFee,
  getRestaurantStats,
  requestRestaurantWithdrawal
};
