const mongoose = require('mongoose');
const answerSchema = require('./answer-schema');

module.exports = mongoose.model('answer', answerSchema);
