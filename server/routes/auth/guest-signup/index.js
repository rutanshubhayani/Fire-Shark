const jwt = require('jsonwebtoken');
const { SECRET } = require('../../../config');
const { insertNewDocument } = require('../../../helpers');
const Joi = require('joi');

const guestSignupSchema = Joi.object({
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
});

/**
 * @swagger
 * /api/auth/guest-signup:
 *   post:
 *     summary: Guest user signup
 *     description: Create a guest account with just first name and last name
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
 *     responses:
 *       201:
 *         description: Guest account created successfully
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
 *                   example: "Guest account created successfully!"
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
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleGuestSignup(req, res) {
  const { first_name, last_name } = req.body;

  try {
    await guestSignupSchema.validateAsync(req.body);

    // Create guest user object
    const guestUser = {
      first_name: first_name.trim(),
      last_name: last_name.trim(),
      role: 'guest',
      isEmailVerified: true, // Guests don't need email verification
      avatar: '',
      bio: '',
    };

    // Save guest user to database
    const savedGuest = await insertNewDocument('user', guestUser);

    const userResponse = {
      _id: savedGuest._id,
      first_name: savedGuest.first_name,
      last_name: savedGuest.last_name,
      username: savedGuest.username,
      email: savedGuest.email,
      role: savedGuest.role,
      isEmailVerified: savedGuest.isEmailVerified,
      avatar: savedGuest.avatar,
      bio: savedGuest.bio,
      createdAt: savedGuest.createdAt,
    };

    // Generate JWT token for guest (shorter expiration)
    const token = jwt.sign({ id: savedGuest._id }, SECRET, {
      expiresIn: '24h',
    });

    return res.status(201).json({
      status: 201,
      message: 'Guest account created successfully!',
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

    console.error('Guest signup error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGuestSignup;
