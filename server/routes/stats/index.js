const express = require('express');
const router = express.Router();
const Models = require('../../models');
const mongoose = require('mongoose');

// GET /api/stats
router.get('/', async (req, res) => {
  try {
    // Total questions
    const totalQuestions = await Models.question.countDocuments();
    // Total users
    const totalUsers = await Models.user.countDocuments();
    // Total answers
    const totalAnswers = await Models.answer.countDocuments();

    // Daily users (users created or logged in today)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    // If you track lastLogin, use it; otherwise, fallback to createdAt
    let dailyUsers;
    if (Models.user.schema.paths.lastLogin) {
      dailyUsers = await Models.user.countDocuments({
        lastLogin: { $gte: startOfDay, $lte: endOfDay },
      });
    } else {
      dailyUsers = await Models.user.countDocuments({
        createdAt: { $gte: startOfDay, $lte: endOfDay },
      });
    }

    return res.status(200).json({
      status: 200,
      message: 'Stats retrieved successfully',
      stats: {
        totalQuestions,
        totalUsers,
        totalAnswers,
        dailyUsers,
      },
    });
  } catch (err) {
    console.error('Stats API error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error',
    });
  }
});

module.exports = router; 