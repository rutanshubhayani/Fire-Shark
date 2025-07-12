const multer = require('multer');
const Joi = require('joi');
const { uploadAnswerImage } = require('../../lib');
const { insertNewDocument, findOne, updateDocument } = require('../../helpers');
const { createNotification, createMentionNotifications } = require('../../utils');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for answer images
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

// Validation schema for answer creation with images
const createAnswerWithImagesSchema = Joi.object({
  body: Joi.string().min(10).required().messages({
    'string.min': 'Answer must be at least 10 characters long',
    'any.required': 'Answer body is required',
  }),
  questionId: Joi.string().required().messages({
    'any.required': 'Question ID is required',
  }),
  imageCaptions: Joi.array().items(Joi.string().max(200)).optional(),
});

/**
 * @swagger
 * /api/answers/create-with-images:
 *   post:
 *     summary: Create a new answer with images
 *     description: Create a new answer for a question with optional images
 *     tags: [Answers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - body
 *               - questionId
 *             properties:
 *               body:
 *                 type: string
 *                 minLength: 10
 *                 example: "<p>Here's how you can implement JWT authentication in React...</p>"
 *                 description: Answer content (HTML)
 *               questionId:
 *                 type: string
 *                 example: "507f1f77bcf86cd799439011"
 *                 description: ID of the question being answered
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
 *         description: Answer created successfully
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
 *                   example: "Answer created successfully!"
 *                 answer:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     body:
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
 *                     author:
 *                       type: object
 *                     question:
 *                       type: string
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Question not found
 *       500:
 *         description: Internal server error
 */
async function handleCreateAnswerWithImages(req, res) {
  try {
    const { body, questionId, imageCaptions } = req.body;
    const userId = req.userId;
    const uploadedFiles = req.files || [];

    // Parse image captions from comma-separated string
    const captionsArray = imageCaptions
      ? imageCaptions.split(',').map(caption => caption.trim())
      : [];

    // Validate request body
    const validationData = {
      body,
      questionId,
      imageCaptions: captionsArray,
    };

    await createAnswerWithImagesSchema.validateAsync(validationData);

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
        message: 'Please verify your email before posting answers',
      });
    }

    // Check if question exists
    const question = await findOne('question', { _id: questionId });
    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Question not found',
      });
    }

    // Create answer object
    const answerData = {
      body: body.trim(),
      author: userId,
      question: questionId,
      upvotes: [],
      downvotes: [],
      isAccepted: false,
      images: [],
    };

    // Save answer to database first to get the ID
    const savedAnswer = await insertNewDocument('answer', answerData);

    // Create mention notifications for users mentioned in answer body
    await createMentionNotifications(
      body,
      userId,
      `/questions/${questionId}#answer-${savedAnswer._id}`
    );

    // Upload images if provided
    const uploadedImages = [];
    if (uploadedFiles.length > 0) {
      for (let i = 0; i < uploadedFiles.length; i++) {
        const file = uploadedFiles[i];
        const caption = captionsArray[i] || '';

        try {
          const uploadResult = await uploadAnswerImage(
            file.buffer,
            savedAnswer._id.toString(),
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

      // Update answer with uploaded images
      if (uploadedImages.length > 0) {
        await savedAnswer.updateOne({ images: uploadedImages });
        savedAnswer.images = uploadedImages;
      }
    }

    // Add answer to question's answers array
    await updateDocument(
      'question',
      { _id: questionId },
      {
        $push: { answers: savedAnswer._id },
      }
    );

    // Create notification for question author
    if (question.author.toString() !== userId) {
      await createNotification({
        user: question.author,
        type: 'answer',
        message: `${user.first_name} ${user.last_name} answered your question "${question.title}"`,
        link: `/questions/${questionId}#answer-${savedAnswer._id}`,
      });
    }

    // Populate author information
    const populatedAnswer = await savedAnswer.populate(
      'author',
      'first_name last_name username avatar'
    );

    // Create response object
    const answerResponse = {
      _id: populatedAnswer._id,
      body: populatedAnswer.body,
      images: populatedAnswer.images || [],
      author: {
        _id: populatedAnswer.author._id,
        first_name: populatedAnswer.author.first_name,
        last_name: populatedAnswer.author.last_name,
        username: populatedAnswer.author.username,
        avatar: populatedAnswer.author.avatar,
      },
      question: populatedAnswer.question,
      upvotes: populatedAnswer.upvotes,
      downvotes: populatedAnswer.downvotes,
      isAccepted: populatedAnswer.isAccepted,
      createdAt: populatedAnswer.createdAt,
      updatedAt: populatedAnswer.updatedAt,
    };

    return res.status(201).json({
      success: true,
      message: 'Answer created successfully!',
      answer: answerResponse,
    });
  } catch (err) {
    if (err.isJoi) {
      return res.status(400).json({
        success: false,
        message: err.details[0].message,
        field: err.details[0].path[0],
      });
    }

    console.error('Create answer with images error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleCreateAnswerWithImages;
