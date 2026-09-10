const jwt = require('jsonwebtoken');

// Signs a JWT carrying the user's id and role so authorization middleware
// can check permissions without hitting the database on every request.
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

module.exports = generateToken;
