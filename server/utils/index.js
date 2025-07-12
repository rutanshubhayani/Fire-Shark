const { insertNewDocument, findOne } = require('../helpers');

/**
 * Create a notification for a user
 * @param {Object} notificationData - Notification data
 * @param {string} notificationData.user - User ID to notify
 * @param {string} notificationData.type - Type of notification (answer, comment, mention)
 * @param {string} notificationData.message - Notification message
 * @param {string} notificationData.link - Link to related content
 */
const createNotification = async (notificationData) => {
  try {
    const notification = await insertNewDocument('notification', {
      user: notificationData.user,
      type: notificationData.type,
      message: notificationData.message,
      link: notificationData.link || '',
      isRead: false,
    });
    
    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

/**
 * Create mention notifications for users mentioned in content
 * @param {string} content - Content to check for mentions
 * @param {string} authorId - ID of the content author
 * @param {string} link - Link to the content
 */
const createMentionNotifications = async (content, authorId, link) => {
  try {
    // Extract usernames mentioned with @ symbol
    const mentionRegex = /@(\w+)/g;
    const mentions = content.match(mentionRegex);
    
    if (!mentions) return;
    
    const author = await findOne('user', { _id: authorId });
    if (!author) return;
    
    for (const mention of mentions) {
      const username = mention.substring(1); // Remove @ symbol
      const mentionedUser = await findOne('user', { username: username.toLowerCase() });
      
      if (mentionedUser && mentionedUser._id.toString() !== authorId) {
        await createNotification({
          user: mentionedUser._id,
          type: 'mention',
          message: `${author.first_name} ${author.last_name} mentioned you in their post`,
          link,
        });
      }
    }
  } catch (error) {
    console.error('Error creating mention notifications:', error);
  }
};

/**
 * Sanitize HTML content to prevent XSS attacks
 * @param {string} html - HTML content to sanitize
 * @returns {string} Sanitized HTML
 */
const sanitizeHTML = (html) => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

/**
 * Generate a unique slug for questions
 * @param {string} title - Question title
 * @returns {string} URL-friendly slug
 */
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-');
};

/**
 * Calculate reputation score based on votes
 * @param {Array} upvotes - Array of upvote user IDs
 * @param {Array} downvotes - Array of downvote user IDs
 * @returns {number} Reputation score
 */
const calculateReputation = (upvotes, downvotes) => {
  return (upvotes.length - downvotes.length) * 10;
};

module.exports = {
  createNotification,
  createMentionNotifications,
  sanitizeHTML,
  generateSlug,
  calculateReputation,
};
