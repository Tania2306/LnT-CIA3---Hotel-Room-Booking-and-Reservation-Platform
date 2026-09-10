const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');

// Flat tax rate applied to the room total. Kept as a named constant (not
// scattered magic numbers) so it is easy to find and change.
const TAX_RATE = 0.12; // 12%

// GET /api/bookings/:id/invoice (owner guest, or staff/admin)
const getInvoice = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name basePrice')
      .populate('guestId', 'name email');

    if (!booking) {
      return next(new AppError('Booking not found', 404, 'NOT_FOUND'));
    }

    const isOwner = booking.guestId._id.toString() === req.user.id;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);
    if (!isOwner && !isStaffOrAdmin) {
      return next(new AppError('You are not allowed to view this invoice', 403, 'FORBIDDEN'));
    }

    const nights = Math.round(
      (new Date(booking.checkOut).getTime() - new Date(booking.checkIn).getTime()) / (24 * 60 * 60 * 1000)
    );

    const subtotal = booking.totalAmount;
    const tax = Math.round(subtotal * TAX_RATE * 100) / 100;
    const refund = booking.cancellation?.refundAmount || 0;
    const finalAmount = Math.round((subtotal + tax - refund) * 100) / 100;

    const invoice = {
      bookingId: booking._id,
      guest: { name: booking.guestId.name, email: booking.guestId.email },
      hotel: { name: booking.hotelId.name, city: booking.hotelId.city },
      roomType: { name: booking.roomTypeId.name, basePrice: booking.roomTypeId.basePrice },
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights,
      multiplierApplied: booking.multiplierApplied,
      subtotal,
      taxRate: TAX_RATE,
      tax,
      refund,
      finalAmount,
      status: booking.status,
    };

    res.status(200).json({ success: true, message: 'Invoice generated successfully', data: invoice });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInvoice };
