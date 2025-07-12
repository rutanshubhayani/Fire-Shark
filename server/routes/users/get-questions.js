const { findAndPopulate } = require('../../helpers');

/**
 * @swagger
 * /api/users/{userId}/questions:
 *   get:
 *     summary: Get user questions
 *     description: Retrieve all questions by a specific user
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
 *         description: User questions retrieved successfully
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
 *                   example: "User questions retrieved successfully"
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function handleGetUserQuestions(req, res) {
  try {
    const { userId } = req.params;

    // Get user's questions with populated author data
    const questions = await findAndPopulate(
      'question',
      { author: userId },
      'author',
      'first_name last_name username avatar'
    );

    // Format questions for response
    const formattedQuestions = questions.map(question => ({
      _id: question._id,
      title: question.title,
      description: question.description,
      images: question.images || [],
      tags: question.tags,
      author: {
        _id: question.author._id,
        first_name: question.author.first_name,
        last_name: question.author.last_name,
        username: question.author.username,
        avatar: question.author.avatar,
      },
      answers: question.answers || [],
      acceptedAnswer: question.acceptedAnswer,
      upvotes: question.upvotes || [],
      downvotes: question.downvotes || [],
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }));

    return res.status(200).json({
      status: 200,
      message: 'User questions retrieved successfully',
      questions: formattedQuestions,
    });
  } catch (err) {
    console.error('Get user questions error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetUserQuestions; 