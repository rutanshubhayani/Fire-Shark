const Joi = require('joi');
const { findOne, updateDocument } = require('../../helpers');

const updateQuestionSchema = Joi.object({
  title: Joi.string().min(10).max(200).optional().messages({
    'string.min': 'Title must be at least 10 characters long',
    'string.max': 'Title cannot exceed 200 characters',
  }),
  description: Joi.string().min(20).optional().messages({
    'string.min': 'Description must be at least 20 characters long',
  }),
  tags: Joi.array()
    .items(Joi.string().min(1).max(20))
    .min(1)
    .max(5)
    .optional()
    .messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Cannot exceed 5 tags',
    }),
});

/**
 * @swagger
 * /api/questions/{id}:
 *   put:
 *     summary: Update a question
 *     description: Update an existing question (author only)
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
 *       200:
 *         description: Question updated successfully
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
 *                   example: "Question updated successfully!"
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
 *       403:
 *         description: Forbidden - Not the question author
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
async function handleUpdateQuestion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // Validate request body
    await updateQuestionSchema.validateAsync(updateData);

    // Check if question exists
    const question = await findOne('question', { _id: id });
    if (!question) {
      return res.status(404).json({
        status: 404,
        message: 'Question not found',
      });
    }

    // Check if user is the author
    if (question.author.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: 'You can only update your own questions',
      });
    }

    // Prepare update data
    const updateFields = {};
    if (updateData.title) updateFields.title = updateData.title.trim();
    if (updateData.description)
      updateFields.description = updateData.description.trim();
    if (updateData.tags)
      updateFields.tags = updateData.tags.map(tag => tag.toLowerCase().trim());

    // Update question
    const updatedQuestion = await updateDocument(
      'question',
      { _id: id },
      updateFields
    );

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

    return res.status(200).json({
      status: 200,
      message: 'Question updated successfully!',
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

    console.error('Update question error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleUpdateQuestion;
