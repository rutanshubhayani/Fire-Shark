const express = require('express');
const { tokenVerification } = require('../middleware');
const auth = require('./auth');
const questions = require('./questions');
const answers = require('./answers');
const tags = require('./tags');
const notifications = require('./notifications');
const stats = require('./stats');
const {
  handleUploadAvatar,
  handleRemoveAvatar,
  upload: avatarUpload,
} = require('./users/upload-avatar');
const testAvatar = require('./users/test-avatar');
const clearDatabase = require('./clear-database');
const test = require('./test');
const testGuest = require('./test-guest');
const router = express.Router();

// TEST Routes * /api/test
router.get('/test', test);
router.get('/test-guest', testGuest);

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

// STATS Route * /api/stats
router.use('/stats', stats);

// USERS Routes * /api/users/*
router.post(
  '/users/upload-avatar',
  tokenVerification,
  avatarUpload.single('avatar'),
  handleUploadAvatar
);
router.delete('/users/remove-avatar', tokenVerification, handleRemoveAvatar);
router.use('/users', require('./users'));
router.use('/users', testAvatar);

// Clear Database Route * /api/clear-database
router.post('/clear-database', clearDatabase);

module.exports = router;
