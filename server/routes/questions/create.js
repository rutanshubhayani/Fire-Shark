const Joi = require('joi');
const { insertNewDocument, findOne } = require('../../helpers');
const { createNotification, createMentionNotifications } = require('../../utils');

const createQuestionSchema = Joi.object({
  title: Joi.string().min(10).max(200).required().messages({
    'string.min': 'Title must be at least 10 characters long',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().min(20).required().messages({
    'string.min': 'Description must be at least 20 characters long',
    'any.required': 'Description is required',
  }),
  tags: Joi.array()
    .items(Joi.string().min(1).max(20))
    .min(1)
    .max(5)
    .required()
    .messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Cannot exceed 5 tags',
      'any.required': 'Tags are required',
    }),
});

/**
 * @swagger
 * /api/questions:
 *   post:
 *     summary: Create a new question
 *     description: Create a new question with title, description, and tags
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 example: "How to implement JWT authentication in React?"
 *                 description: Question title
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 example: "<p>I'm building a React app and need to implement JWT authentication...</p>"
 *                 description: Question description (HTML content)
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 5
 *                 example: ["react", "jwt", "authentication"]
 *                 description: Array of tags
 *     responses:
 *       201:
 *         description: Question created successfully
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
 *                   example: "Question created successfully!"
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleCreateQuestion(req, res) {
  try {
    const { title, description, tags } = req.body;
    const userId = req.userId;

    // Validate request body
    await createQuestionSchema.validateAsync(req.body);

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
        message: 'Please verify your email before posting questions',
      });
    }

    // Create question object
    const questionData = {
      title: title.trim(),
      description: description.trim(),
      tags: tags.map(tag => tag.toLowerCase().trim()),
      author: userId,
      answers: [],
      acceptedAnswer: null,
      upvotes: [],
      downvotes: [],
    };

    // Save question to database
    const savedQuestion = await insertNewDocument('question', questionData);

    // Create mention notifications for users mentioned in title or description
    const contentWithMentions = `${title} ${description}`;
    await createMentionNotifications(
      contentWithMentions,
      userId,
      `/questions/${savedQuestion._id}`
    );

    // Populate author information
    const populatedQuestion = await savedQuestion.populate(
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

    return res.status(201).json({
      status: 201,
      message: 'Question created successfully!',
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

    console.error('Create question error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleCreateQuestion;
