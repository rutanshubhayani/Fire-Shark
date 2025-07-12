const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const routes = require('./routes');
const { createDefaultAdmin } = require('./helpers');
const Config = require('./config');
const app = express();

// * Database connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', async function () {
  console.log('✅ Database connected successfully!');

  // Create default admin user
  await createDefaultAdmin(Config);
});

// * Cors
app.use(cors());

// * Body Parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('short'));

// * Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// * Api routes
app.use('/api', routes);

app.get('/verify-email', (req, res) => {
  const { token, verified } = req.query;
  if (verified === 'success') {
    return res.send('<h2>Email verified! You can now log in.</h2>');
  }
  if (verified === 'fail') {
    return res.send('<h2>Verification failed or link expired.</h2>');
  }
  if (!token) {
    return res.status(400).send('Invalid verification link.');
  }
  res.redirect(`/api/auth/verify-email?token=${token}`);
});

app.get('/reset-password', (req, res) => {
  const { token, reset } = req.query;
  if (reset === 'success') {
    return res.send(
      '<h2>Password reset successfully! You can now log in with your new password.</h2>'
    );
  }
  if (reset === 'fail') {
    return res.send('<h2>Password reset failed or link expired.</h2>');
  }
  if (!token) {
    return res.status(400).send('Invalid reset link.');
  }
  res.redirect(`/api/auth/reset-password?token=${token}`);
});

app.get('/', (req, res) => {
  const baseUrl = req.protocol + '://' + req.get('host');
  res.json({
    message: 'Welcome to the StackIt Q&A Platform API!',
    apiBaseUrl: baseUrl + '/api',
    swaggerDocs: baseUrl + '/api-docs',
    status: 'OK',
  });
});

app.use('*', (req, res) => {
  res.send('Route not found');
});

const { PORT, NODE_ENV } = require('./config');

app.listen(PORT || 8080, () => {
  const isDevelopment = (NODE_ENV || 'development') === 'development';
  const baseUrl = isDevelopment
    ? `http://localhost:${PORT || 8080}`
    : `https://api.fire-shark.com`;

  console.log(
    `🚀 Server is running on PORT ${PORT || 8080} in ${
      NODE_ENV || 'development'
    } mode`
  );
  console.log(`Swagger Documentation: ${baseUrl}/api-docs`);
});
