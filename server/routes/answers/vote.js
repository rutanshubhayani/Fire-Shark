const Joi = require('joi');
const { findOne, updateDocument } = require('../../helpers');

const voteSchema = Joi.object({
  voteType: Joi.string().valid('upvote', 'downvote').required().messages({
    'any.only': 'Vote type must be either "upvote" or "downvote"',
    'any.required': 'Vote type is required',
  }),
});

/**
 * @swagger
 * /api/answers/{id}/vote:
 *   post:
 *     summary: Vote on an answer
 *     description: Upvote or downvote an answer
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
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - voteType
 *             properties:
 *               voteType:
 *                 type: string
 *                 enum: [upvote, downvote]
 *                 example: "upvote"
 *                 description: Type of vote
 *     responses:
 *       200:
 *         description: Vote recorded successfully
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
 *                   example: "Vote recorded successfully"
 *                 answer:
 *                   $ref: '#/components/schemas/Answer'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Answer not found
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
async function handleVoteAnswer(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.userId;

    // Validate request body
    await voteSchema.validateAsync(req.body);

    // Check if answer exists
    const answer = await findOne('answer', { _id: id });
    if (!answer) {
      return res.status(404).json({
        status: 404,
        message: 'Answer not found',
      });
    }

    // Check if user is trying to vote on their own answer
    if (answer.author.toString() === userId) {
      return res.status(400).json({
        status: 400,
        message: 'You cannot vote on your own answer',
      });
    }

    const isUpvote = voteType === 'upvote';
    const voteArray = isUpvote ? 'upvotes' : 'downvotes';
    const oppositeArray = isUpvote ? 'downvotes' : 'upvotes';

    // Check if user has already voted
    const hasVoted = answer[voteArray].includes(userId);
    const hasOppositeVote = answer[oppositeArray].includes(userId);

    let updateQuery = {};

    if (hasVoted) {
      // Remove vote if already voted the same way
      updateQuery = {
        $pull: { [voteArray]: userId }
      };
    } else {
      // Add vote and remove opposite vote if exists
      updateQuery = {
        $addToSet: { [voteArray]: userId },
        $pull: { [oppositeArray]: userId }
      };
    }

    // Update answer
    const updatedAnswer = await updateDocument('answer', { _id: id }, updateQuery);

    // Populate author information
    const populatedAnswer = await updatedAnswer.populate('author', 'first_name last_name username avatar');

    // Create response object
    const answerResponse = {
      _id: populatedAnswer._id,
      body: populatedAnswer.body,
      author: {
        _id: populatedAnswer.author._id,
        first_name: populatedAnswer.author.first_name,
        last_name: populatedAnswer.author.last_name,
        username: populatedAnswer.author.username,
        avatar: populatedAnswer.author.avatar,
      },
      question: populatedAnswer.question,
      upvotes: populatedAnswer.upvotes,
      downvotes: populatedAnswer.downvotes,
      isAccepted: populatedAnswer.isAccepted,
      createdAt: populatedAnswer.createdAt,
      updatedAt: populatedAnswer.updatedAt,
    };

    const action = hasVoted ? 'removed' : 'recorded';
    return res.status(200).json({
      status: 200,
      message: `${voteType} ${action} successfully`,
      answer: answerResponse,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Vote answer error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleVoteAnswer; 