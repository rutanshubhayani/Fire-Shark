const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../../../config');
const { insertNewDocument, findOne } = require('../../../helpers');
const Joi = require('joi');
const { send_email } = require('../../../lib');

const signupSchema = Joi.object({
  first_name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  last_name: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  username: Joi.string().alphanum().min(3).max(30).required().messages({
    'string.alphanum': 'Username must contain only letters and numbers',
    'string.min': 'Username must be at least 3 characters long',
    'string.max': 'Username cannot exceed 30 characters',
    'any.required': 'Username is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string()
    .min(6)
    .max(30)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 30 characters',
      'string.pattern.base':
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required',
    }),
});

const generateVerificationToken = () => {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
};

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with email verification
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - first_name
 *               - last_name
 *               - username
 *               - email
 *               - password
 *             properties:
 *               first_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "John"
 *                 description: User's first name
 *               last_name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 50
 *                 example: "Doe"
 *                 description: User's last name
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *                 pattern: '^[a-zA-Z0-9]+$'
 *                 example: "johndoe"
 *                 description: Unique username (alphanumeric only)
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *                 description: User's email address
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 maxLength: 30
 *                 pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])'
 *                 example: "Password123"
 *                 description: Password (must contain uppercase, lowercase, and number)
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: "User registered successfully! Please check your email to verify your account."
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *                 token:
 *                   type: string
 *                   example: "jwt_token_here"
 *                 requiresEmailVerification:
 *                   type: boolean
 *                   example: true
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
 *                   example: "First name must be at least 2 characters long"
 *                 field:
 *                   type: string
 *                   example: "first_name"
 *       409:
 *         description: User already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 409
 *                 message:
 *                   type: string
 *                   example: "An account with this email already exists."
 *                 field:
 *                   type: string
 *                   example: "email"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleSignup(req, res) {
  const { first_name, last_name, username, email, password } = req.body;

  try {
    await signupSchema.validateAsync(req.body);

    const existingUser = await findOne('user', {
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() },
      ],
    });

    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({
          status: 409,
          message: 'An account with this email already exists.',
          field: 'email',
        });
      } else {
        return res.status(409).json({
          status: 409,
          message: 'This username is already taken.',
          field: 'username',
        });
      }
    }

    const verificationToken = generateVerificationToken();
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const userToSave = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: bcrypt.hashSync(password, 12),
      role: 'user',
      isEmailVerified: false,
      emailVerificationToken: verificationToken,
      emailVerificationExpires: verificationExpires,
      avatar: '',
      bio: '',
    };

    const savedUser = await insertNewDocument('user', userToSave);

    const userResponse = {
      _id: savedUser._id,
      first_name: savedUser.first_name,
      last_name: savedUser.last_name,
      username: savedUser.username,
      email: savedUser.email,
      role: savedUser.role,
      isEmailVerified: savedUser.isEmailVerified,
      avatar: savedUser.avatar,
      bio: savedUser.bio,
      createdAt: savedUser.createdAt,
    };

    const token = jwt.sign({ id: savedUser._id }, SECRET, { expiresIn: '7d' });

    try {
      send_email(
        'registration-email',
        {
          username: savedUser.first_name,
          verificationLink: `${
            process.env.NODE_ENV === 'production'
              ? process.env.FRONTEND_URL_PROD
              : process.env.FRONTEND_URL_DEV
          }/verify-email?token=${verificationToken}`,
          email: savedUser.email,
          supportEmail:
            process.env.NODE_ENV === 'production'
              ? 'support@stackit.com'
              : 'support@stackit.com',
        },
        'StackIt',
        'Welcome to StackIt! Please verify your email',
        savedUser.email
      );
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }

    return res.status(201).json({
      status: 201,
      message:
        'User registered successfully! Please check your email to verify your account.',
      user: userResponse,
      token,
      requiresEmailVerification: true,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Signup error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleSignup;
