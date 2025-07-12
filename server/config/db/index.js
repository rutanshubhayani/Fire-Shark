const mongoose = require('mongoose');
const { DB_USER, DB_PASS, DB_NAME } = require('../');

mongoose.set('strictQuery', false);

mongoose.connect(
  `mongodb+srv://${DB_USER}:${DB_PASS}@hackathon.suoh6wq.mongodb.net/${DB_NAME}?retryWrites=true&w=majority&appName=hackathon`
);

module.exports = mongoose;
