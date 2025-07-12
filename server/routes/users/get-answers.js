const { findAndPopulate } = require('../../helpers');

/**
 * @swagger
 * /api/users/{userId}/answers:
 *   get:
 *     summary: Get user answers
 *     description: Retrieve all answers by a specific user
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
 *         description: User answers retrieved successfully
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
 *                   example: "User answers retrieved successfully"
 *                 answers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Answer'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function handleGetUserAnswers(req, res) {
  try {
    const { userId } = req.params;

    // Get user's answers with populated question data
    const answers = await findAndPopulate(
      'answer',
      { author: userId },
      'question',
      'title _id'
    );

    // Format answers for response
    const formattedAnswers = answers.map(answer => ({
      _id: answer._id,
      description: answer.description,
      question: answer.question,
      isAccepted: answer.isAccepted,
      upvotes: answer.upvotes || [],
      downvotes: answer.downvotes || [],
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    }));

    return res.status(200).json({
      status: 200,
      message: 'User answers retrieved successfully',
      answers: formattedAnswers,
    });
  } catch (err) {
    console.error('Get user answers error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetUserAnswers; 