const express = require('express');
const router = express.Router();
const { getAllUsers, getStats, deleteUser, getAllBooks, deleteAdminBook, updateUserRole } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.use(protect, authorize('ADMIN'));

router.get('/users', getAllUsers);
router.put('/users/:id/role', updateUserRole);
router.delete('/users/:id', deleteUser);
router.get('/stats', getStats);
router.get('/books', getAllBooks);
router.delete('/books/:id', deleteAdminBook);

module.exports = router;

