const DeliveryReview = require('../models/DeliveryReview');
const Order = require('../models/Order');

// @desc    Create new delivery review
// @route   POST /api/delivery-reviews
// @access  Private (Customer)
const createDeliveryReview = async (req, res, next) => {
  const { deliveryPerson, order, rating, comment } = req.body;

  try {
    // Basic verification to ensure this user actually got this delivery
    const verifiedOrder = await Order.findById(order);
    if (!verifiedOrder) {
      res.status(404);
      throw new Error('Order not found');
    }

    if (verifiedOrder.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to review this order');
    }

    if (verifiedOrder.orderStatus !== 'delivered') {
      res.status(400);
      throw new Error('Cannot review a delivery before it is completed');
    }

    // Check if review already exists
    const existingReview = await DeliveryReview.findOne({ order: verifiedOrder._id });
    if (existingReview) {
      res.status(400);
      throw new Error('You have already reviewed this delivery');
    }

    const review = new DeliveryReview({
      user: req.user._id,
      deliveryPerson,
      order,
      rating,
      comment,
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews for a specific delivery person
// @route   GET /api/delivery-reviews/driver
// @access  Private (Delivery Driver)
const getDriverReviews = async (req, res, next) => {
  try {
    const reviews = await DeliveryReview.find({ deliveryPerson: req.user._id })
      .populate('user', 'name profileImage')
      .populate('order', 'totalAmount items createdAt')
      .sort({ createdAt: -1 });

    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery review
// @route   PUT /api/delivery-reviews/:id
// @access  Private (Customer)
const updateDeliveryReview = async (req, res, next) => {
  try {
    const review = await DeliveryReview.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    if (review.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to update this review');
    }

    review.rating = req.body.rating || review.rating;
    review.comment = req.body.comment || review.comment;

    const updatedReview = await review.save();
    res.json(updatedReview);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete delivery review
// @route   DELETE /api/delivery-reviews/:id
// @access  Private (Customer)
const deleteDeliveryReview = async (req, res, next) => {
  try {
    const review = await DeliveryReview.findById(req.params.id);

    if (!review) {
      res.status(404);
      throw new Error('Review not found');
    }

    if (review.user.toString() !== req.user._id.toString()) {
      res.status(401);
      throw new Error('Not authorized to delete this review');
    }

    await DeliveryReview.deleteOne({ _id: req.params.id });
    res.json({ message: 'Review removed' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createDeliveryReview,
  getDriverReviews,
  updateDeliveryReview,
  deleteDeliveryReview,
};
