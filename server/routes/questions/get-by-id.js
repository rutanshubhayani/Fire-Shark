const { findOne, findAndPopulate } = require('../../helpers');

/**
 * @swagger
 * /api/questions/{id}:
 *   get:
 *     summary: Get question by ID
 *     description: Retrieve a specific question with all its details and answers
 *     tags: [Questions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
 *     responses:
 *       200:
 *         description: Question retrieved successfully
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
 *                   example: "Question retrieved successfully"
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *                 answers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Answer'
 *       404:
 *         description: Question not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleGetQuestionById(req, res) {
  try {
    const { id } = req.params;

    // Get question with author details
    const question = await findOne('question', { _id: id });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }

    // Populate author information
    const populatedQuestion = await question.populate(
      'author',
      'first_name last_name username avatar'
    );

    // Get answers for this question
    const answers = await findAndPopulate(
      'answer',
      { question: id },
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

    // Format question response
    const questionResponse = {
      _id: populatedQuestion._id,
      title: populatedQuestion.title,
      description: populatedQuestion.description,
      images: populatedQuestion.images || [],
      tags: populatedQuestion.tags,
      author: {
        _id: populatedQuestion.author._id,
        first_name: populatedQuestion.author.first_name,
        last_name: populatedQuestion.author.last_name,
        username: populatedQuestion.author.username,
        avatar: populatedQuestion.author.avatar,
      },
      answers: populatedQuestion.answers,
      acceptedAnswer: populatedQuestion.acceptedAnswer,
      upvotes: populatedQuestion.upvotes,
      downvotes: populatedQuestion.downvotes,
      createdAt: populatedQuestion.createdAt,
      updatedAt: populatedQuestion.updatedAt,
    };

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
      message: 'Question retrieved successfully',
      question: questionResponse,
      answers: answersResponse,
    });
  } catch (err) {
    console.error('Get question by ID error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetQuestionById;
