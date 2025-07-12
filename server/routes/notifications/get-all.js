const { findPopulateSortAndLimit, find } = require('../../helpers');

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     description: Retrieve all notifications for the authenticated user
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Number of notifications per page
 *       - in: query
 *         name: unread
 *         schema:
 *           type: boolean
 *         description: Filter to show only unread notifications
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
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
 *                   example: "Notifications retrieved successfully"
 *                 notifications:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: number
 *                       example: 1
 *                     totalPages:
 *                       type: number
 *                       example: 3
 *                     totalNotifications:
 *                       type: number
 *                       example: 45
 *                     unreadCount:
 *                       type: number
 *                       example: 12
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
async function handleGetNotifications(req, res) {
  try {
    const userId = req.userId;
    const { page = 1, limit = 20, unread } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 per page
    const skip = (pageNum - 1) * limitNum;

    // Build query object
    const query = { user: userId };

    if (unread === 'true') {
      query.isRead = false;
    }

    // Get notifications with pagination
    const notifications = await findPopulateSortAndLimit(
      'notification',
      query,
      null, // No population needed for notifications
      null,
      { createdAt: -1 }, // Sort by newest first
      skip,
      limitNum
    );

    // Get total count for pagination
    const totalNotifications = await find(
      'notification',
      query
    ).countDocuments();

    // Get unread count
    const unreadCount = await find('notification', {
      user: userId,
      isRead: false,
    }).countDocuments();

    // Calculate pagination info
    const totalPages = Math.ceil(totalNotifications / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    return res.status(200).json({
      status: 200,
      message: 'Notifications retrieved successfully',
      notifications,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalNotifications,
        unreadCount,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    console.error('Get notifications error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetNotifications;
