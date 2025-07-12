const { send_email } = require('./node-mailer');
const {
  uploadAvatar,
  deleteAvatar,
  updateAvatar,
  uploadQuestionImage,
  uploadAnswerImage,
  deleteImage,
} = require('./cloudinary');

module.exports = {
  send_email,
  uploadAvatar,
  deleteAvatar,
  updateAvatar,
  uploadQuestionImage,
  uploadAnswerImage,
  deleteImage,
};
