const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('./config/db');
const morgan = require('morgan');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const routes = require('./routes');
const app = express();

// * Database connection
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
  console.log('db connected!');
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

app.get('/', (req, res) => {
  console.log('hello');
  res.send('hello');
});

app.use('*', (req, res) => {
  res.send('Route not found');
});

const { PORT, NODE_ENV } = require('./config');

app.listen(PORT || 3000, () => {
  const isDevelopment = (NODE_ENV || 'development') === 'development';
  const baseUrl = isDevelopment
    ? `http://localhost:${PORT || 3000}`
    : `https://api.fire-shark.com`;

  console.log(
    `🚀 Server is running on PORT ${PORT || 3000} in ${
      NODE_ENV || 'development'
    } mode`
  );
  console.log(`Swagger Documentation: ${baseUrl}/api-docs`);
  console.log(`API Base URL: ${baseUrl}/api/`);
});
