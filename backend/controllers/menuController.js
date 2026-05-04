const MenuItem = require('../models/MenuItem');
const Restaurant = require('../models/Restaurant');
const User = require('../models/User');
const sendEmail = require('../utils/sendEmail');
const { getNewFoodTemplate, getDeletedFoodTemplate } = require('../utils/emailTemplates');

// @desc    Create a menu item
// @route   POST /api/menu
// @access  Private/Owner/Admin
const createMenuItem = async (req, res, next) => {
  const { name, description, price, category, image, restaurantId, preparationTime, ingredients } = req.body;

  if (!name || !description || !price || !category || !image || !restaurantId || !ingredients) {
    res.status(400);
    throw new Error('Please provide all required fields (name, description, price, category, image, restaurantId, ingredients)');
  }

  try {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      res.status(404);
      throw new Error('Restaurant not found');
    }

    if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to add menu items to this restaurant');
    }

    const menuItem = new MenuItem({
      name,
      description,
      price,
      category,
      image,
      restaurantId,
      preparationTime,
      ingredients,
    });

    const createdMenuItem = await menuItem.save();

    // Send email notifications to opted-in users
    console.log('📧 EMAIL_USER loaded:', process.env.EMAIL_USER ? process.env.EMAIL_USER : '❌ MISSING');
    const optedInUsers = await User.find({ receiveEmailNotifications: true });
    console.log(`📋 Opted-in users found: ${optedInUsers.length}`);

    if (optedInUsers.length > 0) {
      const backendUrl = `${req.protocol}://${req.get('host')}`;
      const redirectUrl = `${backendUrl}/api/menu/deeplink/${createdMenuItem._id}`;

      const emailHtml = getNewFoodTemplate(
        name, 
        restaurant.name, 
        category, 
        price, 
        description, 
        image, 
        process.env.FRONTEND_URL || 'http://localhost:3000',
        redirectUrl
      );

      for (const user of optedInUsers) {
        console.log(`📨 Sending beautiful email to: ${user.email}`);
        try {
          await sendEmail({
            email: user.email,
            subject: `✨ New Delight: ${name} is now at ${restaurant.name}!`,
            html: emailHtml,
          });
        } catch (err) {
          console.error(`❌ Email failed for ${user.email}:`, err.message);
        }
      }
    } else {
      console.log('ℹ️ No users have email notifications enabled.');
    }


    res.status(201).json(createdMenuItem);
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu items by restaurant
// @route   GET /api/menu/restaurant/:restaurantId
// @access  Public
const getMenuItemsByRestaurant = async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({ restaurantId: req.params.restaurantId });
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
};

// @desc    Get menu item by ID
// @route   GET /api/menu/:id
// @access  Public
const getMenuItemById = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id).lean();

    if (menuItem) {
      const Review = require('../models/Review');
      const stats = await Review.aggregate([
        { $match: { menuItem: menuItem._id } },
        { 
          $group: { 
            _id: null, 
            avgRating: { $avg: "$rating" },
            count: { $sum: 1 }
          } 
        }
      ]);

      menuItem.rating = stats.length > 0 ? Number(stats[0].avgRating.toFixed(1)) : 0;
      menuItem.reviewCount = stats.length > 0 ? stats[0].count : 0;

      res.json(menuItem);
    } else {
      res.status(404);
      throw new Error('Menu item not found');
    }
  } catch (error) {
    next(error);
  }
};


// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private/Owner/Admin
const updateMenuItem = async (req, res, next) => {
  const { name, description, price, category, image, isAvailable, preparationTime, ingredients } = req.body;

  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (menuItem) {
      const restaurant = await Restaurant.findById(menuItem.restaurantId);
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this menu item');
      }

      menuItem.name = name || menuItem.name;
      menuItem.description = description || menuItem.description;
      menuItem.price = price || menuItem.price;
      menuItem.category = category || menuItem.category;
      menuItem.image = image || menuItem.image;
      menuItem.isAvailable = isAvailable !== undefined ? isAvailable : menuItem.isAvailable;
      menuItem.preparationTime = preparationTime || menuItem.preparationTime;
      menuItem.ingredients = ingredients || menuItem.ingredients;

      const updatedMenuItem = await menuItem.save();
      res.json(updatedMenuItem);
    } else {
      res.status(404);
      throw new Error('Menu item not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private/Owner/Admin
const deleteMenuItem = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);

    if (menuItem) {
      const restaurant = await Restaurant.findById(menuItem.restaurantId);
      if (restaurant.ownerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this menu item');
      }

      const itemName = menuItem.name;
      const restaurantName = restaurant.name;

      await menuItem.deleteOne();

      // Send deletion notifications to opted-in users
      const optedInUsers = await User.find({ receiveEmailNotifications: true });
      if (optedInUsers.length > 0) {
        const deletionHtml = getDeletedFoodTemplate(itemName, restaurantName);
        
        for (const user of optedInUsers) {
          try {
            await sendEmail({
              email: user.email,
              subject: `Menu Update: Farewell to ${itemName}`,
              html: deletionHtml,
            });
          } catch (err) {
            console.error(`❌ Deletion email failed for ${user.email}:`, err.message);
          }
        }
      }

      res.json({ message: 'Menu item removed' });
    } else {
      res.status(404);
      throw new Error('Menu item not found');
    }
  } catch (error) {
    next(error);
  }
};

// @desc    Get all menu items
// @route   GET /api/menu/all
// @access  Public
const getAllMenuItems = async (req, res, next) => {
  try {
    const menuItems = await MenuItem.find({ isAvailable: true }).populate('restaurantId', 'name image address').lean();
    
    if (menuItems.length === 0) {
      return res.json([]);
    }

    const Review = require('../models/Review');
    const menuItemIds = menuItems.map(item => item._id);

    // Get all ratings in one go
    const stats = await Review.aggregate([
      { $match: { menuItem: { $in: menuItemIds } } },
      { 
        $group: { 
          _id: "$menuItem", 
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        } 
      }
    ]);

    // Create a map for quick lookup
    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id.toString()] = {
        rating: Number(stat.avgRating.toFixed(1)),
        reviewCount: stat.count
      };
      return acc;
    }, {});

    const menuItemsWithRatings = menuItems.map(item => ({
      ...item,
      rating: statsMap[item._id.toString()]?.rating || 0,
      reviewCount: statsMap[item._id.toString()]?.reviewCount || 0
    }));

    res.json(menuItemsWithRatings);
  } catch (error) {
    next(error);
  }
};


// @desc    Track user interaction with a menu item
// @route   POST /api/menu/:id/view
// @access  Private
const trackInteraction = async (req, res, next) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({ message: 'Menu item not found' });
    }

    if (req.user) {
      // Re-fetch user to ensure we have a full Mongoose document with all features
      const user = await User.findById(req.user._id);
      if (user) {
        // Initialize interests if it doesn't exist (crucial for old docs)
        if (!user.interests) {
          user.interests = new Map();
        }
        
        const count = user.interests.get(menuItem.category) || 0;
        user.interests.set(menuItem.category, count + 1);
        
        user.markModified('interests');
        await user.save();
      }
    }

    res.status(200).json({ message: 'Interaction tracked' });
  } catch (error) {
    console.error('Track Interaction Error:', error.message);
    next(error);
  }
};

