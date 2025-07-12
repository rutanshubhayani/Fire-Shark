const { findOne, updateDocument } = require('../../../helpers');

async function handleEmailVerification(req, res) {
  const { token } = req.query;

  try {
    if (!token) {
      return res.status(400).json({
        status: 400,
        message: 'Verification token is required.',
      });
    }

    // Find user with this verification token
    const user = await findOne('user', {
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        status: 400,
        message: 'Invalid or expired verification token.',
      });
    }

    // Update user to mark email as verified
    const updatedUser = await updateDocument(
      'user',
      { _id: user._id },
      {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      }
    );

    if (!updatedUser) {
      return res.status(500).json({
        status: 500,
        message: 'Failed to verify email. Please try again.',
      });
    }

    return res.status(200).json({
      status: 200,
      message:
        'Email verified successfully! You can now login to your account.',
      user: {
        _id: updatedUser._id,
        first_name: updatedUser.first_name,
        last_name: updatedUser.last_name,
        username: updatedUser.username,
        email: updatedUser.email,
        isEmailVerified: updatedUser.isEmailVerified,
        role: updatedUser.role,
      },
    });
  } catch (error) {
    console.error('Email verification error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleEmailVerification;
