const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password');
      if (!req.user) {
        res.status(401);
        throw new Error('User not found');
      }
      return next();
    } catch (error) {
      console.error(error);
      res.status(401);
      const err = new Error('Not authorized, token failed');
      return next(err);
    }
  }

  if (!token) {
    res.status(401);
    const err = new Error('Not authorized, no token');
    return next(err);
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(401);
    const err = new Error('Not authorized as an admin');
    next(err);
  }
};

const restaurantOwner = (req, res, next) => {
  if (req.user && (req.user.role === 'restaurant_owner' || req.user.role === 'admin')) {
    next();
  } else {
    res.status(401);
    const err = new Error('Not authorized as a restaurant owner');
    next(err);
  }
};

module.exports = { protect, admin, restaurantOwner };
