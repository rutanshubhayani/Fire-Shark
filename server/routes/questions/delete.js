const { findOne, deleteDocument, updateDocument } = require('../../helpers');

/**
 * @swagger
 * /api/questions/{id}:
 *   delete:
 *     summary: Delete a question
 *     description: Delete a question (author only)
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
 *     responses:
 *       200:
 *         description: Question deleted successfully
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
 *                   example: "Question deleted successfully!"
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
async function handleDeleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

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
        message: 'You can only delete your own questions',
      });
    }

    // Delete all answers associated with this question
    await deleteDocument('answer', { question: id });

    // Delete the question
    await deleteDocument('question', { _id: id });

    return res.status(200).json({
      status: 200,
      message: 'Question deleted successfully!',
    });
  } catch (err) {
    console.error('Delete question error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleDeleteQuestion; 