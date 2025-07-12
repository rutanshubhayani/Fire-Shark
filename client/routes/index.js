const express = require('express');
const { tokenVerification } = require('../middleware');
const auth = require('./auth');
const router = express.Router();

// AUTH Routes * /api/auth/*
router.use('/auth', auth);

module.exports = router;
