const express = require('express');
const router = express.Router();
const { tokenVerification } = require('../../middleware');

const getUserStats = require('./get-stats');
const getUserAnswers = require('./get-answers');
const getUserQuestions = require('./get-questions');

// All user routes require authentication
router.use(tokenVerification);

// User-specific routes
router.get('/:userId/stats', getUserStats);
router.get('/:userId/answers', getUserAnswers);
router.get('/:userId/questions', getUserQuestions);

module.exports = router; 