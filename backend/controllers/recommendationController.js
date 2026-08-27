const { getRecommendationsForUser } = require('../services/recommendationService');

// @desc    Get personalized book recommendations for the logged-in user
// @route   GET /api/recommendations
// @access  Private
const getRecommendations = async (req, res, next) => {
  try {
    const recommendations = await getRecommendationsForUser(req.user.id);
    res.json(recommendations);
  } catch (error) {
    next(error);
  }
};

module.exports = { getRecommendations };
