const db = require('../config/db');

// @desc    Get all notifications for logged-in user
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markNotificationRead = async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *`,
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) {
      res.status(404);
      throw new Error('Notification not found');
    }
    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark all notifications as read for the user
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllNotificationsRead = async (req, res, next) => {
  try {
    await db.query(
      `UPDATE notifications SET is_read = TRUE WHERE user_id = $1`,
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a notification (internal helper — not a direct route)
// @usage   createNotification(userId, title, message, type)
const createNotification = async (userId, title, message, type = 'info') => {
  await db.query(
    `INSERT INTO notifications (user_id, title, message, type) VALUES ($1, $2, $3, $4)`,
    [userId, title, message, type]
  );
};

// @desc    Broadcast notification to all users (Admin)
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res, next) => {
  try {
    const { title, message, type = 'info' } = req.body;
    if (!title || !message) {
      res.status(400);
      throw new Error('Title and message are required');
    }
    const { rows: users } = await db.query('SELECT id FROM users');
    for (const user of users) {
      await createNotification(user.id, title, message, type);
    }
    res.json({ message: `Notification sent to ${users.length} users` });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  broadcastNotification,
  createNotification,
};
