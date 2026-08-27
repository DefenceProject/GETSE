const express = require('express');
const router = express.Router();
const { getWritingFeedback } = require('../controllers/aiController');
const { protect } = require('../middleware/authMiddleware');

router.post('/writing-assistant', protect, getWritingFeedback);

module.exports = router;
