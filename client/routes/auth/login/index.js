const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { SECRET } = require('../../../config');
const { getPopulatedData, findOne } = require('../../../helpers');
const Joi = require('joi');

const loginSchema = Joi.object({
  identifier: Joi.string().required(),
  password: Joi.string().min(6).max(30).required(),
});

async function handleLogin(req, res) {
  const { identifier, password } = req.body;
  try {
    await loginSchema.validateAsync(req.body);

    let user = await findOne('user', {
      $or: [{ email: identifier }, { username: identifier }],
    });

    if (!user) {
      return res.status(404).json({ status: 404, message: 'User not found.' });
    }

    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: 401, message: 'Invalid credentials.' });
    }

    user.password = undefined;
    const token = jwt.sign({ id: user._id }, SECRET);
    return res.status(200).json({ status: 200, user, token });
  } catch (err) {
    return res.status(400).json({ status: 400, message: err.message });
  }
}

module.exports = handleLogin;
