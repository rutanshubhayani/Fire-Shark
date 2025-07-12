const bcrypt = require('bcryptjs');
const { findOne, updateDocument } = require('../../../helpers');
const Joi = require('joi');

const resetPasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).max(30).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 30 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'any.required': 'New password is required'
  })
});

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using token from URL
 *     description: Reset user password using token from URL query parameters
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Password reset token from email
 *         example: "resetTokenHere"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newPassword
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 30
 *                 example: "NewPassword123"
 *                 description: New password for the account
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: "Password reset successfully."
 *       400:
 *         description: Validation error or invalid/expired token
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
 *                   example: "Invalid or expired reset token."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 404
 *                 message:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleResetPassword(req, res) {
  const { token } = req.query;
  const { newPassword } = req.body;

  try {
    // Validate token from URL
    if (!token) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Reset token is required in URL parameters.' 
      });
    }

    // Validate request body
    await resetPasswordSchema.validateAsync(req.body);

    // Find user with valid reset token
    const user = await findOne('user', {
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: new Date() }
    });

    if (!user) {
      return res.status(400).json({ 
        status: 400, 
        message: 'Invalid or expired reset token.' 
      });
    }

    // Hash new password and update user
    const hashedPassword = bcrypt.hashSync(newPassword, 12);
    
    await updateDocument('user', { _id: user._id }, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    return res.status(200).json({ 
      status: 200, 
      message: 'Password reset successfully.' 
    });

  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Reset password error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleResetPassword; 