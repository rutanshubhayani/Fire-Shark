const express = require('express');
const router = express.Router();
const signUp = require('./signup');
const loginUser = require('./login');
const verifyEmail = require('./verify-email');
const resendVerification = require('./resend-verification');
// const checkPassword = require("./check-password");
// const { tokenVerification } = require("../../middleware");

// ROUTES * /api/auth/
router.post('/login', loginUser);
router.post('/register', signUp);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
// router.post("/", checkPassword);

module.exports = router;
