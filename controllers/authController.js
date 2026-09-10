const bcrypt = require('bcryptjs');
const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { AppError } = require('../middleware/errorHandler');

// POST /api/auth/register
// Guests self-register. Role is always forced to 'guest' here regardless of
// what the client sends, so a guest cannot elevate themselves to staff/admin.
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL'));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: 'guest', // ignore any role field the client tries to send
    });

    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return next(new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS'));
    }

    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: { id: user._id, name: user.name, email: user.email, role: user.role },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
};

// POST /api/auth/staff-register (admin-only utility to onboard staff/admin accounts)
const createStaffOrAdmin = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    if (!['staff', 'admin'].includes(role)) {
      return next(new AppError("role must be 'staff' or 'admin'", 400, 'INVALID_ROLE'));
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return next(new AppError('An account with this email already exists', 409, 'DUPLICATE_EMAIL'));
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({ name, email: email.toLowerCase(), passwordHash, role });

    res.status(201).json({
      success: true,
      message: `${role} account created successfully`,
      data: { user: { id: user._id, name: user.name, email: user.email, role: user.role } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, createStaffOrAdmin };
