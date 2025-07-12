const express = require('express');
const router = express.Router();
const { tokenVerification } = require('../../middleware');
const { imageUpload, handleImageUploadError } = require('../../middleware/imageUpload');

const createQuestion = require('./create');
const createQuestionWithImages = require('./create-with-images');
const getQuestions = require('./get-all');
const getQuestionById = require('./get-by-id');
const updateQuestion = require('./update');
const deleteQuestion = require('./delete');
const voteQuestion = require('./vote');
const { handleGetQuestionVote, handleGetQuestionVoters, handleGetQuestionVoteCount } = require('./vote');
const searchQuestions = require('./search');

// Public routes (no authentication required)
router.get('/', getQuestions);
router.get('/search', searchQuestions);
router.get('/:id', getQuestionById);
router.get('/:id/vote', handleGetQuestionVote);
router.get('/:id/voters', handleGetQuestionVoters);
router.get('/:id/votecount', handleGetQuestionVoteCount);

// Protected routes (authentication required)
router.post('/', tokenVerification, createQuestion);
router.post(
  '/create-with-images',
  tokenVerification,
  imageUpload.array('images', 5),
  handleImageUploadError,
  createQuestionWithImages
);
router.put('/:id', tokenVerification, updateQuestion);
router.delete('/:id', tokenVerification, deleteQuestion);
router.post('/:id/vote', tokenVerification, voteQuestion);

module.exports = router;
