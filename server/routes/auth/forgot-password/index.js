const { findOne, updateDocument } = require('../../../helpers');
const { send_email } = require('../../../lib');
const Joi = require('joi');

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

const generateResetToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Forgot password
 *     description: Send password reset email to user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: User's email address
 *     responses:
 *       200:
 *         description: Password reset email sent successfully
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
 *                   example: "Password reset email sent successfully! Please check your inbox."
 *       400:
 *         description: Validation error
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
 *                   example: "Please provide a valid email address"
 *                 field:
 *                   type: string
 *                   example: "email"
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
 *                   example: "No account found with this email address."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleForgotPassword(req, res) {
  const { email } = req.body;

  try {
    await forgotPasswordSchema.validateAsync(req.body);

    const user = await findOne('user', { email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'No account found with this email address.',
      });
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    const updatedUser = await updateDocument(
      'user',
      { _id: user._id },
      {
        resetPasswordToken: resetToken,
        resetPasswordExpires: resetExpires,
      }
    );

    if (!updatedUser) {
      return res.status(500).json({
        status: 500,
        message: 'Failed to generate reset token. Please try again.',
      });
    }

    // Send password reset email
    try {
      send_email(
        'forgot-password',
        {
          username: user.first_name,
          resetLink: `${
            process.env.NODE_ENV === 'production'
              ? process.env.FRONTEND_URL_PROD
              : process.env.FRONTEND_URL_DEV
          }/reset-password?token=${resetToken}`,
          email: user.email,
          supportEmail:
            process.env.NODE_ENV === 'production'
              ? 'support@stackit.com'
              : 'support@stackit.com',
        },
        'StackIt',
        'Password Reset Request - StackIt',
        user.email
      );

      return res.status(200).json({
        status: 200,
        message: 'Password reset email sent successfully! Please check your inbox.',
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({
        status: 500,
        message: 'Failed to send reset email. Please try again later.',
      });
    }
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Forgot password error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleForgotPassword;
