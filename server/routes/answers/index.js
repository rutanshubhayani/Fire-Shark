const express = require('express');
const multer = require('multer');
const router = express.Router();
const { tokenVerification } = require('../../middleware');

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

const createAnswer = require('./create');
const createAnswerWithImages = require('./create-with-images');
const getAnswersByQuestion = require('./get-by-question');
const updateAnswer = require('./update');
const deleteAnswer = require('./delete');
const voteAnswer = require('./vote');
const acceptAnswer = require('./accept');

// Public routes (no authentication required)
router.get('/question/:questionId', getAnswersByQuestion);

// Protected routes (authentication required)
router.post('/', tokenVerification, createAnswer);
router.post(
  '/create-with-images',
  tokenVerification,
  upload.array('images', 5),
  createAnswerWithImages
);
router.put('/:id', tokenVerification, updateAnswer);
router.delete('/:id', tokenVerification, deleteAnswer);
router.post('/:id/vote', tokenVerification, voteAnswer);
router.post('/:id/accept', tokenVerification, acceptAnswer);

module.exports = router;
