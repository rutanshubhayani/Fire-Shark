const express = require('express');
const router = express.Router();
const { tokenVerification } = require('../../middleware');

const createQuestion = require('./create');
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
router.put('/:id', tokenVerification, updateQuestion);
router.delete('/:id', tokenVerification, deleteQuestion);
router.post('/:id/vote', tokenVerification, voteQuestion);

module.exports = router; 