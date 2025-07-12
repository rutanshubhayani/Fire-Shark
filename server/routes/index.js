const express = require('express');
const { tokenVerification } = require('../middleware');
const auth = require('./auth');
const clearDatabase = require('./clear-database');
const router = express.Router();

// AUTH Routes * /api/auth/*
router.use('/auth', auth);

// Clear Database Route * /api/clear-database
router.post('/clear-database', clearDatabase);

module.exports = router;
