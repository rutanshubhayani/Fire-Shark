const mongoose = require('mongoose');
const notificationSchema = require('./notification-schema');

module.exports = mongoose.model('notification', notificationSchema);
