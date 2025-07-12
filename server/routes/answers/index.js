const express = require('express');
const router = express.Router();
const { tokenVerification } = require('../../middleware');
const { imageUpload, handleImageUploadError } = require('../../middleware/imageUpload');

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
  imageUpload.array('images', 5),
  handleImageUploadError,
  createAnswerWithImages
);
router.put('/:id', tokenVerification, updateAnswer);
router.delete('/:id', tokenVerification, deleteAnswer);
router.post('/:id/vote', tokenVerification, voteAnswer);
router.post('/:id/accept', tokenVerification, acceptAnswer);

module.exports = router;
