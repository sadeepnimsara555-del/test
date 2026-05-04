const Order = require('../models/Order');
const User = require('../models/User');
const Withdrawal = require('../models/Withdrawal');

// @desc    Get all available orders ready for delivery
// @route   GET /api/delivery/available
// @access  Private (Delivery Only)
const getAvailableOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ orderStatus: 'ready_for_delivery' })
      .populate('restaurant', 'name address contactNumber')
      .populate('user', 'name address phone')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle online/offline status
// @route   PUT /api/delivery/status
// @access  Private (Delivery Only)
const toggleOnlineStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.isOnline !== undefined) {
        // Prevent going offline if they have an active delivery
        if (!req.body.isOnline && user.activeDelivery) {
          res.status(400);
          throw new Error('Cannot go offline with an active delivery. Please complete it first.');
        }
        
        user.isOnline = req.body.isOnline;
        const updatedUser = await user.save();
        res.json({ isOnline: updatedUser.isOnline });
      } else {
        res.status(400);
        throw new Error('Status boolean isOnline is required');
      }
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Accept a delivery order
// @route   PUT /api/delivery/accept/:orderId
// @access  Private (Delivery Only)
const acceptOrder = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'delivery') {
       res.status(403);
       throw new Error('Not authorized as an active delivery driver');
    }
    if (!user.isOnline) {
      res.status(400);
      throw new Error('You must go online to accept orders');
    }
    if (user.activeDelivery) {
      res.status(400);
      throw new Error('You already have an active delivery. Complete it before accepting another.');
    }

    const order = await Order.findById(req.params.orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    if (order.orderStatus !== 'ready_for_delivery') {
      res.status(400);
      throw new Error('Order is no longer available for delivery');
    }

    // Atomic-like update to prevent double-acceptance
    order.deliveryPerson = user._id;
    order.orderStatus = 'accepted';
    const updatedOrder = await order.save();

    user.activeDelivery = order._id;
    await user.save();

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery progress
// @route   PUT /api/delivery/progress/:orderId
// @access  Private (Delivery Only)
const updateDeliveryProgress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const order = await Order.findById(req.params.orderId);

    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (order.deliveryPerson.toString() !== user._id.toString()) {
      res.status(403);
      throw new Error('You are not assigned to this delivery');
    }

    const { status } = req.body;
    const validTransitions = {
      'accepted': ['picked_up', 'cancelled', 'ready_for_delivery'],
      'picked_up': ['on_the_way'],
      'on_the_way': ['delivered']
    };

    if (!validTransitions[order.orderStatus]?.includes(status)) {
      res.status(400);
      throw new Error(`Invalid status transition from ${order.orderStatus} to ${status}`);
    }

    if (status === 'ready_for_delivery') {
        order.deliveryPerson = null;
        user.activeDelivery = null;
        await user.save();
    }

    order.orderStatus = status;
    const updatedOrder = await order.save();

    // If delivered or actually cancelled (end of lifecycle for this driver)
    if (status === 'delivered' || status === 'cancelled') {
        user.activeDelivery = null;
        await user.save();
    }

    res.json(updatedOrder);
  } catch (error) {
    next(error);
  }
};

