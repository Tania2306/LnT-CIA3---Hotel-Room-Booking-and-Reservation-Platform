const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const { AppError } = require('../middleware/errorHandler');

// POST /api/hotels (admin)
const createHotel = async (req, res, next) => {
  try {
    const { name, city, amenities, rating } = req.body;
    const hotel = await Hotel.create({ name, city, amenities, rating });
    res.status(201).json({ success: true, message: 'Hotel created successfully', data: hotel });
  } catch (err) {
    next(err);
  }
};

// GET /api/hotels (public - list, with optional ?city= filter)
const getHotels = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.city) {
      filter.city = new RegExp(`^${req.query.city}$`, 'i');
    }
    const hotels = await Hotel.find(filter).sort({ name: 1 });
    res.status(200).json({ success: true, message: 'Hotels fetched successfully', data: hotels });
  } catch (err) {
    next(err);
  }
};

// GET /api/hotels/:id
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Hotel fetched successfully', data: hotel });
  } catch (err) {
    next(err);
  }
};

// PUT /api/hotels/:id (admin)
const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!hotel) {
      return next(new AppError('Hotel not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Hotel updated successfully', data: hotel });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/hotels/:id (admin)
const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return next(new AppError('Hotel not found', 404, 'NOT_FOUND'));
    }
    // Prevent deleting a hotel that still has room types - avoids orphaned references.
    const roomTypeCount = await RoomType.countDocuments({ hotelId: hotel._id });
    if (roomTypeCount > 0) {
      return next(
        new AppError(
          'Cannot delete a hotel that still has room types. Delete its room types first',
          409,
          'HOTEL_HAS_ROOM_TYPES'
        )
      );
    }
    await hotel.deleteOne();
    res.status(200).json({ success: true, message: 'Hotel deleted successfully', data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createHotel, getHotels, getHotelById, updateHotel, deleteHotel };
