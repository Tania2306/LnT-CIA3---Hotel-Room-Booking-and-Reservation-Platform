const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');
const { assertTransitionAllowed } = require('./bookingController');

// PUT /api/bookings/:id/checkin (staff/admin)
const checkIn = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'NOT_FOUND'));
    }

    assertTransitionAllowed(booking.status, 'checked-in');

    booking.status = 'checked-in';
    booking.actualCheckInTime = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Guest checked in successfully', data: booking });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id/checkout (staff/admin)
const checkOut = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'NOT_FOUND'));
    }

    assertTransitionAllowed(booking.status, 'checked-out');

    booking.status = 'checked-out';
    booking.actualCheckOutTime = new Date();
    await booking.save();

    res.status(200).json({ success: true, message: 'Guest checked out successfully', data: booking });
  } catch (err) {
    next(err);
  }
};

module.exports = { checkIn, checkOut };
