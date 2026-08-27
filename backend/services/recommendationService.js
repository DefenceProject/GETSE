const db = require('../config/db');

/**
 * AI Recommendation Service
 * Uses a content-based + popularity hybrid approach.
 *
 * Strategy:
 * 1. Find books the user has NOT purchased.
 * 2. Rank them by:
 *    - Language match (same language as books they already own) — strong signal
 *    - Overall popularity (total purchases across all users)
 * 3. Return top N recommendations.
 */

const getRecommendationsForUser = async (userId) => {
  // Get books the user already owns
  const owned = await db.query(
    `SELECT b.language FROM purchases p
     JOIN books b ON p.book_id = b.id
     WHERE p.user_id = $1`,
    [userId]
  );

  const ownedLanguages = [...new Set(owned.rows.map((r) => r.language))];

  // Get recommended books not yet purchased — ranked by popularity and language match
  let query = `
    SELECT b.id, b.title, b.description, b.cover_image_url, b.price, b.language,
           u.username AS author_name,
           COUNT(p2.id) AS popularity_score,
           CASE WHEN b.language = ANY($2) THEN 1 ELSE 0 END AS language_match
    FROM books b
    JOIN users u ON b.author_id = u.id
    LEFT JOIN purchases p2 ON b.id = p2.book_id
    WHERE b.id NOT IN (
      SELECT book_id FROM purchases WHERE user_id = $1
    )
    GROUP BY b.id, u.username
    ORDER BY language_match DESC, popularity_score DESC
    LIMIT 10
  `;

  const { rows } = await db.query(query, [userId, ownedLanguages]);
  return rows;
};

module.exports = { getRecommendationsForUser };
