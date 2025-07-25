const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = {};

db.mongoose = mongoose;

db.user = require('./user');
db.question = require('./question');
db.answer = require('./answer');
db.tag = require('./tag');
db.notification = require('./notification');

module.exports = db;
