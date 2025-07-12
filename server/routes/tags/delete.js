const { findOne, deleteDocument } = require('../../helpers');

/**
 * @swagger
 * /api/tags/{id}:
 *   delete:
 *     summary: Delete a tag
 *     description: Delete a tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     responses:
 *       200:
 *         description: Tag deleted successfully
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
 *                   example: "Tag deleted successfully!"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Tag not found
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
async function handleDeleteTag(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if user is admin
    const user = await findOne('user', { _id: userId });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 403,
        message: 'Admin access required to delete tags',
      });
    }

    // Check if tag exists
    const tag = await findOne('tag', { _id: id });
    if (!tag) {
      return res.status(404).json({
        status: 404,
        message: 'Tag not found',
      });
    }

    // Delete the tag
    await deleteDocument('tag', { _id: id });

    return res.status(200).json({
      status: 200,
      message: 'Tag deleted successfully!',
    });
  } catch (err) {
    console.error('Delete tag error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleDeleteTag;
