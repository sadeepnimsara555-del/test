const mongoose = require('mongoose');

const deliveryReviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
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

const DeliveryReview = mongoose.model('DeliveryReview', deliveryReviewSchema);
module.exports = DeliveryReview;
