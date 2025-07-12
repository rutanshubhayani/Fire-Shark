const bcrypt = require('bcryptjs');
const { findOne, updateDocument } = require('../../../helpers');
const Joi = require('joi');

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password (for logged-in users)
 *     description: Change password for authenticated users. Requires old password verification.
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
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 description: Current password
 *                 example: "Password123"
 *               newPassword:
 *                 type: string
 *                 description: New password
 *                 example: "NewPassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
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
 *                   example: "Password changed successfully."
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
 *                   example: "Validation error."
 *       401:
 *         description: Old password incorrect
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
 *                   example: "Old password is incorrect."
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

const schema = Joi.object({
  oldPassword: Joi.string().required().messages({
    'any.required': 'Old password is required'
  }),
  newPassword: Joi.string().min(6).max(30).pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])')).required().messages({
    'string.min': 'Password must be at least 6 characters long',
    'string.max': 'Password cannot exceed 30 characters',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'any.required': 'New password is required'
  })
});

async function handleChangePassword(req, res) {
  const { oldPassword, newPassword } = req.body;
  try {
    await schema.validateAsync(req.body);

    // User must be logged in (req.userId set by middleware)
    if (!req.userId) {
      return res.status(401).json({ status: 401, message: 'Authentication required.' });
    }

    const user = await findOne('user', { _id: req.userId });
    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found.' });
    }

    if (!bcrypt.compareSync(oldPassword, user.password)) {
      return res.status(401).json({ status: 401, message: 'Old password is incorrect.' });
    }

    const hashed = bcrypt.hashSync(newPassword, 12);
    await updateDocument('user', { _id: user._id }, { password: hashed });
    
    return res.status(200).json({ status: 200, message: 'Password changed successfully.' });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Change password error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleChangePassword;