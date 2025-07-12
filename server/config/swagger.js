const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Fire-Shark Q&A Platform API',
      version: '1.0.0',
      description:
        'API documentation for Fire-Shark collaborative learning and knowledge sharing platform',
      contact: {
        name: 'Fire-Shark Support',
        email: 'support@fire-shark.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.fire-shark.com',
        description: 'Production server',
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
