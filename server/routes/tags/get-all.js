const { find, getAggregate } = require('../../helpers');

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Get all tags
 *     description: Retrieve all tags with usage statistics
 *     tags: [Tags]
 *     parameters:
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [name, count, newest]
 *           default: count
 *         description: Sort order for tags
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of tags to return
 *     responses:
 *       200:
 *         description: Tags retrieved successfully
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
 *                   example: "Tags retrieved successfully"
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "507f1f77bcf86cd799439011"
 *                       name:
 *                         type: string
 *                         example: "react"
 *                       description:
 *                         type: string
 *                         example: "React.js framework"
 *                       questionCount:
 *                         type: number
 *                         example: 25
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleGetAllTags(req, res) {
  try {
    const { sort = 'count', limit = 50 } = req.query;
    const limitNum = Math.min(parseInt(limit), 100);

    let sortObj = {};
    switch (sort) {
      case 'name':
        sortObj = { name: 1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      default: // count
        sortObj = { questionCount: -1 };
    }

    // Get tags with question count using aggregation
    const tagsWithCount = await getAggregate('question', [
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          questionCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'tags',
          localField: '_id',
          foreignField: 'name',
          as: 'tagInfo',
        },
      },
      {
        $unwind: {
          path: '$tagInfo',
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: { $ifNull: ['$tagInfo._id', '$_id'] },
          name: '$_id',
          description: { $ifNull: ['$tagInfo.description', ''] },
          questionCount: 1,
          createdAt: { $ifNull: ['$tagInfo.createdAt', new Date()] },
        },
      },
      { $sort: sortObj },
      { $limit: limitNum },
    ]);

    return res.status(200).json({
      status: 200,
      message: 'Tags retrieved successfully',
      tags: tagsWithCount,
    });
  } catch (err) {
    console.error('Get tags error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetAllTags;
