const db = require('../config/db');

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// @desc    Get system-wide stats (Admin)
// @route   GET /api/admin/stats
// @access  Private/Admin
const getStats = async (req, res, next) => {
  try {
    const users = await db.query('SELECT COUNT(*) FROM users');
    const books = await db.query('SELECT COUNT(*) FROM books');
    const purchases = await db.query('SELECT COUNT(*) FROM purchases');
    const revenue = await db.query('SELECT COALESCE(SUM(b.price), 0) AS total_revenue FROM purchases p JOIN books b ON p.book_id = b.id');

    res.json({
      totalUsers: parseInt(users.rows[0].count),
      totalBooks: parseInt(books.rows[0].count),
      totalPurchases: parseInt(purchases.rows[0].count),
      totalRevenue: parseFloat(revenue.rows[0].total_revenue),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }
    await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    res.json({ message: 'User removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all books for admin
// @route   GET /api/admin/books
// @access  Private/Admin
const getAllBooks = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.id, b.title, b.price, b.language, b.published_at, u.username as author_name, u.email as author_email
       FROM books b JOIN users u ON b.author_id = u.id
       ORDER BY b.published_at DESC`
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// @desc    Admin delete any book
// @route   DELETE /api/admin/books/:id
// @access  Private/Admin
const deleteAdminBook = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    await db.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ message: 'Book removed by admin' });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user role (Admin)
// @route   PUT /api/admin/users/:id/role
// @access  Private/Admin
const updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['READER', 'AUTHOR', 'ADMIN'].includes(role)) {
      res.status(400);
      throw new Error('Invalid role');
    }
    const { rows } = await db.query('UPDATE users SET role = $1 WHERE id = $2 RETURNING id, username, email, role', [role, req.params.id]);
    if (rows.length === 0) {
      res.status(404);
      throw new Error('User not found');
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllUsers, getStats, deleteUser, getAllBooks, deleteAdminBook, updateUserRole };

