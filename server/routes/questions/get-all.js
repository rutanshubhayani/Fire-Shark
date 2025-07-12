const { findPopulateSortAndLimit, find } = require('../../helpers');

/**
 * @swagger
 * /api/questions:
 *   get:
 *     summary: Get all questions
 *     description: Retrieve all questions with pagination, filtering, and sorting
 *     tags: [Questions]
 *     parameters:
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
 *           enum: [newest, oldest, most_voted, most_answered]
 *           default: newest
 *         description: Sort order for questions
 *       - in: query
 *         name: tag
 *         schema:
 *           type: string
 *         description: Filter questions by tag
 *       - in: query
 *         name: author
 *         schema:
 *           type: string
 *         description: Filter questions by author username
 *     responses:
 *       200:
 *         description: Questions retrieved successfully
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
 *                   example: "Questions retrieved successfully"
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handleGetQuestions(req, res) {
  try {
    const { page = 1, limit = 10, sort = 'newest', tag, author } = req.query;

    const pageNum = parseInt(page);
    const limitNum = Math.min(parseInt(limit), 50); // Max 50 per page
    const skip = (pageNum - 1) * limitNum;

    // Build query object
    const query = {};

    if (tag) {
      query.tags = { $in: [tag.toLowerCase()] };
    }

    if (author) {
      // First find user by username
      const user = await find('user', { username: author.toLowerCase() });
      if (user.length > 0) {
        query.author = user[0]._id;
      } else {
        // Return empty result if author not found
        return res.status(200).json({
          status: 200,
          message: 'Questions retrieved successfully',
          questions: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalQuestions: 0,
            hasNextPage: false,
            hasPrevPage: false,
          },
        });
      }
    }

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
      default: // newest
        sortObj = { createdAt: -1 };
    }

    // Get questions with pagination
    const questions = await findPopulateSortAndLimit(
      'question',
      query,
      'author',
      'first_name last_name username avatar',
      sortObj,
      skip,
      limitNum
    );

    // Get total count for pagination
    const totalQuestions = await find('question', query).countDocuments();

    // Calculate pagination info
    const totalPages = Math.ceil(totalQuestions / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    // Format questions for response
    const formattedQuestions = questions.map(question => ({
      _id: question._id,
      title: question.title,
      description: question.description,
      images: question.images || [],
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
      message: 'Questions retrieved successfully',
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
    console.error('Get questions error:', err);
    return res.status(500).json({
      status: 500,
      message: 'Internal server error. Please try again later.',
    });
  }
}

module.exports = handleGetQuestions;
