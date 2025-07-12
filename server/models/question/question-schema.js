const mongoose = require('mongoose');
const schemaType = require('../../types');

const questionSchema = new mongoose.Schema(
  {
    title: {
      type: schemaType.TypeString,
      required: true,
    },
    description: {
      type: schemaType.TypeString, // Store as HTML or markdown
      required: true,
    },
    tags: [
      {
        type: schemaType.TypeString,
        required: true,
      },
    ],
    author: {
      type: schemaType.ObjectId,
      ref: 'user',
      required: true,
    },
    answers: [
      {
        type: schemaType.ObjectId,
        ref: 'answer',
      },
    ],
    acceptedAnswer: {
      type: schemaType.ObjectId,
      ref: 'answer',
      default: null,
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
  },
  { timestamps: true }
);

module.exports = questionSchema;
