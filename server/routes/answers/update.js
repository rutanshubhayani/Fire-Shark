const Joi = require('joi');
const { findOne, updateDocument } = require('../../helpers');

const updateAnswerSchema = Joi.object({
  body: Joi.string().min(10).required().messages({
    'string.min': 'Answer must be at least 10 characters long',
    'any.required': 'Answer body is required',
  }),
});

/**
 * @swagger
 * /api/answers/{id}:
 *   put:
 *     summary: Update an answer
 *     description: Update an existing answer (author only)
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
 *               - body
 *             properties:
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 example: "<p>Here's how you can implement JWT authentication in React...</p>"
 *                 description: Answer content (HTML)
 *     responses:
 *       200:
 *         description: Answer updated successfully
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
 *                   example: "Answer updated successfully!"
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
 *       403:
 *         description: Forbidden - Not the answer author
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
async function handleUpdateAnswer(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const { body } = req.body;

    // Validate request body
    await updateAnswerSchema.validateAsync(req.body);

    // Check if answer exists
    const answer = await findOne('answer', { _id: id });
    if (!answer) {
      return res.status(404).json({
        status: 404,
        message: 'Answer not found',
      });
    }

    // Check if user is the author
    if (answer.author.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: 'You can only update your own answers',
      });
    }

    // Update answer
    const updatedAnswer = await updateDocument('answer', { _id: id }, {
      body: body.trim()
    });

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

    return res.status(200).json({
      status: 200,
      message: 'Answer updated successfully!',
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

    console.error('Update answer error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleUpdateAnswer; 