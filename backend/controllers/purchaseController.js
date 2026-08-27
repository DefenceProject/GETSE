const db = require('../config/db');

// @desc    Purchase a book
// @route   POST /api/purchases
// @access  Private (Reader)
const purchaseBook = async (req, res, next) => {
  try {
    const { book_id } = req.body;
    const user_id = req.user.id;

    // Check book exists
    const book = await db.query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (book.rows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }

    // Check if already purchased
    const existing = await db.query(
      'SELECT * FROM purchases WHERE user_id = $1 AND book_id = $2',
      [user_id, book_id]
    );
    if (existing.rows.length > 0) {
      res.status(400);
      throw new Error('You have already purchased this book');
    }

    // Record purchase
    const { rows } = await db.query(
      'INSERT INTO purchases (user_id, book_id) VALUES ($1, $2) RETURNING *',
      [user_id, book_id]
    );

    res.status(201).json({
      message: 'Book purchased successfully',
      purchase: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get user's purchased library
// @route   GET /api/purchases/library
// @access  Private
const getMyLibrary = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.id, b.title, b.description, b.cover_image_url, b.file_url,
              b.language, u.username AS author_name, p.purchase_date
       FROM purchases p
       JOIN books b ON p.book_id = b.id
       JOIN users u ON b.author_id = u.id
       WHERE p.user_id = $1
       ORDER BY p.purchase_date DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// @desc    Get author's revenue dashboard
// @route   GET /api/purchases/revenue
// @access  Private (Author, Admin)
const getAuthorRevenue = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.title, COUNT(p.id) AS total_sales, SUM(b.price) AS total_revenue
       FROM books b
       LEFT JOIN purchases p ON b.id = p.book_id
       WHERE b.author_id = $1
       GROUP BY b.title
       ORDER BY total_sales DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

module.exports = { purchaseBook, getMyLibrary, getAuthorRevenue };
