const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');
const { assertTransitionAllowed } = require('./bookingController');
const { calculateRefund } = require('../utils/refund');

// PUT /api/bookings/:id/cancel (guest who owns the booking, or staff/admin)
const cancelBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'NOT_FOUND'));
    }

    const isOwner = booking.guestId.toString() === req.user.id;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaffOrAdmin) {
      return next(new AppError('You are not allowed to cancel this booking', 403, 'FORBIDDEN'));
    }

    // Only 'reserved' or 'confirmed' bookings can be cancelled (see ALLOWED_TRANSITIONS).
    assertTransitionAllowed(booking.status, 'cancelled');

    const cancelledAt = new Date();
    const { policy, refundAmount } = calculateRefund(booking.totalAmount, booking.checkIn, cancelledAt);

    booking.status = 'cancelled';
    booking.cancellation = {
      cancelledAt,
      refundAmount,
      refundPolicyApplied: policy,
    };
    await booking.save();

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
      data: { booking, refund: { policy, refundAmount } },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { cancelBooking };
