const express = require('express');
const router = express.Router();
const { tokenVerification } = require('../../middleware');

const getNotifications = require('./get-all');
const markAsRead = require('./mark-as-read');
const markAllAsRead = require('./mark-all-as-read');
const deleteNotification = require('./delete');

// All notification routes require authentication
router.use(tokenVerification);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', deleteNotification);

module.exports = router;
