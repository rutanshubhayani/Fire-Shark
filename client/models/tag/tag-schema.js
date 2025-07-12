const mongoose = require('mongoose');
const schemaType = require('../../types');

const tagSchema = new mongoose.Schema(
  {
    name: {
      type: schemaType.TypeString,
      required: true,
      unique: true,
    },
    description: {
      type: schemaType.TypeString,
      default: '',
    },
  },
  { timestamps: true }
);

module.exports = tagSchema;
