const Joi = require('joi');
const { findOne, updateDocument } = require('../../helpers');

const updateTagSchema = Joi.object({
  name: Joi.string().min(1).max(20).optional().messages({
    'string.min': 'Tag name must be at least 1 character long',
    'string.max': 'Tag name cannot exceed 20 characters',
  }),
  description: Joi.string().max(200).optional().messages({
    'string.max': 'Description cannot exceed 200 characters',
  }),
});

/**
 * @swagger
 * /api/tags/{id}:
 *   put:
 *     summary: Update a tag
 *     description: Update an existing tag (admin only)
 *     tags: [Tags]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *       200:
 *         description: Tag updated successfully
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
 *                   example: "Tag updated successfully!"
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
 *       404:
 *         description: Tag not found
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
async function handleUpdateTag(req, res) {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const updateData = req.body;

    // Validate request body
    await updateTagSchema.validateAsync(updateData);

    // Check if user is admin
    const user = await findOne('user', { _id: userId });
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        status: 403,
        message: 'Admin access required to update tags',
      });
    }

    // Check if tag exists
    const tag = await findOne('tag', { _id: id });
    if (!tag) {
      return res.status(404).json({
        status: 404,
        message: 'Tag not found',
      });
    }

    // Prepare update data
    const updateFields = {};
    if (updateData.name)
      updateFields.name = updateData.name.toLowerCase().trim();
    if (updateData.description !== undefined)
      updateFields.description = updateData.description.trim();

    // Update tag
    const updatedTag = await updateDocument('tag', { _id: id }, updateFields);

    return res.status(200).json({
      status: 200,
      message: 'Tag updated successfully!',
      tag: updatedTag,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        status: 400,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Update tag error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleUpdateTag;
