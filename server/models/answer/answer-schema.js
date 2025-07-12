const mongoose = require('mongoose');
const schemaType = require('../../types');

const answerSchema = new mongoose.Schema(
  {
    body: {
      type: schemaType.TypeString, // Store as HTML or markdown
      required: true,
    },
    images: [
      {
        url: {
          type: schemaType.TypeString,
          required: true,
        },
        publicId: {
          type: schemaType.TypeString,
          required: true,
        },
        caption: {
          type: schemaType.TypeString,
          default: '',
        },
      },
    ],
    author: {
      type: schemaType.ObjectId,
      ref: 'user',
      required: true,
    },
    question: {
      type: schemaType.ObjectId,
      ref: 'question',
      required: true,
    },
    upvotes: [
      {
        type: schemaType.ObjectId,
        ref: 'user',
      },
    ],
    downvotes: [
      {
        type: schemaType.ObjectId,
        ref: 'user',
      },
    ],
    isAccepted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

module.exports = answerSchema;
