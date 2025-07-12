const bcrypt = require('bcryptjs');
const { findOne, updateDocument } = require('../../../helpers');
const { send_email } = require('../../../lib');
const Joi = require('joi');

const changeEmailSchema = Joi.object({
  currentPassword: Joi.string().required().messages({
    'any.required': 'Current password is required',
  }),
  newEmail: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'New email is required',
  }),
});

const generateEmailVerificationToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * @swagger
 * /api/auth/change-email:
 *   post:
 *     summary: Change email address
 *     description: Change user's email address. Requires password verification and sends verification email to new address.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newEmail
 *             properties:
 *               currentPassword:
 *                 type: string
 *                 description: Current password for verification
 *                 example: "Password123"
 *               newEmail:
 *                 type: string
 *                 format: email
 *                 description: New email address
 *                 example: "newemail@example.com"
 *     responses:
 *       200:
 *         description: Email change request successful
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
 *                   example: "Email change request submitted. Please check your new email for verification."
 *       400:
 *         description: Validation error or email already exists
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
 *                   example: "Email already exists."
 *       401:
 *         description: Password incorrect
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 401
 *                 message:
 *                   type: string
 *                   example: "Current password is incorrect."
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
async function handleChangeEmail(req, res) {
  const { currentPassword, newEmail } = req.body;

  try {
    await changeEmailSchema.validateAsync(req.body);

    // User must be logged in (req.userId set by middleware)
    if (!req.userId) {
      return res
        .status(401)
        .json({ status: 401, message: 'Authentication required.' });
    }

    const user = await findOne('user', { _id: req.userId });
    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found.' });
    }

    // Verify current password
    if (!bcrypt.compareSync(currentPassword, user.password)) {
      return res
        .status(401)
        .json({ status: 401, message: 'Current password is incorrect.' });
    }

    // Check if new email already exists
    const existingUser = await findOne('user', { email: newEmail.toLowerCase() });
    if (existingUser && existingUser._id.toString() !== user._id.toString()) {
      return res.status(400).json({
        status: 400,
        message: 'Email already exists.',
      });
    }

    // Generate verification token for new email
    const verificationToken = generateEmailVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Update user with new email and verification token
    await updateDocument(
      'user',
      { _id: user._id },
      {
        newEmail: newEmail.toLowerCase(),
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
        isEmailVerified: false, // Will be verified when they click the link
      }
    );

    // Send verification email to new address
    try {
      send_email(
        'registration-email',
        {
          username: user.first_name,
          verificationLink: `${
            process.env.NODE_ENV === 'production'
              ? process.env.FRONTEND_URL_PROD
              : process.env.FRONTEND_URL_DEV
          }/verify-email?token=${verificationToken}`,
          email: newEmail,
          supportEmail:
            process.env.NODE_ENV === 'production'
              ? 'support@stackit.com'
              : 'support@stackit.com',
        },
        'StackIt',
        'Verify Your New Email - StackIt',
        newEmail
      );

      return res.status(200).json({
        status: 200,
        message: 'Email change request submitted. Please check your new email for verification.',
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({
        status: 500,
        message: 'Failed to send verification email. Please try again later.',
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

    console.error('Change email error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleChangeEmail; 