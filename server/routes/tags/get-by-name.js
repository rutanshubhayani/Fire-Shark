const { findOne, getAggregate } = require('../../helpers');

/**
 * @swagger
 * /api/tags/{name}:
 *   get:
 *     summary: Get tag by name
 *     description: Get tag information and related questions
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: name
 *         required: true
 *         schema:
 *           type: string
 *         description: Tag name
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Number of questions per page
 *     responses:
 *       200:
 *         description: Tag information retrieved successfully
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
 *                   example: "Tag information retrieved successfully"
 *                 tag:
 *                   $ref: '#/components/schemas/Tag'
 *                 questions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Question'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: number
 *                       example: 1
 *                     totalPages:
 *                       type: number
 *                       example: 5
 *                     totalQuestions:
 *                       type: number
 *                       example: 50
 *       404:
 *         description: Tag not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleGetTagByName(req, res) {
  try {
    const { name } = req.params;
    const { page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    // Get tag information
    const tag = await findOne('tag', { name: name.toLowerCase() });
    if (!tag) {
      return res.status(404).json({
        status: 404,
        message: 'Tag not found',
      });
    }

    // Get questions with this tag
    const questionsWithTag = await getAggregate('question', [
      { $match: { tags: name.toLowerCase() } },
      {
        $lookup: {
          from: 'users',
          localField: 'author',
          foreignField: '_id',
          as: 'author',
        },
      },
      { $unwind: '$author' },
      {
        $project: {
          _id: 1,
          title: 1,
          description: 1,
          tags: 1,
          answers: 1,
          acceptedAnswer: 1,
          upvotes: 1,
          downvotes: 1,
          createdAt: 1,
          updatedAt: 1,
          author: {
            _id: '$author._id',
            first_name: '$author.first_name',
            last_name: '$author.last_name',
            username: '$author.username',
            avatar: '$author.avatar',
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: limitNum },
    ]);

    // Get total count for pagination
    const totalQuestions = await getAggregate('question', [
      { $match: { tags: name.toLowerCase() } },
      { $count: 'total' },
    ]);

    const totalCount = totalQuestions.length > 0 ? totalQuestions[0].total : 0;
    const totalPages = Math.ceil(totalCount / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Create tag response with question count
    const tagResponse = {
      _id: tag._id,
      name: tag.name,
      description: tag.description,
      questionCount: totalCount,
      createdAt: tag.createdAt,
      updatedAt: tag.updatedAt,
    };

    return res.status(200).json({
      status: 200,
      message: 'Tag information retrieved successfully',
      tag: tagResponse,
      questions: questionsWithTag,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions: totalCount,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    console.error('Get tag by name error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetTagByName;
