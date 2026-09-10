const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');

// GET /api/guests/:id/bookings
// A guest may only view their own history. Staff/admin may view any guest's
// history (needed for front-desk support), but a guest cannot access another
// guest's history simply by changing the :id in the URL.
const getGuestBookingHistory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const isOwner = req.user.id === id;
    const isStaffOrAdmin = ['staff', 'admin'].includes(req.user.role);

    if (!isOwner && !isStaffOrAdmin) {
      return next(new AppError('You are not allowed to view this booking history', 403, 'FORBIDDEN'));
    }

    const bookings = await Booking.find({ guestId: id })
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name basePrice')
      .sort({ checkIn: -1 });

    res.status(200).json({ success: true, message: 'Booking history fetched successfully', data: bookings });
  } catch (err) {
    next(err);
  }
};

module.exports = { getGuestBookingHistory };
