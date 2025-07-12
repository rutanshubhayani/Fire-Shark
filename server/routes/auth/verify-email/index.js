const { findOne, updateDocument } = require('../../../helpers');
const Config = require('../../../config');

/**
 * @swagger
 * /api/auth/verify-email:
 *   get:
 *     summary: Verify email address
 *     description: Verify user's email address using verification token
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *         example: "bkeylo2ncx6qwgoeop48b"
 *     responses:
 *       302:
 *         description: Redirect to frontend with verification result
 *       400:
 *         description: Invalid or expired token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 400
 *                 message:
 *                   type: string
 *                   example: "Invalid or expired verification token."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleEmailVerification(req, res) {
  const { token } = req.query;

  const frontendUrl =
    (process.env.NODE_ENV === 'production'
      ? Config.FRONTEND_URL_PROD
      : Config.FRONTEND_URL_DEV) + '/verify-email';

  try {
    if (!token) {
      return res.redirect(frontendUrl + '?verified=fail');
    }

    // Find user with this verification token
    const user = await findOne('user', {
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      // Redirect to frontend with error
      return res.redirect(frontendUrl + '?verified=fail');
    }

    // Update user to mark email as verified
    await updateDocument(
      'user',
      { _id: user._id },
      {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }
    );

    // Redirect to frontend with success
    return res.redirect(frontendUrl + '?verified=success');
  } catch (error) {
    // Redirect to frontend with error
    return res.redirect(frontendUrl + '?verified=fail');
  }
}

module.exports = handleEmailVerification;
