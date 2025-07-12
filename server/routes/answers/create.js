const Joi = require('joi');
const { insertNewDocument, findOne, updateDocument } = require('../../helpers');
const { createNotification, createMentionNotifications } = require('../../utils');

const createAnswerSchema = Joi.object({
  body: Joi.string().min(10).required().messages({
    'string.min': 'Answer must be at least 10 characters long',
    'any.required': 'Answer body is required',
  }),
  questionId: Joi.string().required().messages({
    'any.required': 'Question ID is required',
  }),
});

/**
 * @swagger
 * /api/answers:
 *   post:
 *     summary: Create a new answer
 *     description: Create a new answer for a question
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *               - questionId
 *             properties:
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 example: "<p>Here's how you can implement JWT authentication in React...</p>"
 *                 description: Answer content (HTML)
 *               questionId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: ID of the question being answered
 *     responses:
 *       201:
 *         description: Answer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "Answer created successfully!"
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
async function handleCreateAnswer(req, res) {
  try {
    const { body, questionId } = req.body;
    const userId = req.userId;

    // Validate request body
    await createAnswerSchema.validateAsync(req.body);

    // Check if user exists and is verified
    const user = await findOne('user', { _id: userId });
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found',
      });
    }

    if (user.role === 'user' && !user.isEmailVerified) {
      return res.status(403).json({
        status: 403,
        message: 'Please verify your email before posting answers',
      });
    }

    // Check if question exists
    const question = await findOne('question', { _id: questionId });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }

    // Create answer object
    const answerData = {
      body: body.trim(),
      author: userId,
      question: questionId,
      upvotes: [],
      downvotes: [],
      isAccepted: false,
    };

    // Save answer to database
    const savedAnswer = await insertNewDocument('answer', answerData);

    // Create mention notifications for users mentioned in answer body
    await createMentionNotifications(
      body,
      userId,
      `/questions/${questionId}#answer-${savedAnswer._id}`
    );

    // Populate author information
    const populatedAnswer = await savedAnswer.populate(
      'author',
      'first_name last_name username avatar'
    );

    // Add answer to question's answers array
    await updateDocument(
      'question',
      { _id: questionId },
      {
        $push: { answers: savedAnswer._id },
      }
    );

    // Create notification for question author
    if (question.author.toString() !== userId) {
      await createNotification({
        user: question.author,
        type: 'answer',
        message: `${user.first_name} ${user.last_name} answered your question "${question.title}"`,
        link: `/questions/${questionId}#answer-${savedAnswer._id}`,
      });
    }

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

    return res.status(201).json({
      status: 201,
      message: 'Answer created successfully!',
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

    console.error('Create answer error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleCreateAnswer;
