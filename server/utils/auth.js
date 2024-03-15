const { AuthenticationError } = require('apollo-server-express');
const jwt = require('jsonwebtoken');

// set token secret and expiration date
const secret = 'mysecretsshhhhh';
const expiration = '2h';

const authMiddleware = (context) => {
  // allows token to be sent via context.headers.authorization
  const token = context.req.headers.authorization;

  if (!token) {
    throw new AuthenticationError('Authentication token is missing.');
  }

  // verify token and get user data out of it
  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration });
    context.user = data;
  } catch (error) {
    console.error('Invalid token:', error);
    throw new AuthenticationError('Invalid token.');
  }
};

const signToken = ({ username, email, _id }) => {
  const payload = { username, email, _id };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};

module.exports = { authMiddleware, signToken };
