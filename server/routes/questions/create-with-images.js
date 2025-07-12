const multer = require('multer');
const Joi = require('joi');
const { uploadQuestionImage } = require('../../lib');
const { insertNewDocument, findOne } = require('../../helpers');
const { createNotification } = require('../../utils');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for question images
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

// Validation schema for question creation with images
const createQuestionWithImagesSchema = Joi.object({
  title: Joi.string().min(10).max(200).required().messages({
    'string.min': 'Title must be at least 10 characters long',
    'string.max': 'Title cannot exceed 200 characters',
    'any.required': 'Title is required',
  }),
  description: Joi.string().min(20).required().messages({
    'string.min': 'Description must be at least 20 characters long',
    'any.required': 'Description is required',
  }),
  tags: Joi.array()
    .items(Joi.string().min(1).max(20))
    .min(1)
    .max(5)
    .required()
    .messages({
      'array.min': 'At least one tag is required',
      'array.max': 'Cannot exceed 5 tags',
      'any.required': 'Tags are required',
    }),
  imageCaptions: Joi.array().items(Joi.string().max(200)).optional(),
});

/**
 * @swagger
 * /api/questions/create-with-images:
 *   post:
 *     summary: Create a new question with images
 *     description: Create a new question with title, description, tags, and optional images
 *     tags: [Questions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 200
 *                 example: "How to implement JWT authentication in React?"
 *                 description: Question title
 *               description:
 *                 type: string
 *                 minLength: 20
 *                 example: "<p>I'm building a React app and need to implement JWT authentication...</p>"
 *                 description: Question description (HTML content)
 *               tags:
 *                 type: string
 *                 example: "react,jwt,authentication"
 *                 description: Comma-separated tags
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Optional image files (max 5 images, 10MB each)
 *               imageCaptions:
 *                 type: string
 *                 example: "Code screenshot,Error message"
 *                 description: Comma-separated captions for images
 *     responses:
 *       201:
 *         description: Question created successfully
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
 *                   example: "Question created successfully!"
 *                 question:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           url:
 *                             type: string
 *                           publicId:
 *                             type: string
 *                           caption:
 *                             type: string
 *                     tags:
 *                       type: array
 *                       items:
 *                         type: string
 *                     author:
 *                       type: object
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handleCreateQuestionWithImages(req, res) {
  try {
    const { title, description, tags, imageCaptions } = req.body;
    const userId = req.userId;
    const uploadedFiles = req.files || [];

    // Parse tags from comma-separated string
    const tagsArray = tags
      .split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);

    // Parse image captions from comma-separated string
    const captionsArray = imageCaptions
      ? imageCaptions.split(',').map(caption => caption.trim())
      : [];

    // Validate request body
    const validationData = {
      title,
      description,
      tags: tagsArray,
      imageCaptions: captionsArray,
    };

    await createQuestionWithImagesSchema.validateAsync(validationData);

    // Check if user exists and is verified
    const user = await findOne('user', { _id: userId });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'user' && !user.isEmailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email before posting questions',
      });
    }

    // Create question object
    const questionData = {
      title: title.trim(),
      description: description.trim(),
      tags: tagsArray.map(tag => tag.toLowerCase()),
      author: userId,
      answers: [],
      acceptedAnswer: null,
      upvotes: [],
      downvotes: [],
      images: [],
    };

    // Save question to database first to get the ID
    const savedQuestion = await insertNewDocument('question', questionData);

    // Upload images if provided
    const uploadedImages = [];
    if (uploadedFiles.length > 0) {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const caption = captionsArray[i] || '';

        try {
          const uploadResult = await uploadQuestionImage(
            file.buffer,
            savedQuestion._id.toString(),
            caption
          );

          uploadedImages.push({
            url: uploadResult.secure_url,
            publicId: uploadResult.public_id,
            caption: caption,
          });
        } catch (uploadError) {
          console.error(`Failed to upload image ${i + 1}:`, uploadError);
          // Continue with other images even if one fails
        }
      }

      // Update question with uploaded images
      if (uploadedImages.length > 0) {
        await savedQuestion.updateOne({ images: uploadedImages });
        savedQuestion.images = uploadedImages;
      }
    }

    // Populate author information
    const populatedQuestion = await savedQuestion.populate(
      'author',
      'first_name last_name username avatar'
    );

    // Create response object
    const questionResponse = {
      _id: populatedQuestion._id,
      title: populatedQuestion.title,
      description: populatedQuestion.description,
      images: populatedQuestion.images,
      tags: populatedQuestion.tags,
      author: {
        _id: populatedQuestion.author._id,
        first_name: populatedQuestion.author.first_name,
        last_name: populatedQuestion.author.last_name,
        username: populatedQuestion.author.username,
        avatar: populatedQuestion.author.avatar,
      },
      answers: populatedQuestion.answers,
      acceptedAnswer: populatedQuestion.acceptedAnswer,
      upvotes: populatedQuestion.upvotes,
      downvotes: populatedQuestion.downvotes,
      createdAt: populatedQuestion.createdAt,
      updatedAt: populatedQuestion.updatedAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Question created successfully!',
      question: questionResponse,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        success: false,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Create question with images error:', err);
    return res.status(500).json({
      success: false,
      message: err.message || 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleCreateQuestionWithImages;
