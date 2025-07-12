const express = require('express');
const router = express.Router();
const { tokenVerification } = require('../../middleware');

const getAllTags = require('./get-all');
const getTagByName = require('./get-by-name');
const createTag = require('./create');
const updateTag = require('./update');
const deleteTag = require('./delete');

// Public routes (no authentication required)
router.get('/', getAllTags);
router.get('/:name', getTagByName);

// Protected routes (admin only)
router.post('/', tokenVerification, createTag);
router.put('/:id', tokenVerification, updateTag);
router.delete('/:id', tokenVerification, deleteTag);

module.exports = router; 