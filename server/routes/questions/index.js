const express = require('express');
const multer = require('multer');
const router = express.Router();
const { tokenVerification } = require('../../middleware');

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

const createQuestion = require('./create');
const createQuestionWithImages = require('./create-with-images');
const getQuestions = require('./get-all');
const getQuestionById = require('./get-by-id');
const updateQuestion = require('./update');
const deleteQuestion = require('./delete');
const voteQuestion = require('./vote');
const searchQuestions = require('./search');

// Public routes (no authentication required)
router.get('/', getQuestions);
router.get('/search', searchQuestions);
router.get('/:id', getQuestionById);

// Protected routes (authentication required)
router.post('/', tokenVerification, createQuestion);
router.post(
  '/create-with-images',
  tokenVerification,
  upload.array('images', 5),
  createQuestionWithImages
);
router.put('/:id', tokenVerification, updateQuestion);
router.delete('/:id', tokenVerification, deleteQuestion);
router.post('/:id/vote', tokenVerification, voteQuestion);

module.exports = router;
