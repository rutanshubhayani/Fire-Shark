const express = require('express');
const router = express.Router();
const signUp = require('./signup');
const loginUser = require('./login');
const verifyEmail = require('./verify-email');
const resendVerification = require('./resend-verification');
const forgotPassword = require('./forgot-password');
const resetPassword = require('./reset-password');
const changePassword = require('./change-password');
const changeEmail = require('./change-email');
const guestSignup = require('./guest-signup');
const { tokenVerification } = require('../../middleware');

// ROUTES * /api/auth/
router.post('/login', loginUser);
router.post('/register', signUp);
router.post('/guest-signup', guestSignup);
router.get('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', tokenVerification, changePassword);
router.post('/change-email', tokenVerification, changeEmail);

module.exports = router;
