const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../../../config');
const { insertNewDocument, findOne } = require('../../../helpers');
const Joi = require('joi');
const { send_email } = require('../../../lib');

const signupSchema = Joi.object({
  first_name: Joi.string().required(),
  last_name: Joi.string().required(),
  username: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(30).required(),
});

async function handleSignup(req, res) {
  const { first_name, last_name, username, email, password } = req.body;
  try {
    await signupSchema.validateAsync(req.body);

    const existingUser = await findOne('user', { $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(409).json({ status: 409, message: 'User already exists.' });
    }

    const userToSave = {
      first_name,
      last_name,
      username,
      email,
      password: bcrypt.hashSync(password, 10),
      role: 'user',
    };

    const savedUser = await insertNewDocument('user', userToSave);
    savedUser.password = undefined;

    const token = jwt.sign({ id: savedUser._id }, SECRET);

    send_email(
      'registration-email',
      { username: savedUser.first_name },
      'StackIt',
      'Welcome to StackIt!',
      savedUser.email
    );

    return res.status(201).json({ status: 201, user: savedUser, token });
  } catch (err) {
    return res.status(400).json({ status: 400, message: err.message });
  }
}

module.exports = handleSignup;
