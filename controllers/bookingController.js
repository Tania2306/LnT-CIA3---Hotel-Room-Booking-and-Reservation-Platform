const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const { AppError } = require('../middleware/errorHandler');
const { countOverlappingBookings } = require('./availabilityController');
const { calculatePrice } = require('../utils/pricing');

// Booking Status Management (Module 7): the only allowed transitions.
// Any transition not listed here is rejected with a business-rule error.
const ALLOWED_TRANSITIONS = {
  reserved: ['confirmed', 'cancelled'],
  confirmed: ['checked-in', 'cancelled'],
  'checked-in': ['checked-out'],
  'checked-out': [],
  cancelled: [],
};

const assertTransitionAllowed = (currentStatus, nextStatus) => {
  const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(nextStatus)) {
    throw new AppError(
      `Invalid booking status transition: '${currentStatus}' -> '${nextStatus}'`,
      409,
      'INVALID_STATUS_TRANSITION'
    );
  }
};

// POST /api/bookings (guest)
// This is the core business-logic module: verifies hotel/room type
// relationship, validates dates, checks availability, prevents overbooking,
// and calculates the price using the dynamic pricing engine.
const createBooking = async (req, res, next) => {
  try {
    const { hotelId, roomTypeId, checkIn, checkOut, guests, season } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404, 'HOTEL_NOT_FOUND'));
    }

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return next(new AppError('Room type not found', 404, 'ROOM_TYPE_NOT_FOUND'));
    }

    if (roomType.hotelId.toString() !== hotelId) {
      return next(new AppError('Room type does not belong to the specified hotel', 400, 'ROOM_TYPE_HOTEL_MISMATCH'));
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return next(new AppError('checkIn and checkOut must be valid dates', 400, 'INVALID_DATE'));
    }
    if (checkOutDate <= checkInDate) {
      return next(new AppError('checkOut must be after checkIn', 400, 'INVALID_DATE_RANGE'));
    }
    if (checkInDate < new Date(new Date().toDateString())) {
      return next(new AppError('checkIn cannot be in the past', 400, 'INVALID_DATE_RANGE'));
    }

    const guestCount = guests || 1;
    if (guestCount > roomType.capacity) {
      return next(
        new AppError(`This room type supports a maximum of ${roomType.capacity} guests`, 400, 'CAPACITY_EXCEEDED')
      );
    }

    // Overbooking prevention: count active bookings overlapping this date range.
    const bookedCount = await countOverlappingBookings(roomTypeId, checkInDate, checkOutDate);
    if (bookedCount >= roomType.totalRooms) {
      return next(
        new AppError('No rooms of this type are available for the selected dates', 409, 'NO_AVAILABILITY')
      );
    }

    const priceResult = await calculatePrice(roomType, checkInDate, checkOutDate, season);

    const booking = await Booking.create({
      guestId: req.user.id,
      hotelId,
      roomTypeId,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: guestCount,
      status: 'reserved',
      basePriceAtBooking: roomType.basePrice,
      multiplierApplied: priceResult.effectiveMultiplier,
      totalAmount: priceResult.totalAmount,
    });

    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking, priceBreakdown: priceResult.breakdown },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings/:id (guest who owns it, or staff/admin)
const getBookingById = async (req, res, next) => {
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
      return next(new AppError('You are not allowed to view this booking', 403, 'FORBIDDEN'));
    }

    res.status(200).json({ success: true, message: 'Booking fetched successfully', data: booking });
  } catch (err) {
    next(err);
  }
};

// PUT /api/bookings/:id/confirm (staff/admin) - reserved -> confirmed
const confirmBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return next(new AppError('Booking not found', 404, 'NOT_FOUND'));
    }
    assertTransitionAllowed(booking.status, 'confirmed');
    booking.status = 'confirmed';
    await booking.save();
    res.status(200).json({ success: true, message: 'Booking confirmed successfully', data: booking });
  } catch (err) {
    next(err);
  }
};

// GET /api/bookings (staff/admin) - list all bookings, optional ?status= filter
const getAllBookings = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.hotelId) filter.hotelId = req.query.hotelId;
    const bookings = await Booking.find(filter)
      .populate('hotelId', 'name city')
      .populate('roomTypeId', 'name')
      .populate('guestId', 'name email')
      .sort({ createdAt: -1 });
    res.status(200).json({ success: true, message: 'Bookings fetched successfully', data: bookings });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createBooking,
  getBookingById,
  confirmBooking,
  getAllBookings,
  ALLOWED_TRANSITIONS,
  assertTransitionAllowed,
};
