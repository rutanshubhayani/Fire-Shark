const { findOne, updateDocument } = require('../../../helpers');
const { send_email } = require('../../../lib');
const Joi = require('joi');

const resendSchema = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

const generateVerificationToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

async function handleResendVerification(req, res) {
  const { email } = req.body;

  try {
    await resendSchema.validateAsync(req.body);

    const user = await findOne('user', { email: email.toLowerCase() });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'No account found with this email address.',
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        status: 400,
        message: 'This email is already verified.',
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Update user with new token
    const updatedUser = await updateDocument(
      'user',
      { _id: user._id },
      {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires,
      }
    );

    if (!updatedUser) {
      return res.status(500).json({
        status: 500,
        message: 'Failed to generate verification token. Please try again.',
      });
    }

    // Send new verification email
    try {
      send_email(
        'resend-verification',
        {
          username: user.first_name,
          verificationLink: `${
            process.env.FRONTEND_URL || 'http://localhost:3000'
          }/verify-email?token=${verificationToken}`,
          email: user.email,
        },
        'StackIt',
        'Email Verification - StackIt',
        user.email
      );

      return res.status(200).json({
        status: 200,
        message:
          'Verification email sent successfully! Please check your inbox.',
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

    console.error('Resend verification error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleResendVerification;
