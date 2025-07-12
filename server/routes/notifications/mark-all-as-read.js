const { customUpdate } = require('../../helpers');

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     description: Mark all user notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
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
 *                   example: "All notifications marked as read"
 *                 updatedCount:
 *                   type: number
 *                   example: 5
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
async function handleMarkAllAsRead(req, res) {
  try {
    const userId = req.userId;

    // Mark all user notifications as read
    const result = await customUpdate('notification', 
      { user: userId, isRead: false }, 
      { isRead: true }
    );

    return res.status(200).json({
      status: 200,
      message: 'All notifications marked as read',
      updatedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error('Mark all as read error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleMarkAllAsRead; 