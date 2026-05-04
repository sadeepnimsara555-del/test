const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../utils/sendEmail');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
  const { name, email, password, address, phone, role, restaurantName } = req.body;

  try {
    const userExists = await User.findOne({ email });

    if (userExists) {
      res.status(400);
      throw new Error('User already exists');
    }

    const user = await User.create({
      name,
      email,
      password,
      address,
      phone,
      role: role || 'user',
      receiveEmailNotifications: req.body.receiveEmailNotifications || false,
    });

    if (user) {
      // Automatically create a Restaurant entry if the user is a restaurant owner
      if (user.role === 'restaurant_owner') {
        const Restaurant = require('../models/Restaurant');
        await Restaurant.create({
          name: restaurantName || `${user.name}'s Restaurant`,
          description: `Welcome to ${restaurantName || user.name + "'s Restaurant"}! We serve delicious meals made with love.`,
          address: user.address || 'Address not provided',
          openingHours: '9:00 AM - 10:00 PM',
          contactNumber: user.phone || 'Phone not provided',
          ownerId: user._id,
        });
      }

      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        profileImage: user.profileImage,
        receiveEmailNotifications: user.receiveEmailNotifications,
        vehicleInfo: user.vehicleInfo,
        isOnline: user.isOnline,
        withdrawalMethods: user.withdrawalMethods || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(400);
      throw new Error('Invalid user data');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        profileImage: user.profileImage,
        receiveEmailNotifications: user.receiveEmailNotifications,
        vehicleInfo: user.vehicleInfo,
        isOnline: user.isOnline,
        withdrawalMethods: user.withdrawalMethods || [],
        token: generateToken(user._id),
      });
    } else {
      res.status(401);
      throw new Error('Invalid email or password');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        address: user.address,
        phone: user.phone,
        profileImage: user.profileImage,
        receiveEmailNotifications: user.receiveEmailNotifications,
        withdrawalMethods: user.withdrawalMethods || [],
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      if (req.body.name) user.name = req.body.name;
      if (req.body.email) user.email = req.body.email;
      if (req.body.address) user.address = req.body.address;
      if (req.body.phone) user.phone = req.body.phone;
      if (req.body.profileImage) user.profileImage = req.body.profileImage;
      if (req.body.receiveEmailNotifications !== undefined) {
        user.receiveEmailNotifications = req.body.receiveEmailNotifications;
        user.markModified('receiveEmailNotifications');
      }
      if (req.body.password) {
        user.password = req.body.password;
      }
      if (req.body.withdrawalMethods) {
        user.withdrawalMethods = req.body.withdrawalMethods;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        address: updatedUser.address,
        phone: updatedUser.phone,
        profileImage: updatedUser.profileImage,
        receiveEmailNotifications: updatedUser.receiveEmailNotifications,
        vehicleInfo: updatedUser.vehicleInfo,
        isOnline: updatedUser.isOnline,
        withdrawalMethods: updatedUser.withdrawalMethods || [],
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    console.error('Update Profile Error:', error.message);
    next(error);
  }
};

// @desc    Delete user profile
// @route   DELETE /api/auth/profile
// @access  Private
const deleteUserProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      const { reason } = req.body;
      if (!reason) {
        res.status(400);
        throw new Error('Please provide a reason for account deletion');
      }

      // Log deletion reason if needed or perform cleanup
      console.log(`User ${user.email} deleting account. Reason: ${reason}`);

      // Cascading deletion for Restaurant Owners
      if (user.role === 'restaurant_owner') {
        const Restaurant = require('../models/Restaurant');
        const MenuItem = require('../models/MenuItem');
        const Review = require('../models/Review');

        const restaurant = await Restaurant.findOne({ ownerId: user._id });
        if (restaurant) {
          // Delete all food items
          await MenuItem.deleteMany({ restaurantId: restaurant._id });
          // Delete all reviews (both restaurant reviews and food reviews)
          await Review.deleteMany({ 
            $or: [
              { restaurant: restaurant._id },
              { menuItem: { $in: await MenuItem.find({ restaurantId: restaurant._id }).distinct('_id') } }
            ]
          });
          // Delete the restaurant entry
          await restaurant.deleteOne();
        }
      }

      await user.deleteOne();
      res.json({ message: 'User account deleted successfully' });
    } else {
      res.status(404);
      throw new Error('User not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Initiate forgot password flow
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res, next) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404);
      throw new Error("Can't send OTP because email is not registered");
    }

    // Generate 5-digit OTP
    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 2 * 60 * 1000; // 2 minutes
    await user.save({ validateBeforeSave: false }); // Skip validation in case password doesn't change

    const message = `
      <h1>Password Reset OTP</h1>
      <p>Your OTP to reset your password is: <strong>${otp}</strong></p>
      <p>This OTP will expire in 2 minutes.</p>
      <p>If you did not request a password reset, please ignore this email.</p>
    `;

    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset OTP - Foodie App',
        html: message,
      });
      res.status(200).json({ success: true, message: 'OTP sent to your email address' });
    } catch (err) {
      user.resetPasswordOTP = undefined;
      user.resetPasswordExpires = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500);
      throw new Error('Email could not be sent');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res, next) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    res.status(200).json({ success: true, message: 'OTP verified successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Reset password using OTP
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res, next) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      resetPasswordOTP: otp,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400);
      throw new Error('Invalid or expired OTP');
    }

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save(); // pre('save') hook handles hashing and complexity validation

    res.status(200).json({ success: true, message: 'Password reset successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerUser,
  loginUser,
  getUserProfile,
  updateUserProfile,
  deleteUserProfile,
  forgotPassword,
  verifyOTP,
  resetPassword,
};
