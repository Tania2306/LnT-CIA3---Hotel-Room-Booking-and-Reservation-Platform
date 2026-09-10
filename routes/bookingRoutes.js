const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createBooking, getBookingById, confirmBooking, getAllBookings } = require('../controllers/bookingController');
const { checkIn, checkOut } = require('../controllers/checkInOutController');
const { cancelBooking } = require('../controllers/cancellationController');
const { getInvoice } = require('../controllers/invoiceController');

const router = express.Router();

// Module 5: Reservation Booking Workflow
router.post(
  '/',
  authenticate,
  authorize('guest'),
  [
    body('hotelId').isMongoId().withMessage('valid hotelId is required'),
    body('roomTypeId').isMongoId().withMessage('valid roomTypeId is required'),
    body('checkIn').isISO8601().withMessage('checkIn must be a valid date'),
    body('checkOut').isISO8601().withMessage('checkOut must be a valid date'),
    body('guests').optional().isInt({ min: 1 }).withMessage('guests must be a positive integer'),
    body('season').optional().isIn(['standard', 'weekend', 'peak', 'off-peak']),
  ],
  validate,
  createBooking
);

// Staff/admin: list all bookings
router.get('/', authenticate, authorize('staff', 'admin'), getAllBookings);

router.get('/:id', authenticate, [param('id').isMongoId().withMessage('invalid booking id')], validate, getBookingById);

// Module 7: Booking Status Management
router.put(
  '/:id/confirm',
  authenticate,
  authorize('staff', 'admin'),
  [param('id').isMongoId().withMessage('invalid booking id')],
  validate,
  confirmBooking
);

// Module 8: Check-in / Check-out
router.put(
  '/:id/checkin',
  authenticate,
  authorize('staff', 'admin'),
  [param('id').isMongoId().withMessage('invalid booking id')],
  validate,
  checkIn
);

router.put(
  '/:id/checkout',
  authenticate,
  authorize('staff', 'admin'),
  [param('id').isMongoId().withMessage('invalid booking id')],
  validate,
  checkOut
);

// Module 10: Cancellation & Refund Policy Engine
router.put(
  '/:id/cancel',
  authenticate,
  [param('id').isMongoId().withMessage('invalid booking id')],
  validate,
  cancelBooking
);

// Module 12: Invoice Generation Summary
router.get(
  '/:id/invoice',
  authenticate,
  [param('id').isMongoId().withMessage('invalid booking id')],
  validate,
  getInvoice
);

module.exports = router;
