const Restaurant = require('../models/Restaurant');

// @desc    Create a restaurant
// @route   POST /api/restaurants
// @access  Private/Owner/Admin
const createRestaurant = async (req, res, next) => {
  const { name, description, address, openingHours, contactNumber, logo, coverImage } = req.body;

  try {
    const restaurant = new Restaurant({
      name,
      description,
      address,
      openingHours,
      contactNumber,
      logo,
      coverImage,
      ownerId: req.user._id,
    });

    const createdRestaurant = await restaurant.save();
    res.status(201).json(createdRestaurant);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all restaurants
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res, next) => {
  try {
    const restaurants = await Restaurant.find({ isActive: true }).lean();
    
    const Review = require('../models/Review');
    
    const restaurantsWithRatings = await Promise.all(restaurants.map(async (restaurant) => {
      const MenuItem = require('../models/MenuItem');
      const restaurantFoodItems = await MenuItem.find({ restaurantId: restaurant._id }).select('_id');
      const foodIds = restaurantFoodItems.map(item => item._id);

      const stats = await Review.aggregate([
        { 
          $match: { 
            $or: [
              { restaurant: restaurant._id },
              { menuItem: { $in: foodIds } }
            ]
          } 
        },
        { 
          $group: { 
            _id: null, 
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 }
          } 
        }
      ]);
      
      return {
        ...restaurant,
        rating: stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0,
        reviewCount: stats.length > 0 ? stats[0].count : 0
      };
    }));


    res.json(restaurantsWithRatings);
  } catch (error) {
    next(error);
  }
};


// @desc    Get restaurant by ID
// @route   GET /api/restaurants/:id
// @access  Public
const getRestaurantById = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id).lean();

    if (restaurant) {
      const Review = require('../models/Review');
      const MenuItem = require('../models/MenuItem');
      const restaurantFoodItems = await MenuItem.find({ restaurantId: restaurant._id }).select('_id');
      const foodIds = restaurantFoodItems.map(item => item._id);

      const stats = await Review.aggregate([
        { 
          $match: { 
            $or: [
              { restaurant: restaurant._id },
              { menuItem: { $in: foodIds } }
            ]
          } 
        },
        { 
          $group: { 
            _id: null, 
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 }
          } 
        }
      ]);

      restaurant.rating = stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0;
      restaurant.reviewCount = stats.length > 0 ? stats[0].count : 0;

      
      res.json(restaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};


// @desc    Update restaurant
// @route   PUT /api/restaurants/:id
// @access  Private/Owner/Admin
const updateRestaurant = async (req, res, next) => {
  const { name, description, address, openingHours, contactNumber, logo, coverImage, isActive } = req.body;

  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (restaurant) {
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this restaurant');
      }

      restaurant.name = name || restaurant.name;
      restaurant.description = description || restaurant.description;
      restaurant.address = address || restaurant.address;
      restaurant.openingHours = openingHours || restaurant.openingHours;
      restaurant.contactNumber = contactNumber || restaurant.contactNumber;
      restaurant.logo = logo || restaurant.logo;
      restaurant.coverImage = coverImage || restaurant.coverImage;
      restaurant.isActive = isActive !== undefined ? isActive : restaurant.isActive;

      const updatedRestaurant = await restaurant.save();
      res.json(updatedRestaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete restaurant
// @route   DELETE /api/restaurants/:id
// @access  Private/Owner/Admin
const deleteRestaurant = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (restaurant) {
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this restaurant');
      }

      await restaurant.deleteOne();
      res.json({ message: 'Restaurant removed' });
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant logo
// @route   PUT /api/restaurants/:id/logo
// @access  Private/Owner/Admin
const updateRestaurantLogo = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (restaurant) {
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this restaurant');
      }

      if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
      }

      restaurant.logo = req.file.path;
      const updatedRestaurant = await restaurant.save();
      res.json(updatedRestaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Update restaurant cover image
// @route   PUT /api/restaurants/:id/cover
// @access  Private/Owner/Admin
const updateRestaurantCoverImage = async (req, res, next) => {
  try {
    const restaurant = await Restaurant.findById(req.params.id);

    if (restaurant) {
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this restaurant');
      }

      if (!req.file) {
        res.status(400);
        throw new Error('No image file provided');
      }

      restaurant.coverImage = req.file.path;
      const updatedRestaurant = await restaurant.save();
      res.json(updatedRestaurant);
    } else {
      res.status(404);
      throw new Error('Restaurant not found');
    }
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRestaurant,
  getRestaurants,
  getRestaurantById,
  updateRestaurant,
  deleteRestaurant,
  updateRestaurantLogo,
  updateRestaurantCoverImage,
};
