const RoomType = require('../models/RoomType');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const { AppError } = require('../middleware/errorHandler');

// Statuses that occupy inventory for the purpose of an overlap check.
// Cancelled bookings free up the room, so they are excluded.
const ACTIVE_STATUSES = ['reserved', 'confirmed', 'checked-in'];

/**
 * Counts how many rooms of a given room type are already booked for any
 * date range that overlaps [checkIn, checkOut).
 *
 * Overlap condition: existingCheckIn < requestedCheckOut AND existingCheckOut > requestedCheckIn
 */
const countOverlappingBookings = async (roomTypeId, checkIn, checkOut) => {
  return Booking.countDocuments({
    roomTypeId,
    status: { $in: ACTIVE_STATUSES },
    checkIn: { $lt: checkOut },
    checkOut: { $gt: checkIn },
  });
};

// GET /api/hotels/search?city=&hotelId=&checkIn=&checkOut=&guests=
const searchAvailability = async (req, res, next) => {
  try {
    const { city, hotelId, checkIn, checkOut, guests } = req.query;

    if (!checkIn || !checkOut) {
      return next(new AppError('checkIn and checkOut query parameters are required', 400, 'MISSING_DATES'));
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
      return next(new AppError('checkIn and checkOut must be valid dates', 400, 'INVALID_DATE'));
    }

    if (checkOutDate <= checkInDate) {
      return next(new AppError('checkOut must be after checkIn', 400, 'INVALID_DATE_RANGE'));
    }

    const guestCount = guests ? parseInt(guests, 10) : 1;
    if (isNaN(guestCount) || guestCount < 1) {
      return next(new AppError('guests must be a positive integer', 400, 'INVALID_GUEST_COUNT'));
    }

    // Resolve which hotels to search within.
    let hotelFilter = {};
    if (hotelId) hotelFilter._id = hotelId;
    if (city) hotelFilter.city = new RegExp(`^${city}$`, 'i');
    const hotels = await Hotel.find(hotelFilter);

    if (hotels.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No hotels matched the search criteria',
        data: [],
      });
    }

    const hotelIds = hotels.map((h) => h._id);
    const hotelMap = {};
    hotels.forEach((h) => (hotelMap[h._id.toString()] = h));

    // Only room types that can fit the requested guest count are relevant.
    const roomTypes = await RoomType.find({
      hotelId: { $in: hotelIds },
      capacity: { $gte: guestCount },
    });

    const results = [];

    for (const roomType of roomTypes) {
      const bookedCount = await countOverlappingBookings(roomType._id, checkInDate, checkOutDate);
      const remaining = roomType.totalRooms - bookedCount;

      if (remaining > 0) {
        const hotel = hotelMap[roomType.hotelId.toString()];
        results.push({
          hotel: { id: hotel._id, name: hotel.name, city: hotel.city, rating: hotel.rating },
          roomType: {
            id: roomType._id,
            name: roomType.name,
            basePrice: roomType.basePrice,
            capacity: roomType.capacity,
          },
          totalRooms: roomType.totalRooms,
          roomsBooked: bookedCount,
          roomsAvailable: remaining,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: 'Availability search completed',
      data: results,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { searchAvailability, countOverlappingBookings, ACTIVE_STATUSES };
