const mongoose = require('mongoose');

const orderSchema = mongoose.Schema(
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
    deliveryPerson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    items: [
      {
        menuItem: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
          ref: 'MenuItem',
        },
        name: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
      },
    ],
    totalAmount: { type: Number, required: true },
    orderType: {
      type: String,
      required: true,
      enum: ['delivery', 'takeaway'],
    },
    deliveryAddress: { type: String },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['card', 'cash', 'online'],
    },
    onlineProvider: {
      type: String,
      enum: ['card', 'paypal'],
    },
    paymentStatus: {
      type: String,
      required: true,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      required: true,
      enum: [
        'placed',
        'confirmed',
        'preparing',
        'ready_for_delivery',
        'accepted',
        'picked_up',
        'on_the_way',
        'delivered',
        'cancelled',
      ],
      default: 'placed',
    },
    deliveryFee: { type: Number, default: 0 },
    deliveryFeeStatus: {
      type: String,
      required: true,
      enum: ['n/a', 'pending', 'paid'],
      default: 'n/a',
    },
    withdrawalStatus: {
      type: String,
      enum: ['unwithdrawn', 'withdrawn'],
      default: 'unwithdrawn'
    },
    restaurantWithdrawalStatus: {
      type: String,
      enum: ['unwithdrawn', 'withdrawn'],
      default: 'unwithdrawn'
    }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
