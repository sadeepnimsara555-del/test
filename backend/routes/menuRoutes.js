const express = require('express');
const {
  createMenuItem,
  getMenuItemsByRestaurant,
  getMenuItemById,
  updateMenuItem,
  deleteMenuItem,
  getAllMenuItems,
  trackInteraction,
  getRecommendations,
  handleDeepLinkRedirect,
} = require('../controllers/menuController');
const { protect, restaurantOwner } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

const router = express.Router();

router.route('/').post(protect, restaurantOwner, createMenuItem);
router.route('/all').get(getAllMenuItems);
router.route('/recommendations').get(protect, getRecommendations);
router.route('/restaurant/:restaurantId').get(getMenuItemsByRestaurant);
router.route('/deeplink/:id').get(handleDeepLinkRedirect);

router.post('/upload', protect, restaurantOwner, (req, res, next) => {
  console.log('--- Upload Request Received ---');
  upload.single('image')(req, res, (err) => {
    if (err) {
      console.error('Multer/Cloudinary Error:', err);
      return res.status(500).json({ message: err.message || 'Upload middleware error' });
    }
    if (!req.file) {
      console.log('No file in request.');
      return res.status(400).json({ message: 'No file uploaded' });
    }
    console.log('File uploaded successfully:', req.file.path);
    res.json({ imageUrl: req.file.path });
  });
});

router
  .route('/:id')
  .get(getMenuItemById)
  .put(protect, restaurantOwner, updateMenuItem)
  .delete(protect, restaurantOwner, deleteMenuItem);

router.route('/:id/view').post(protect, trackInteraction);

module.exports = router;
