const { findAndPopulate } = require('../../helpers');

/**
 * @swagger
 * /api/answers/question/{questionId}:
 *   get:
 *     summary: Get answers by question ID
 *     description: Retrieve all answers for a specific question
 *     tags: [Answers]
 *     parameters:
 *       - in: path
 *         name: questionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Answers retrieved successfully
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
 *                   example: "Answers retrieved successfully"
 *                 answers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Answer'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleGetAnswersByQuestion(req, res) {
  try {
    const { questionId } = req.params;

    // Get answers for this question with author details
    const answers = await findAndPopulate(
      'answer',
      { question: questionId },
      'author',
      'first_name last_name username avatar'
    );

    // Sort answers: accepted first, then by votes, then by date
    const sortedAnswers = answers.sort((a, b) => {
      // Accepted answers first
      if (a.isAccepted && !b.isAccepted) return -1;
      if (!a.isAccepted && b.isAccepted) return 1;

      // Then by vote count
      const aVotes = a.upvotes.length - a.downvotes.length;
      const bVotes = b.upvotes.length - b.downvotes.length;
      if (aVotes !== bVotes) return bVotes - aVotes;

      // Finally by date (newest first)
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    // Format answers response
    const answersResponse = sortedAnswers.map(answer => ({
      _id: answer._id,
      body: answer.body,
      images: answer.images || [],
      author: {
        _id: answer.author._id,
        first_name: answer.author.first_name,
        last_name: answer.author.last_name,
        username: answer.author.username,
        avatar: answer.author.avatar,
      },
      question: answer.question,
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      isAccepted: answer.isAccepted,
      createdAt: answer.createdAt,
      updatedAt: answer.updatedAt,
    }));

    return res.status(200).json({
      status: 200,
      message: 'Answers retrieved successfully',
      answers: Array.isArray(answers) ? answers : [],
    });
  } catch (err) {
    console.error('Get answers by question error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetAnswersByQuestion;
