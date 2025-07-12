const swaggerJsdoc = require('swagger-jsdoc');

const FRONTEND_URL_DEV = process.env.FRONTEND_URL_DEV;
const FRONTEND_URL_PROD = process.env.FRONTEND_URL_PROD;

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'StackIt Q&A Platform API',
      version: '1.0.0',
      description:
        'API documentation for StackIt collaborative learning and knowledge sharing platform. A minimal question-and-answer platform that supports collaborative learning and structured knowledge sharing.',
      contact: {
        name: 'StackIt Support',
        email: 'support@stackit.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local Development server',
      },
      {
        url: FRONTEND_URL_DEV,
        description: 'Development server',
      },
      {
        url: FRONTEND_URL_PROD,
        description: 'Production server',
      },
      {
        url: 'https://fireshark-server.vercel.app',
        description: 'Vercel Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            first_name: { type: 'string', example: 'John' },
            last_name: { type: 'string', example: 'Doe' },
            username: { type: 'string', example: 'johndoe' },
            email: { type: 'string', example: 'john@example.com' },
            role: {
              type: 'string',
              enum: ['admin', 'user', 'guest'],
              example: 'user',
            },
            isEmailVerified: { type: 'boolean', example: true },
            avatar: { type: 'string', example: '' },
            bio: { type: 'string', example: '' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 400 },
            message: { type: 'string', example: 'Validation error message' },
            field: { type: 'string', example: 'email' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            status: { type: 'number', example: 200 },
            message: { type: 'string', example: 'Operation successful' },
            user: { $ref: '#/components/schemas/User' },
            token: { type: 'string', example: 'jwt_token_here' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ['./routes/**/*.js', './index.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
