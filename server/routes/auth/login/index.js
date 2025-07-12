const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../../../config');
const { findOne } = require('../../../helpers');
const Joi = require('joi');
const { send_email } = require('../../../lib');

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

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user with username/email and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - identifier
 *               - password
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: "johndoe"
 *                 description: Username or email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 30
 *                 example: "Password123"
 *                 description: User password
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: "Login successful!"
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "jwt_token_here"
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
 *                   example: "Username or email is required"
 *                 field:
 *                   type: string
 *                   example: "identifier"
 *       401:
 *         description: Invalid credentials
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
 *                   example: "Invalid credentials. Please check your password."
 *       403:
 *         description: Email not verified
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 403
 *                 message:
 *                   type: string
 *                   example: "Please verify your email address before logging in. Check your inbox for the verification link."
 *                 requiresEmailVerification:
 *                   type: boolean
 *                   example: true
 *                 email:
 *                   type: string
 *                   example: "john@example.com"
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
 *                   example: "User not found. Please check your credentials."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
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

    // Send login alert email
    try {
      const loginTime = new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' });
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.ip || 'Unknown';
      const resetLink = `${process.env.NODE_ENV === 'production' ? process.env.FRONTEND_URL_PROD : process.env.FRONTEND_URL_DEV}/forgot-password`;
      const supportEmail = process.env.NODE_ENV === 'production' ? 'support@stackit.com' : 'support@stackit.com';
      send_email(
        'login-alert',
        {
          username: user.first_name,
          loginTime,
          ipAddress,
          resetLink,
          supportEmail,
        },
        'StackIt',
        'Login Alert - StackIt',
        user.email
      );
    } catch (emailError) {
      console.error('Login alert email failed:', emailError);
    }

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
