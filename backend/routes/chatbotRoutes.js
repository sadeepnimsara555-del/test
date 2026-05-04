const express = require('express');
const { processQuery } = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/query', protect, processQuery);

module.exports = router;
