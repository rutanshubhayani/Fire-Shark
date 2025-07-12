const { findOne, deleteDocument, updateDocument } = require('../../helpers');

/**
 * @swagger
 * /api/answers/{id}:
 *   delete:
 *     summary: Delete an answer
 *     description: Delete an answer (author only)
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
 *         description: Answer deleted successfully
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
 *                   example: "Answer deleted successfully!"
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
async function handleDeleteAnswer(req, res) {
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

    // Check if user is the author
    if (answer.author.toString() !== userId) {
      return res.status(403).json({
        status: 403,
        message: 'You can only delete your own answers',
      });
    }

    // Remove answer from question's answers array
    await updateDocument(
      'question',
      { _id: answer.question },
      {
        $pull: { answers: id },
      }
    );

    // If this answer was accepted, clear the accepted answer
    if (answer.isAccepted) {
      await updateDocument(
        'question',
        { _id: answer.question },
        {
          acceptedAnswer: null,
        }
      );
    }

    // Delete the answer
    await deleteDocument('answer', { _id: id });

    return res.status(200).json({
      status: 200,
      message: 'Answer deleted successfully!',
    });
  } catch (err) {
    console.error('Delete answer error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleDeleteAnswer;
