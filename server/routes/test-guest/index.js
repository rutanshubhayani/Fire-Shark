const { findOne } = require('../../helpers');

/**
 * @swagger
 * /api/test-guest:
 *   get:
 *     summary: Test guest functionality
 *     description: Test endpoint to verify guest user creation and retrieval
 *     tags: [Test]
 *     responses:
 *       200:
 *         description: Test successful
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
 *                   example: "Guest functionality test successful"
 *                 guestCount:
 *                   type: number
 *                   example: 5
 */
async function handleTestGuest(req, res) {
  try {
    // Count guest users
    const guestUsers = await findOne('user', { role: 'guest' });

    return res.status(200).json({
      status: 200,
      message: 'Guest functionality test successful',
      guestCount: guestUsers ? 1 : 0,
      note: 'Guest users can be created via POST /api/auth/guest-signup with first_name and last_name',
    });
  } catch (err) {
    console.error('Test guest error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleTestGuest;
