const multer = require('multer');
const Joi = require('joi');
const { uploadAvatar, updateAvatar, deleteAvatar } = require('../../lib');
const User = require('../../models/user');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  },
});

// Validation schema for avatar upload
const uploadAvatarSchema = Joi.object({
  // No body validation needed for file upload
});

/**
 * @swagger
 * /api/users/upload-avatar:
 *   post:
 *     summary: Upload user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Avatar image file (max 5MB)
 *     responses:
 *       200:
 *         description: Avatar uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Avatar uploaded successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     avatar:
 *                       type: string
 *                       example: https://res.cloudinary.com/your-cloud/image/upload/v1234567890/fire-shark/avatar/user123/avatar_1234567890.webp
 *                     publicId:
 *                       type: string
 *                       example: fire-shark/avatar/user123/avatar_1234567890
 *       400:
 *         description: Bad request - Invalid file or validation error
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       500:
 *         description: Internal server error
 */
async function handleUploadAvatar(req, res) {
  try {
    // Validate request
    const { error } = uploadAvatarSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded. Please select an image file.',
      });
    }

    const userId = req.userId;

    // Get user to check if they have an existing avatar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    let uploadResult;

    // If user has an existing avatar, update it
    if (user.avatar && user.avatar !== '') {
      // Extract public ID from existing avatar URL
      const urlParts = user.avatar.split('/');
      const publicId = urlParts.slice(-2).join('/').split('.')[0]; // Remove file extension

      uploadResult = await updateAvatar(req.file.buffer, userId, publicId);
    } else {
      // Upload new avatar
      uploadResult = await uploadAvatar(req.file.buffer, userId);
    }

    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: uploadResult.secure_url },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload avatar',
    });
  }
}

/**
 * @swagger
 * /api/users/remove-avatar:
 *   delete:
 *     summary: Remove user avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Avatar removed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Avatar removed successfully
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
async function handleRemoveAvatar(req, res) {
  try {
    const userId = req.userId;

    // Get user to check if they have an avatar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!user.avatar || user.avatar === '') {
      return res.status(400).json({
        success: false,
        message: 'No avatar to remove',
      });
    }

    // Extract public ID from avatar URL
    const urlParts = user.avatar.split('/');
    const publicId = urlParts.slice(-2).join('/').split('.')[0]; // Remove file extension

    // Delete from Cloudinary
    await deleteAvatar(publicId);

    // Update user's avatar in database
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { avatar: '' },
      { new: true }
    ).select('-password');

    res.status(200).json({
      success: true,
      message: 'Avatar removed successfully',
      data: {
        user: updatedUser,
      },
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to remove avatar',
    });
  }
}

module.exports = {
  handleUploadAvatar,
  handleRemoveAvatar,
  upload,
};
