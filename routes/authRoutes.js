const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { register, login, createStaffOrAdmin } = require('../controllers/authController');

const router = express.Router();

router.post(
  '/register',
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('a valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  ],
  validate,
  register
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('a valid email is required'),
    body('password').notEmpty().withMessage('password is required'),
  ],
  validate,
  login
);

// Admin-only utility to onboard staff/admin accounts (guests cannot self-assign these roles).
router.post(
  '/staff-register',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('email').isEmail().withMessage('a valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
    body('role').isIn(['staff', 'admin']).withMessage("role must be 'staff' or 'admin'"),
  ],
  validate,
  createStaffOrAdmin
);

module.exports = router;