// @desc    Get smart recommendations for user
// @route   GET /api/menu/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
  try {
    const user = req.user;
    const { category, excludeId } = req.query;

    const TOTAL_LIMIT = 6;

    // ─── "You may also like" path (category provided) ──────────────────────
    if (category) {
      // STEP 1: Get ALL available items in the same category (excluding current item)
      // No artificial limit here — we want to know how many exist
      const sameCategoryItems = await MenuItem.find({
        category,
        _id: { $ne: excludeId },
        isAvailable: true,
      }).populate('restaurantId', 'name image address');

      // STEP 2: Already have 6 or more → return top 6 from same category only
      if (sameCategoryItems.length >= TOTAL_LIMIT) {
        return res.json(sameCategoryItems.slice(0, TOTAL_LIMIT));
      }

      // STEP 3: Not enough same-category items → fill remaining from OTHER categories
      const slotsLeft = TOTAL_LIMIT - sameCategoryItems.length;
      const excludedIds = [
        ...sameCategoryItems.map((i) => i._id),
        ...(excludeId ? [excludeId] : []),
      ];

      const otherItems = await MenuItem.find({
        category: { $ne: category }, // any other category
        _id: { $nin: excludedIds },
        isAvailable: true,
      })
        .limit(slotsLeft)
        .populate('restaurantId', 'name image address');

      // Same category items always appear first
      const result = [...sameCategoryItems, ...otherItems];
      return res.json(result.slice(0, TOTAL_LIMIT));
    }

    // ─── "For You" personalised path (no category) ─────────────────────────
    let recommendedItems = [];

    if (user && user.interests) {
      const interestsMap =
        user.interests instanceof Map
          ? user.interests
          : new Map(Object.entries(user.interests));

      if (interestsMap.size > 0) {
        const topCategories = Array.from(interestsMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map((entry) => entry[0]);

        // Fetch up to 20 items to allow variety
        const candidates = await MenuItem.find({
          category: { $in: topCategories },
          isAvailable: true,
        })
          .limit(20)
          .populate('restaurantId', 'name image address');
          
        recommendedItems = candidates.sort(() => 0.5 - Math.random()).slice(0, TOTAL_LIMIT);
      }
    }

    // Fallback: fill with any items if personalisation didn't produce enough
    if (recommendedItems.length < TOTAL_LIMIT) {
      const fallback = await MenuItem.find({
        _id: { $nin: recommendedItems.map((i) => i._id) },
        isAvailable: true,
      })
        .limit(20)
        .populate('restaurantId', 'name image address');

      const shuffledFallback = fallback.sort(() => 0.5 - Math.random()).slice(0, TOTAL_LIMIT - recommendedItems.length);
      recommendedItems = [...recommendedItems, ...shuffledFallback];
    }

    // Final shuffle so interests and fallbacks mix together naturally
    recommendedItems = recommendedItems.sort(() => 0.5 - Math.random());
    
    let finalItems = recommendedItems.slice(0, TOTAL_LIMIT);
    
    // Add rating calculation to match the all items endpoint
    const Review = require('../models/Review');
    const finalItemIds = finalItems.map(item => item._id);

    const stats = await Review.aggregate([
      { $match: { menuItem: { $in: finalItemIds } } },
      { 
        $group: { 
          _id: "$menuItem", 
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 }
        } 
      }
    ]);

    const statsMap = stats.reduce((acc, stat) => {
      acc[stat._id.toString()] = {
        rating: Number(stat.avgRating.toFixed(1)),
        reviewCount: stat.count
      };
      return acc;
    }, {});

    const itemsWithRatings = finalItems.map(item => {
      const itemObj = item.toObject ? item.toObject() : item;
      return {
        ...itemObj,
        rating: statsMap[item._id.toString()]?.rating || 0,
        reviewCount: statsMap[item._id.toString()]?.reviewCount || 0
      };
    });

    res.json(itemsWithRatings);
  } catch (error) {
    next(error);
  }
};

// @desc    Handle deep link redirect for email clients
// @route   GET /api/menu/deeplink/:id
// @access  Public
const handleDeepLinkRedirect = (req, res) => {
  const { id } = req.params;
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Opening Foodie App...</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; background-color: #f8f9fa; color: #2d3436; text-align: center; padding: 20px; }
          .container { background: white; padding: 40px; border-radius: 24px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); max-width: 400px; width: 100%; }
          .spinner { border: 4px solid rgba(255, 71, 87, 0.2); border-left-color: #ff4757; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          h1 { margin: 0 0 10px; font-size: 24px; color: #2d3436; font-weight: 800; }
          p { margin: 0 0 30px; color: #636e72; line-height: 1.5; font-size: 15px; }
          a { display: inline-block; background: linear-gradient(135deg, #ff4757 0%, #ff6b81 100%); color: white; padding: 14px 28px; text-decoration: none; border-radius: 14px; font-weight: 700; box-shadow: 0 4px 15px rgba(255, 71, 87, 0.3); font-size: 16px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="spinner"></div>
          <h1>Opening Foodie App...</h1>
          <p>You are being redirected to the app. If nothing happens automatically, tap the button below.</p>
          <a href="foodieapp://menu/${id}">Open App Now</a>
        </div>
        <script>
          setTimeout(function() {
            window.location.href = "foodieapp://menu/${id}";
          }, 500);
        </script>
      </body>
    </html>
  `);
};

module.exports = {
  createMenuItem,
  getMenuItemsByRestaurant,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  trackInteraction,
  getRecommendations,
  handleDeepLinkRedirect,
};
