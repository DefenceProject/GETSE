const express = require('express');
const router = express.Router();
const { getBooks, getBookById, createBook, updateBook, deleteBook, streamBookFile, downloadBook } = require('../controllers/bookController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/', getBooks);
router.get('/:id', getBookById);
router.get('/:id/read', protect, streamBookFile);
router.get('/:id/download', protect, downloadBook);
router.post('/', protect, authorize('AUTHOR', 'ADMIN'), createBook);
router.put('/:id', protect, authorize('AUTHOR', 'ADMIN'), updateBook);
router.delete('/:id', protect, authorize('AUTHOR', 'ADMIN'), deleteBook);

module.exports = router;

