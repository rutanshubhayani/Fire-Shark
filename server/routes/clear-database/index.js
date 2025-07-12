const { find, deleteDocument, findOne } = require('../../helpers');
const Models = require('../../models');

/**
 * @swagger
 * /api/clear-database:
 *   post:
 *     summary: Clear all database data
 *     description: Delete all data from all collections except admin users. Useful for testing and resetting the database.
 *     tags: [Database]
 *     responses:
 *       200:
 *         description: Database cleared successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: "Database cleared successfully! Deleted 15 documents."
 *                 deletedCount:
 *                   type: number
 *                   example: 15
 *                   description: Total number of documents deleted
 *                 adminPreserved:
 *                   type: boolean
 *                   example: true
 *                   description: Whether admin users were preserved
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: number
 *                   example: 500
 *                 message:
 *                   type: string
 *                   example: "Failed to clear database. Please try again."
 *                 error:
 *                   type: string
 *                   example: "Database connection error"
 */
async function handleClearDatabase(req, res) {
  try {
    console.log('🗑️  Starting database cleanup...');

    // Get all collections
    const collections = ['user', 'question', 'answer', 'tag', 'notification'];
    let deletedCount = 0;

    for (const collection of collections) {
      try {
        if (collection === 'user') {
          // For users, only delete non-admin users
          const usersToDelete = await find('user', { role: { $ne: 'admin' } });
          for (const user of usersToDelete) {
            await deleteDocument('user', { _id: user._id });
            deletedCount++;
          }
          console.log(`✅ Deleted ${usersToDelete.length} non-admin users`);
        } else {
          // For other collections, delete all documents
          const documents = await find(collection, {});
          for (const doc of documents) {
            await deleteDocument(collection, { _id: doc._id });
            deletedCount++;
          }
          console.log(`✅ Deleted ${documents.length} ${collection} documents`);
        }
      } catch (error) {
        console.error(`❌ Error deleting ${collection}:`, error.message);
      }
    }

    // Verify admin still exists
    const adminExists = await findOne('user', { role: 'admin' });
    if (!adminExists) {
      console.log('⚠️  No admin user found, creating default admin...');
      const { createDefaultAdmin } = require('../../helpers');
      const Config = require('../../config');
      await createDefaultAdmin(Config);
    }

    console.log(
      `✅ Database cleanup completed! Deleted ${deletedCount} documents total.`
    );

    return res.status(200).json({
      status: 200,
      message: `Database cleared successfully! Deleted ${deletedCount} documents.`,
      deletedCount,
      adminPreserved: true,
    });
  } catch (error) {
    console.error('❌ Database cleanup error:', error);
    return res.status(500).json({
      status: 500,
      message: 'Failed to clear database. Please try again.',
      error: error.message,
    });
  }
}

module.exports = handleClearDatabase;