// @desc    Get delivery person stats and history
// @route   GET /api/delivery/stats
// @access  Private (Delivery Only)
const getDriverStats = async (req, res, next) => {
  try {
    const allOrders = await Order.find({
      deliveryPerson: req.user._id,
      orderStatus: { $in: ['picked_up', 'on_the_way', 'delivered'] }
    })
      .populate('restaurant', 'name')
      .sort({ updatedAt: -1 });

    const withdrawals = await Withdrawal.find({ user: req.user._id }).sort({ createdAt: -1 });
    const totalWithdrawnAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // AUTO-SYNC LOGIC: If we have withdrawals but orders aren't marked as withdrawn yet
    // (This fixes history for previous simulated withdrawals)
    const currentlyMarkedWithdrawn = allOrders
      .filter(o => o.withdrawalStatus === 'withdrawn')
      .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    if (totalWithdrawnAmount > currentlyMarkedWithdrawn) {
      let gap = totalWithdrawnAmount - currentlyMarkedWithdrawn;
      // Get unwithdrawn paid orders, oldest first
      const unwithdrawnPaid = allOrders
        .filter(o => o.deliveryFeeStatus === 'paid' && o.withdrawalStatus === 'unwithdrawn')
        .sort((a, b) => a.updatedAt - b.updatedAt);

      for (const order of unwithdrawnPaid) {
        if (gap <= 0) break;
        order.withdrawalStatus = 'withdrawn';
        await order.save();
        gap -= order.deliveryFee;
      }
      
      // Refresh the list after marking
      return getDriverStats(req, res, next);
    }

    const totalDeliveries = allOrders.filter(o => o.orderStatus === 'delivered').length;
    
    // Total PAID by restaurants so far
    const totalLifetimeEarnings = allOrders
      .filter(o => o.deliveryFeeStatus === 'paid')
      .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    const totalWithdrawn = withdrawals.reduce((sum, w) => sum + w.amount, 0);

    // availableBalance is what's left after withdrawals
    const availableBalance = totalLifetimeEarnings - totalWithdrawn;

    // Filter main history to show only unwithdrawn orders (Current Active Earnings)
    const activeHistory = allOrders.filter(o => o.withdrawalStatus === 'unwithdrawn');

    // Filter withdrawn orders for the Logs modal (already cashed out)
    const withdrawnLogs = allOrders.filter(o => o.withdrawalStatus === 'withdrawn');

    // pendingEarnings is what is still waiting (either in progress or not yet sent by owner)
    const pendingEarnings = allOrders
      .filter(o => o.deliveryFeeStatus === 'pending')
      .reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    res.json({
      history: activeHistory, 
      withdrawnLogs: withdrawnLogs, // Only withdrawn
      withdrawals,
      totalDeliveries,
      totalEarnings: availableBalance,
      lifetimeEarnings: totalLifetimeEarnings,
      pendingEarnings
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request a withdrawal
// @route   POST /api/delivery/withdraw
// @access  Private (Delivery Only)
const requestWithdrawal = async (req, res, next) => {
  try {
    const { amount, method } = req.body;

    if (!amount || amount < 20) {
      res.status(400);
      throw new Error('Minimum withdrawal amount is $20.00');
    }

    // Calculate current balance
    const paidOrders = await Order.find({
      deliveryPerson: req.user._id,
      deliveryFeeStatus: 'paid',
      withdrawalStatus: 'unwithdrawn'
    }).sort({ updatedAt: 1 }); // Oldest first
    
    const availableBalance = paidOrders.reduce((sum, o) => sum + (o.deliveryFee || 0), 0);

    if (amount > availableBalance) {
      res.status(400);
      throw new Error(`Insufficient funds. Your available balance is $${availableBalance.toFixed(2)}`);
    }

    // Mark orders as withdrawn
    let remainingToMark = amount;
    for (const order of paidOrders) {
      if (remainingToMark <= 0) break;
      order.withdrawalStatus = 'withdrawn';
      await order.save();
      remainingToMark -= order.deliveryFee;
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

// @desc    Get active delivery
// @route   GET /api/delivery/active
// @access  Private (Delivery Only)
const getActiveDelivery = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.activeDelivery) {
       return res.json(null);
    }
    
    const activeOrder = await Order.findById(user.activeDelivery)
       .populate('restaurant', 'name address contactNumber')
       .populate('user', 'name address phone');
       
    res.json(activeOrder);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAvailableOrders,
  toggleOnlineStatus,
  acceptOrder,
  updateDeliveryProgress,
  getDriverStats,
  getActiveDelivery,
  requestWithdrawal
};
