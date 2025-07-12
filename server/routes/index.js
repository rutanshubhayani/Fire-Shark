const express = require('express');
const { tokenVerification } = require('../middleware');
const auth = require('./auth');
const questions = require('./questions');
const answers = require('./answers');
const tags = require('./tags');
const notifications = require('./notifications');
const clearDatabase = require('./clear-database');
const test = require('./test');
const router = express.Router();

// TEST Route * /api/test
router.get('/test', test);

// AUTH Routes * /api/auth/*
router.use('/auth', auth);

// QUESTIONS Routes * /api/questions/*
router.use('/questions', questions);

// ANSWERS Routes * /api/answers/*
router.use('/answers', answers);

// TAGS Routes * /api/tags/*
router.use('/tags', tags);

// NOTIFICATIONS Routes * /api/notifications/*
router.use('/notifications', notifications);

// Clear Database Route * /api/clear-database
router.post('/clear-database', clearDatabase);

module.exports = router;
