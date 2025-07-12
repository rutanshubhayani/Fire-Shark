const mongoose = require('mongoose');
const schemaType = require('../../types');

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: schemaType.ObjectId,
      ref: 'user',
      required: true,
    },
    type: {
      type: schemaType.TypeString, // 'answer', 'comment', 'mention'
      required: true,
    },
    message: {
      type: schemaType.TypeString,
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    link: {
      type: schemaType.TypeString, // URL to the related question/answer
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = notificationSchema;
