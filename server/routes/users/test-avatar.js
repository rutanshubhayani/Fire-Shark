const express = require('express');
const router = express.Router();

/**
 * @swagger
 * /api/users/test-avatar:
 *   get:
 *     summary: Test avatar upload setup
 *     tags: [Users]
 *     responses:
 *       200:
 *         description: Avatar upload setup is working
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
 *                   example: Avatar upload setup is working
 *                 cloudinary:
 *                   type: object
 *                   properties:
 *                     cloudName:
 *                       type: string
 *                       example: your_cloud_name
 *                     apiKey:
 *                       type: string
 *                       example: your_api_key
 *                     apiSecret:
 *                       type: string
 *                       example: your_api_secret
 */
router.get('/test-avatar', (req, res) => {
  const cloudinaryConfig = {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  };

  res.status(200).json({
    success: true,
    message: 'Avatar upload setup is working',
    data: {
      cloudinary: cloudinaryConfig,
      endpoints: {
        upload: 'POST /api/users/upload-avatar',
        remove: 'DELETE /api/users/remove-avatar',
      },
      requirements: {
        authentication: 'Bearer token required',
        fileType: 'Image files only (jpg, png, gif, webp)',
        fileSize: 'Max 5MB',
        formField: 'avatar',
      },
    },
  });
});

module.exports = router;
