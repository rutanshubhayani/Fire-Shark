const Joi = require('joi');
const { insertNewDocument, findOne } = require('../../helpers');

const createTagSchema = Joi.object({
  name: Joi.string().min(1).max(20).required().messages({
    'string.min': 'Tag name must be at least 1 character long',
    'string.max': 'Tag name cannot exceed 20 characters',
    'any.required': 'Tag name is required',
  }),
  description: Joi.string().max(200).optional().messages({
    'string.max': 'Description cannot exceed 200 characters',
  }),
});

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Create a new tag
 *     description: Create a new tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 20
 *                 example: "react"
 *                 description: Tag name
 *               description:
 *                 type: string
 *                 maxLength: 200
 *                 example: "React.js framework"
 *                 description: Tag description
 *     responses:
 *       201:
 *         description: Tag created successfully
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
 *                   example: "Tag created successfully!"
 *                 tag:
 *                   $ref: '#/components/schemas/Tag'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Tag already exists
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
async function handleCreateTag(req, res) {
  try {
    const { name, description } = req.body;
    const userId = req.userId;

    // Validate request body
    await createTagSchema.validateAsync(req.body);

    // Check if user is admin
    const user = await findOne('user', { _id: userId });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 403,
        message: 'Admin access required to create tags',
      });
    }

    // Check if tag already exists
    const existingTag = await findOne('tag', { name: name.toLowerCase() });
    if (existingTag) {
      return res.status(409).json({
        status: 409,
        message: 'Tag already exists',
      });
    }

    // Create tag
    const tagData = {
      name: name.toLowerCase().trim(),
      description: description ? description.trim() : '',
    };

    const savedTag = await insertNewDocument('tag', tagData);

    return res.status(201).json({
      status: 201,
      message: 'Tag created successfully!',
      tag: savedTag,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Create tag error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleCreateTag; 