const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../../../config');
const { findOne } = require('../../../helpers');
const Joi = require('joi');

const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    'any.required': 'Username or email is required',
  }),
  password: Joi.string().min(6).max(30).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 30 characters',
    'any.required': 'Password is required',
  }),
});

async function handleLogin(req, res) {
  const { identifier, password } = req.body;

  try {
    await loginSchema.validateAsync(req.body);

    let user = await findOne('user', {
      $or: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    });

    if (!user) {
      return res.status(404).json({
        status: 404,
        message: 'User not found. Please check your credentials.',
      });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: 401,
        message: 'Invalid credentials. Please check your password.',
      });
    }

    if (user.role === 'user' && !user.isEmailVerified) {
      return res.status(403).json({
        status: 403,
        message:
          'Please verify your email address before logging in. Check your inbox for the verification link.',
        requiresEmailVerification: true,
        email: user.email,
      });
    }

    const userResponse = {
      _id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      username: user.username,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      bio: user.bio,
      createdAt: user.createdAt,
    };

    const token = jwt.sign({ id: user._id }, SECRET, { expiresIn: '7d' });

    return res.status(200).json({
      status: 200,
      message: 'Login successful!',
      user: userResponse,
      token,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Login error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleLogin;
