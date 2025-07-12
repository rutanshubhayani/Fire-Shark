const { findOne, updateDocument } = require('../../helpers');

/**
 * @swagger
 * /api/answers/{id}/accept:
 *   post:
 *     summary: Accept an answer
 *     description: Accept an answer as the solution (question author only)
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Answer ID
 *     responses:
 *       200:
 *         description: Answer accepted successfully
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
 *                   example: "Answer accepted successfully!"
 *                 question:
 *                   $ref: '#/components/schemas/Question'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not the question author
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Answer or question not found
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
async function handleAcceptAnswer(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if answer exists
    const answer = await findOne('answer', { _id: id });
    if (!answer) {
      return res.status(404).json({
        status: 404,
        message: 'Answer not found',
      });
    }

    // Get the question to check if user is the author
    const question = await findOne('question', { _id: answer.question });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }

    // Check if user is the question author
    if (question.author.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: 'Only the question author can accept answers',
      });
    }

    // Check if answer is already accepted
    if (answer.isAccepted) {
      return res.status(400).json({
        status: 400,
        message: 'This answer is already accepted',
      });
    }

    // Unaccept any previously accepted answer for this question
    await updateDocument('answer', { question: answer.question, isAccepted: true }, {
      isAccepted: false
    });

    // Accept the current answer
    await updateDocument('answer', { _id: id }, {
      isAccepted: true
    });

    // Update question's accepted answer
    const updatedQuestion = await updateDocument('question', { _id: answer.question }, {
      acceptedAnswer: id
    });

    // Populate author information
    const populatedQuestion = await updatedQuestion.populate('author', 'first_name last_name username avatar');

    // Create response object
    const questionResponse = {
      _id: populatedQuestion._id,
      title: populatedQuestion.title,
      description: populatedQuestion.description,
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

    return res.status(200).json({
      status: 200,
      message: 'Answer accepted successfully!',
      question: questionResponse,
    });
  } catch (err) {
    console.error('Accept answer error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleAcceptAnswer; 