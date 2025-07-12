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
      required: function () {
        return this.role !== 'guest';
      },
      unique: function () {
        return this.role !== 'guest';
      },
    },
    email: {
      type: schemaType.TypeString,
      required: function () {
        return this.role !== 'guest';
      },
      unique: function () {
        return this.role !== 'guest';
      },
    },
    password: {
      type: schemaType.TypeString,
      required: function () {
        return this.role !== 'guest';
      },
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
    // Email verification fields
    isEmailVerified: {
      type: schemaType.TypeBoolean,
      default: false,
    },
    emailVerificationToken: {
      type: schemaType.TypeString,
      default: null,
    },
    emailVerificationExpires: {
      type: schemaType.TypeDate,
      default: null,
    },
    // Password reset fields
    resetPasswordToken: {
      type: schemaType.TypeString,
      default: null,
    },
    resetPasswordExpires: {
      type: schemaType.TypeDate,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = userSchema;
