const express = require('express');
const router = express.Router();
const signUp = require('./signup');
const loginUser = require('./login');
const verifyEmail = require('./verify-email');
const resendVerification = require('./resend-verification');
const forgotPassword = require('./forgot-password');
const resetPassword = require('./reset-password');
const changePassword = require('./change-password');
const { tokenVerification } = require('../../middleware');

// ROUTES * /api/auth/
router.post('/login', loginUser);
router.post('/register', signUp);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', tokenVerification, changePassword);

module.exports = router;
