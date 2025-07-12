const { find } = require('../../helpers');
const Models = require('../../models');

/**
 * @swagger
 * /api/users/{userId}/stats:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieve statistics for a specific user including votes, questions, and answers
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID
 *     responses:
 *       200:
 *         description: User stats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "User stats retrieved successfully"
 *                 stats:
 *                   type: object
 *                   properties:
 *                     totalVotes:
 *                       type: number
 *                       example: 25
 *                     totalQuestions:
 *                       type: number
 *                       example: 5
 *                     totalAnswers:
 *                       type: number
 *                       example: 12
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function handleGetUserStats(req, res) {
  try {
    const { userId } = req.params;

    // Verify user exists
    const user = await find('user', { _id: userId });
    if (!user || user.length === 0) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
      });
    }

    // Get user's questions
    const userQuestions = await find('question', { author: userId });
    const totalQuestions = userQuestions.length;

    // Get user's answers
    const userAnswers = await find('answer', { author: userId });
    const totalAnswers = userAnswers.length;

    // Calculate total votes (upvotes - downvotes)
    let totalVotes = 0;
    
    // Votes from questions
    for (const question of userQuestions) {
      const questionVotes = (question.upvotes?.length || 0) - (question.downvotes?.length || 0);
      totalVotes += questionVotes;
    }
    
    // Votes from answers
    for (const answer of userAnswers) {
      const answerVotes = (answer.upvotes?.length || 0) - (answer.downvotes?.length || 0);
      totalVotes += answerVotes;
    }

    return res.status(200).json({
      status: 200,
      message: 'User stats retrieved successfully',
      stats: {
        totalVotes,
        totalQuestions,
        totalAnswers,
      },
    });
  } catch (err) {
    console.error('Get user stats error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetUserStats; 