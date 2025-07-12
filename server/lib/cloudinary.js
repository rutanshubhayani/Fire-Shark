const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * Upload avatar image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} userId - The user ID for folder organization
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadAvatar = async (fileBuffer, userId) => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `fire-shark/avatar/${userId}`,
          resource_type: 'image',
          transformation: [
            { width: 200, height: 200, crop: 'fill', gravity: 'face' },
            { quality: 'auto' },
            { format: 'webp' },
          ],
          public_id: `avatar_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve(result);
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Avatar upload failed: ${error.message}`);
  }
};

/**
 * Upload question image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} questionId - The question ID for folder organization
 * @param {string} caption - Optional caption for the image
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadQuestionImage = async (fileBuffer, questionId, caption = '') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `fire-shark/question/${questionId}`,
          resource_type: 'image',
          transformation: [{ quality: 'auto' }, { format: 'webp' }],
          public_id: `question_img_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve({
              ...result,
              caption: caption,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Question image upload failed: ${error.message}`);
  }
};

/**
 * Upload answer image to Cloudinary
 * @param {Buffer} fileBuffer - The file buffer
 * @param {string} answerId - The answer ID for folder organization
 * @param {string} caption - Optional caption for the image
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const uploadAnswerImage = async (fileBuffer, answerId, caption = '') => {
  try {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: `fire-shark/answer/${answerId}`,
          resource_type: 'image',
          transformation: [{ quality: 'auto' }, { format: 'webp' }],
          public_id: `answer_img_${Date.now()}`,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Cloudinary upload failed: ${error.message}`));
          } else {
            resolve({
              ...result,
              caption: caption,
            });
          }
        }
      );

      uploadStream.end(fileBuffer);
    });
  } catch (error) {
    throw new Error(`Answer image upload failed: ${error.message}`);
  }
};

/**
 * Delete avatar from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Cloudinary delete result
 */
const deleteAvatar = async publicId => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Avatar deletion failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - The public ID of the image to delete
 * @returns {Promise<Object>} - Cloudinary delete result
 */
const deleteImage = async publicId => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw new Error(`Image deletion failed: ${error.message}`);
  }
};

/**
 * Update avatar - delete old and upload new
 * @param {Buffer} fileBuffer - The new file buffer
 * @param {string} userId - The user ID
 * @param {string} oldPublicId - The old public ID to delete
 * @returns {Promise<Object>} - Cloudinary upload result
 */
const updateAvatar = async (fileBuffer, userId, oldPublicId = null) => {
  try {
    // Delete old avatar if it exists
    if (oldPublicId) {
      await deleteAvatar(oldPublicId);
    }

    // Upload new avatar
    const result = await uploadAvatar(fileBuffer, userId);
    return result;
  } catch (error) {
    throw new Error(`Avatar update failed: ${error.message}`);
  }
};

module.exports = {
  uploadAvatar,
  uploadQuestionImage,
  uploadAnswerImage,
  deleteAvatar,
  deleteImage,
  updateAvatar,
};
