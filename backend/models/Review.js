const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    restaurant: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Restaurant',
    },
    menuItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MenuItem',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: { type: String, required: true },
  },
  { timestamps: true }
);

reviewSchema.index({ menuItem: 1 });
reviewSchema.index({ restaurant: 1 });

const Review = mongoose.model('Review', reviewSchema);
module.exports = Review;
