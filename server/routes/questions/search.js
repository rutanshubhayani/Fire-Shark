const { findPopulateSortAndLimit, find } = require('../../helpers');

/**
 * @swagger
 * /api/questions/search:
 *   get:
 *     summary: Search questions
 *     description: Search questions by title, content, and tags
 *     tags: [Questions]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query
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
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [newest, oldest, most_voted, most_answered, relevance]
 *           default: relevance
 *         description: Sort order for search results
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
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
 *                   example: "Search results retrieved successfully"
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
 *                     hasNextPage:
 *                       type: boolean
 *                       example: true
 *                     hasPrevPage:
 *                       type: boolean
 *                       example: false
 *       400:
 *         description: Search query is required
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
async function handleSearchQuestions(req, res) {
  try {
    const { q, page = 1, limit = 10, sort = 'relevance' } = req.query;

    if (!q || q.trim() === '') {
      return res.status(400).json({
        status: 400,
        message: 'Search query is required',
      });
    }

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50);
    const skip = (pageNum - 1) * limitNum;

    // Build search query
    const searchQuery = {
      $or: [
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } },
        { tags: { $in: [new RegExp(q, 'i')] } },
      ],
    };

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'most_voted':
        sortObj = {
          $expr: {
            $subtract: [{ $size: '$upvotes' }, { $size: '$downvotes' }],
          },
        };
        break;
      case 'most_answered':
        sortObj = { $expr: { $size: '$answers' } };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      default: // relevance - sort by title match first, then content
        sortObj = {
          title: { $regex: q, $options: 'i' } ? 1 : 0,
          createdAt: -1,
        };
    }

    // Get questions with pagination
    const questions = await findPopulateSortAndLimit(
      'question',
      searchQuery,
      'author',
      'first_name last_name username avatar',
      sortObj,
      skip,
      limitNum
    );

    // Get total count for pagination
    const totalQuestions = await find('question', searchQuery).countDocuments();

    // Calculate pagination info
    const totalPages = Math.ceil(totalQuestions / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Format questions for response
    const formattedQuestions = questions.map(question => ({
      _id: question._id,
      title: question.title,
      description: question.description,
      tags: question.tags,
      author: {
        _id: question.author._id,
        first_name: question.author.first_name,
        last_name: question.author.last_name,
        username: question.author.username,
        avatar: question.author.avatar,
      },
      answers: question.answers,
      acceptedAnswer: question.acceptedAnswer,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
    }));

    return res.status(200).json({
      status: 200,
      message: 'Search results retrieved successfully',
      questions: formattedQuestions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalQuestions,
        hasNextPage,
        hasPrevPage,
      },
    });
  } catch (err) {
    console.error('Search questions error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleSearchQuestions;
