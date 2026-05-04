const mongoose = require('mongoose');

const restaurantSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    address: { type: String, required: true },
    logo: { type: String, default: '' },
    coverImage: { type: String, default: '' },
    openingHours: { type: String, required: true },
    contactNumber: { type: String, required: true },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Restaurant = mongoose.model('Restaurant', restaurantSchema);
module.exports = Restaurant;
