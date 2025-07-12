require('dotenv').config();

module.exports = {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV || 'development',
  DB_NAME: process.env.DB_NAME,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  SECRET: process.env.JWT_SECRET || 'HTP',
  MAIL_HOST: process.env.MAIL_HOST,
  MAIL_PORT: process.env.MAIL_PORT,
  MAIL_USER: process.env.MAIL_USER,
  MAIL_PASS: process.env.MAIL_PASS,
  // Frontend URLs
  FRONTEND_URL_DEV: process.env.FRONTEND_URL_DEV || 'http://localhost:3000',
  FRONTEND_URL_PROD: process.env.FRONTEND_URL_PROD || 'https://yourdomain.com',
  // Admin credentials
  ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
  ADMIN_EMAIL: process.env.ADMIN_EMAIL || 'admin@stackit.com',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin123',
  ADMIN_FIRST_NAME: process.env.ADMIN_FIRST_NAME || 'Admin',
  ADMIN_LAST_NAME: process.env.ADMIN_LAST_NAME || 'User',
};
