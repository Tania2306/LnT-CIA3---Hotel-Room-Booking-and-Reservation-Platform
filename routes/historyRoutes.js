const express = require('express');
const { param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const { getGuestBookingHistory } = require('../controllers/historyController');

const router = express.Router();

// GET /api/guests/:id/bookings
router.get(
  '/:id/bookings',
  authenticate,
  [param('id').isMongoId().withMessage('invalid guest id')],
  validate,
  getGuestBookingHistory
);

module.exports = router;
