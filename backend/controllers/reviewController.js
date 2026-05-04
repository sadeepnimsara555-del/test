const Review = require('../models/Review');
const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');

// @desc    Create new review
// @route   POST /api/reviews
// @access  Private
const createReview = async (req, res, next) => {
  const { restaurant, menuItem, rating, comment } = req.body;

  try {
    const review = new Review({
      user: req.user._id,
      restaurant,
      menuItem,
      rating,
      comment,
    });

    const createdReview = await review.save();
    res.status(201).json(createdReview);
  } catch (error) {
    next(error);
  }
};

// @desc    Update review
// @route   PUT /api/reviews/:id
// @access  Private
const updateReview = async (req, res, next) => {
  const { rating, comment } = req.body;

  try {
    const review = await Review.findById(req.params.id);

    if (review) {
      if (review.user.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to edit this review');
      }

      review.rating = rating || review.rating;
      review.comment = comment || review.comment;

      const updatedReview = await review.save();
      res.json(updatedReview);
    } else {
      res.status(404);
      throw new Error('Review not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get reviews by restaurant (General restaurant reviews only)
// @route   GET /api/reviews/restaurant/:restaurantId
// @access  Public
const getReviewsByRestaurant = async (req, res, next) => {
  try {
    // Only fetch reviews where menuItem is null (direct restaurant reviews)
    const reviews = await Review.find({ 
      restaurant: req.params.restaurantId,
      menuItem: { $exists: false } 
    })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all reviews for a restaurant (General + Food reviews for owner)
// @route   GET /api/reviews/restaurant/:restaurantId/all
// @access  Private/Owner
const getAllReviewsForRestaurant = async (req, res, next) => {
  try {
    const MenuItem = require('../models/MenuItem');
    const restaurantFoodItems = await MenuItem.find({ restaurantId: req.params.restaurantId }).select('_id');
    const foodIds = restaurantFoodItems.map(item => item._id);

    const reviews = await Review.find({
      $or: [
        { restaurant: req.params.restaurantId },
        { menuItem: { $in: foodIds } }
      ]
    })
      .populate('user', 'name profileImage')
      .populate('menuItem', 'name')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};


// @desc    Get reviews by menu item
// @route   GET /api/reviews/menu/:menuItemId
// @access  Public
const getReviewsByMenuItem = async (req, res, next) => {
  try {
    const reviews = await Review.find({ menuItem: req.params.menuItemId })
      .populate('user', 'name profileImage')
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete review
// @route   DELETE /api/reviews/:id
// @access  Private/Admin/Author
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findById(req.params.id);

    if (review) {
      if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this review');
      }

      await review.deleteOne();
      res.json({ message: 'Review removed' });
    } else {
      res.status(404);
      throw new Error('Review not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  updateReview,
  getReviewsByRestaurant,
  getAllReviewsForRestaurant,
  getReviewsByMenuItem,
  deleteReview,
};

