const { findOne, updateDocument } = require('../../helpers');

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     description: Mark a specific notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read successfully
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
 *                   example: "Notification marked as read"
 *                 notification:
 *                   $ref: '#/components/schemas/Notification'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Not the notification owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Notification not found
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
async function handleMarkAsRead(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;

    // Check if notification exists and belongs to user
    const notification = await findOne('notification', { _id: id, user: userId });
    if (!notification) {
      return res.status(404).json({
        status: 404,
        message: 'Notification not found',
      });
    }

    // Mark notification as read
    const updatedNotification = await updateDocument('notification', { _id: id }, {
      isRead: true
    });

    return res.status(200).json({
      status: 200,
      message: 'Notification marked as read',
      notification: updatedNotification,
    });
  } catch (err) {
    console.error('Mark as read error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleMarkAsRead; 