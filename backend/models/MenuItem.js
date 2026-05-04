const mongoose = require('mongoose');

const menuItemSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: {
      type: String,
      required: true,
      enum: ['Appetizers', 'Main Course', 'Fast Food', 'Desserts', 'Drinks'],
    },
    image: { type: String, required: true },
    restaurantId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Restaurant',
    },
    isAvailable: { type: Boolean, default: true },
    preparationTime: { type: Number, required: true }, // in minutes
    ingredients: { 
      type: [String], 
      required: true,
      validate: [v => Array.isArray(v) && v.length > 0, 'At least one ingredient is required']
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ restaurantId: 1 });
menuItemSchema.index({ category: 1 });
menuItemSchema.index({ isAvailable: 1 });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);
module.exports = MenuItem;
