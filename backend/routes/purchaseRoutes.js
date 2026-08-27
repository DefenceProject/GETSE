const express = require('express');
const router = express.Router();
const { purchaseBook, getMyLibrary, getAuthorRevenue } = require('../controllers/purchaseController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/', protect, purchaseBook);
router.get('/library', protect, getMyLibrary);
router.get('/revenue', protect, authorize('AUTHOR', 'ADMIN'), getAuthorRevenue);

module.exports = router;
