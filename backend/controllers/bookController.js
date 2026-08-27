const db = require('../config/db');

// @desc    Get all published books / Search books
// @route   GET /api/books
// @access  Public
const getBooks = async (req, res, next) => {
  try {
    const { search, language, author_id, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT b.id, b.title, b.description, b.cover_image_url, b.price, b.language,
             b.published_at, u.username AS author_name, u.id AS author_id,
             COUNT(p.id) AS total_purchases
      FROM books b
      JOIN users u ON b.author_id = u.id
      LEFT JOIN purchases p ON b.id = p.book_id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      query += ` AND (b.title ILIKE $${params.length} OR b.description ILIKE $${params.length} OR u.username ILIKE $${params.length})`;
    }
    if (language) {
      params.push(language);
      query += ` AND b.language = $${params.length}`;
    }
    if (author_id) {
      params.push(author_id);
      query += ` AND b.author_id = $${params.length}`;
    }

    query += ` GROUP BY b.id, u.username, u.id ORDER BY b.published_at DESC`;

    params.push(limit);
    query += ` LIMIT $${params.length}`;
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// @desc    Get single book by ID
// @route   GET /api/books/:id
// @access  Public
const getBookById = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT b.*, u.username AS author_name
       FROM books b JOIN users u ON b.author_id = u.id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (rows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new book (Author only)
// @route   POST /api/books
// @access  Private (Author, Admin)
const createBook = async (req, res, next) => {
  try {
    const { title, description, cover_image_url, file_url, patent_url, price, language } = req.body;
    if (!title || !file_url || !patent_url) {
      res.status(400);
      throw new Error('Title, file URL, and Patent/Copyright document URL are required');
    }
    const { rows } = await db.query(
      `INSERT INTO books (author_id, title, description, cover_image_url, file_url, patent_url, price, language)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [req.user.id, title, description, cover_image_url, file_url, patent_url, price || 0.0, language || 'Amharic']
    );
    res.status(201).json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Update a book (Author only — own books)
// @route   PUT /api/books/:id
// @access  Private (Author, Admin)
const updateBook = async (req, res, next) => {
  try {
    const { rows: existing } = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (existing.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    if (existing[0].author_id !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to update this book');
    }
    const { title, description, cover_image_url, file_url, patent_url, price, language } = req.body;
    const { rows } = await db.query(
      `UPDATE books SET title=$1, description=$2, cover_image_url=$3, file_url=$4, patent_url=$5, price=$6, language=$7
       WHERE id=$8 RETURNING *`,
      [
        title || existing[0].title,
        description || existing[0].description,
        cover_image_url || existing[0].cover_image_url,
        file_url || existing[0].file_url,
        patent_url || existing[0].patent_url,
        price !== undefined ? price : existing[0].price,
        language || existing[0].language,
        req.params.id,
      ]
    );
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private (Author own books, Admin)
const deleteBook = async (req, res, next) => {
  try {
    const { rows } = await db.query('SELECT * FROM books WHERE id = $1', [req.params.id]);
    if (rows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    if (rows[0].author_id !== req.user.id && req.user.role !== 'ADMIN') {
      res.status(403);
      throw new Error('Not authorized to delete this book');
    }
    await db.query('DELETE FROM books WHERE id = $1', [req.params.id]);
    res.json({ message: 'Book removed' });
  } catch (error) {
    next(error);
  }
};

// @desc    Stream or download book file securely (DRM verification)
// @route   GET /api/books/:id/read
// @access  Private (Reader who bought it, Author who wrote it, Admin)
const streamBookFile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;
    const bookId = req.params.id;

    // Fetch the book
    const { rows: bookRows } = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
    if (bookRows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    const book = bookRows[0];

    let isAuthorized = false;

    // Check authorization
    if (userRole === 'ADMIN' || book.author_id === userId) {
      isAuthorized = true;
    } else {
      const { rows: purchaseRows } = await db.query('SELECT * FROM purchases WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
      if (purchaseRows.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      res.status(403);
      throw new Error('You must purchase this book to read it');
    }

    // In a real S3 integration, you'd generate a presigned URL here.
    // For this prototype, we redirect to the actual file URL securely, 
    // effectively acting as a proxy layer that verified permission first.
    res.redirect(book.file_url);

  } catch (error) {
    next(error);
  }
};

// @desc    Download book file
// @route   GET /api/books/:id/download
// @access  Private (Owner, Purchaser, or Free book)
const downloadBook = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : null;
    const bookId = req.params.id;

    const { rows: bookRows } = await db.query('SELECT * FROM books WHERE id = $1', [bookId]);
    if (bookRows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    const book = bookRows[0];

    let isAuthorized = false;

    if (parseFloat(book.price) === 0 || userRole === 'ADMIN' || book.author_id === userId) {
      isAuthorized = true;
    } else if (userId) {
      const { rows: purchaseRows } = await db.query('SELECT * FROM purchases WHERE book_id = $1 AND user_id = $2', [bookId, userId]);
      if (purchaseRows.length > 0) {
        isAuthorized = true;
      }
    }

    if (!isAuthorized) {
      res.status(403);
      throw new Error('You must purchase this book before downloading');
    }

    res.redirect(book.file_url);
  } catch (error) {
    next(error);
  }
};

module.exports = { getBooks, getBookById, createBook, updateBook, deleteBook, streamBookFile, downloadBook };

