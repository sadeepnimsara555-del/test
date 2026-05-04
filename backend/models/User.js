const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      required: true,
      enum: ['user', 'admin', 'restaurant_owner', 'delivery'],
      default: 'user',
    },
    address: { type: String },
    phone: { type: String },
    profileImage: { type: String, default: '' },
    interests: {
      type: Map,
      of: Number,
      default: {},
    },
    receiveEmailNotifications: {
      type: Boolean,
      default: false,
    },
    vehicleInfo: { type: String },
    isOnline: { type: Boolean, default: false },
    activeDelivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null
    },
    withdrawalMethods: [
      {
        type: { type: String, enum: ['card', 'paypal'] },
        details: {
          cardNumber: String,
          expiry: String,
          cvv: String,
          email: String,
        },
        isDefault: { type: Boolean, default: false }
      }
    ],
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date }
  },
  { timestamps: true }
);

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  // Password complexity validation
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%])[A-Za-z\d!@#$%]{8,}$/;
  if (!passwordRegex.test(this.password)) {
    throw new Error('Password must be at least 8 characters, include uppercase, lowercase, number and special character (!@#$%)');
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

const User = mongoose.model('User', userSchema);
module.exports = User;
