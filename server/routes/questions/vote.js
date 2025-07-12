const Joi = require('joi');
const { findOne, updateDocument } = require('../../helpers');
const { createNotification } = require('../../utils');

const voteSchema = Joi.object({
  voteType: Joi.string().valid('upvote', 'downvote').required().messages({
    'any.only': 'Vote type must be either "upvote" or "downvote"',
    'any.required': 'Vote type is required',
  }),
});

/**
 * @swagger
 * /api/questions/{id}/vote:
 *   post:
 *     summary: Vote on a question
 *     description: Upvote or downvote a question
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Question ID
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
 *                 question:
 *                   $ref: '#/components/schemas/Question'
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
async function handleVoteQuestion(req, res) {
  try {
    const { id } = req.params;
    const { voteType } = req.body;
    const userId = req.userId;

    // Validate request body
    await voteSchema.validateAsync(req.body);

    // Check if question exists
    const question = await findOne('question', { _id: id });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }

    // Check if user is trying to vote on their own question
    if (question.author.toString() === userId) {
      return res.status(400).json({
        status: 400,
        message: 'You cannot vote on your own question',
      });
    }

    const isUpvote = voteType === 'upvote';
    const voteArray = isUpvote ? 'upvotes' : 'downvotes';
    const oppositeArray = isUpvote ? 'downvotes' : 'upvotes';

    // Check if user has already voted
    const hasVoted = question[voteArray].includes(userId);
    const hasOppositeVote = question[oppositeArray].includes(userId);

    let updateQuery = {};

    if (hasVoted) {
      // Remove vote if already voted the same way
      updateQuery = {
        $pull: { [voteArray]: userId },
        $inc: { voteCount: isUpvote ? -1 : 1 },
      };
    } else {
      // Add vote and remove opposite vote if exists
      updateQuery = {
        $addToSet: { [voteArray]: userId },
        $pull: { [oppositeArray]: userId },
        $inc: { voteCount: 0 },
      };
      // If adding upvote
      if (isUpvote) {
        updateQuery.$inc.voteCount = 1;
        if (hasOppositeVote) updateQuery.$inc.voteCount = 2; // removing downvote and adding upvote
      } else {
        // Adding downvote
        updateQuery.$inc.voteCount = -1;
        if (hasOppositeVote) updateQuery.$inc.voteCount = -2; // removing upvote and adding downvote
      }
    }

    // Update question
    const updatedQuestion = await require('../../models').question.findOneAndUpdate(
      { _id: id },
      updateQuery,
      { new: true }
    );

    // Create notification for upvotes (only when adding a new upvote)
    if (isUpvote && !hasVoted) {
      const voter = await findOne('user', { _id: userId });
      if (voter) {
        await createNotification({
          user: question.author,
          type: 'upvote',
          message: `${voter.first_name} ${voter.last_name} upvoted your question "${question.title}"`,
          link: `/questions/${id}`,
        });
      }
    }

    // Populate author information
    const populatedQuestion = await updatedQuestion.populate(
      'author',
      'first_name last_name username avatar'
    );

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

    const action = hasVoted ? 'removed' : 'recorded';
    return res.status(200).json({
      status: 200,
      message: `${voteType} ${action} successfully`,
      question: questionResponse,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Vote question error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

// GET /api/questions/:id/vote - get current vote state
async function handleGetQuestionVote(req, res) {
  try {
    const { id } = req.params;
    const question = await findOne('question', { _id: id });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }
    const upvotes = question.upvotes || [];
    const downvotes = question.downvotes || [];
    const voteCount = upvotes.length - downvotes.length;
    return res.status(200).json({
      status: 200,
      upvotes,
      downvotes,
      voteCount,
    });
  } catch (err) {
    console.error('Get question vote error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

// GET /api/questions/:id/voters - get list of users who upvoted/downvoted
async function handleGetQuestionVoters(req, res) {
  try {
    const { id } = req.params;
    const question = await findOne('question', { _id: id });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }
    // Populate upvotes and downvotes with user info
    await question.populate([
      { path: 'upvotes', select: 'username first_name last_name avatar' },
      { path: 'downvotes', select: 'username first_name last_name avatar' }
    ]);
    return res.status(200).json({
      status: 200,
      upvoters: question.upvotes,
      downvoters: question.downvotes,
    });
  } catch (err) {
    console.error('Get question voters error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

// GET /api/questions/:id/votecount - get only the voteCount field
async function handleGetQuestionVoteCount(req, res) {
  try {
    const { id } = req.params;
    const question = await findOne('question', { _id: id });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }
    return res.status(200).json({
      status: 200,
      voteCount: question.voteCount || 0,
    });
  } catch (err) {
    console.error('Get question voteCount error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleVoteQuestion;
module.exports.handleGetQuestionVote = handleGetQuestionVote;
module.exports.handleGetQuestionVoters = handleGetQuestionVoters;
module.exports.handleGetQuestionVoteCount = handleGetQuestionVoteCount;
