const mongoose = require('mongoose');
const schemaType = require('../../types');

const userSchema = new mongoose.Schema(
  {
    first_name: {
      type: schemaType.TypeString,
      required: true,
    },
    last_name: {
      type: schemaType.TypeString,
      required: true,
    },
    username: {
      type: schemaType.TypeString,
      required: true,
      unique: true,
    },
    email: {
      type: schemaType.TypeString,
      required: true,
      unique: true,
    },
    password: {
      type: schemaType.TypeString,
      required: true,
    },
    role: {
      type: schemaType.TypeString,
      enum: ['admin', 'user', 'guest'],
      default: 'user',
    },
    avatar: {
      type: schemaType.TypeString,
      default: '',
    },
    bio: {
      type: schemaType.TypeString,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = userSchema;
