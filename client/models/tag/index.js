const mongoose = require('mongoose');
const tagSchema = require('./tag-schema');

module.exports = mongoose.model('tag', tagSchema);
