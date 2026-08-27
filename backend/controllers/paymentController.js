const db = require('../config/db');

// @desc    Initiate a simulated payment (Telebirr / CBE Birr)
// @route   POST /api/payments/initiate
// @access  Private (Reader)
const initiatePayment = async (req, res, next) => {
  try {
    const { book_id, provider, identifier } = req.body; // identifier: phone number or bank account
    const user_id = req.user.id;

    if (!book_id || !provider || !identifier) {
      res.status(400);
      throw new Error('Please provide book_id, provider, and account identifier');
    }

    // Check book exists
    const bookResult = await db.query('SELECT * FROM books WHERE id = $1', [book_id]);
    if (bookResult.rows.length === 0) {
      res.status(404);
      throw new Error('Book not found');
    }
    const book = bookResult.rows[0];

    // Check if already purchased
    const existing = await db.query(
      'SELECT * FROM purchases WHERE user_id = $1 AND book_id = $2',
      [user_id, book_id]
    );
    if (existing.rows.length > 0) {
      res.status(400);
      throw new Error('You have already purchased this book');
    }

    // Generate transaction reference
    const txnRef = `TXN-${provider.toUpperCase().substring(0, 3)}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Record pending payment
    const { rows } = await db.query(
      `INSERT INTO payments (user_id, book_id, amount, provider, transaction_ref, status)
       VALUES ($1, $2, $3, $4, $5, 'PENDING')
       RETURNING *`,
      [user_id, book_id, book.price, provider.toUpperCase(), txnRef]
    );

    res.status(201).json({
      message: 'Payment initiated',
      transaction: rows[0],
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Confirm and finalize a simulated payment
// @route   POST /api/payments/confirm
// @access  Private (Reader)
const confirmPayment = async (req, res, next) => {
  try {
    const { transaction_ref } = req.body;
    const user_id = req.user.id;

    if (!transaction_ref) {
      res.status(400);
      throw new Error('Transaction reference is required');
    }

    // Get payment log
    const paymentResult = await db.query(
      'SELECT * FROM payments WHERE transaction_ref = $1 AND user_id = $2',
      [transaction_ref, user_id]
    );

    if (paymentResult.rows.length === 0) {
      res.status(404);
      throw new Error('Transaction not found');
    }

    const payment = paymentResult.rows[0];

    if (payment.status !== 'PENDING') {
      res.status(400);
      throw new Error(`Transaction is already in ${payment.status} status`);
    }

    // Update payment status to COMPLETED
    await db.query(
      "UPDATE payments SET status = 'COMPLETED' WHERE id = $1",
      [payment.id]
    );

    // Record the purchase
    const purchaseResult = await db.query(
      `INSERT INTO purchases (user_id, book_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, book_id) DO NOTHING
       RETURNING *`,
      [user_id, payment.book_id]
    );

    res.json({
      message: 'Payment confirmed and purchase recorded successfully!',
      payment_status: 'COMPLETED',
      purchase: purchaseResult.rows[0] || { user_id, book_id: payment.book_id },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  initiatePayment,
  confirmPayment
};
