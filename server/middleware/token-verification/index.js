const jwt = require('jsonwebtoken');
const Config = require('../../config');
const { getDbUserData } = require('../../helpers');

const tokenVerification = (req, res, next) => {
  let token = req.headers['authorization'];
  if (!token) {
    return res.status(401).send({ status: 401, message: 'No token provided!' });
  }
  
  // Remove 'Bearer ' prefix if present
  if (token.startsWith('Bearer ')) {
    token = token.slice(7);
  }
  jwt.verify(token, Config.SECRET, async (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .send({ status: 401, message: 'Token Unauthorized!' });
    }
    const isUserExist = await getDbUserData('user', '_id', decoded.id);
    if (!isUserExist) {
      return res
        .status(401)
        .send({ status: 401, message: 'User does not exist.' });
    }
    req.userId = decoded.id;
    next();
  });
};

module.exports = { tokenVerification: tokenVerification };
