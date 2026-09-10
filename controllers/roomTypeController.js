const RoomType = require('../models/RoomType');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const { AppError } = require('../middleware/errorHandler');

// POST /api/room-types (admin)
const createRoomType = async (req, res, next) => {
  try {
    const { hotelId, name, basePrice, totalRooms, capacity } = req.body;

    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return next(new AppError('Referenced hotel does not exist', 404, 'HOTEL_NOT_FOUND'));
    }

    const roomType = await RoomType.create({ hotelId, name, basePrice, totalRooms, capacity });
    res.status(201).json({ success: true, message: 'Room type created successfully', data: roomType });
  } catch (err) {
    next(err);
  }
};

// GET /api/room-types?hotelId=
const getRoomTypes = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.hotelId) filter.hotelId = req.query.hotelId;
    const roomTypes = await RoomType.find(filter).populate('hotelId', 'name city');
    res.status(200).json({ success: true, message: 'Room types fetched successfully', data: roomTypes });
  } catch (err) {
    next(err);
  }
};

// GET /api/room-types/:id
const getRoomTypeById = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id).populate('hotelId', 'name city');
    if (!roomType) {
      return next(new AppError('Room type not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Room type fetched successfully', data: roomType });
  } catch (err) {
    next(err);
  }
};

// PUT /api/room-types/:id (admin)
const updateRoomType = async (req, res, next) => {
  try {
    // hotelId should not be silently reassigned via this route.
    const { hotelId, ...updateFields } = req.body;
    const roomType = await RoomType.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!roomType) {
      return next(new AppError('Room type not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Room type updated successfully', data: roomType });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/room-types/:id (admin)
const deleteRoomType = async (req, res, next) => {
  try {
    const roomType = await RoomType.findById(req.params.id);
    if (!roomType) {
      return next(new AppError('Room type not found', 404, 'NOT_FOUND'));
    }
    const roomCount = await Room.countDocuments({ roomTypeId: roomType._id });
    if (roomCount > 0) {
      return next(
        new AppError('Cannot delete a room type that still has rooms. Delete its rooms first', 409, 'ROOM_TYPE_HAS_ROOMS')
      );
    }
    await roomType.deleteOne();
    res.status(200).json({ success: true, message: 'Room type deleted successfully', data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRoomType, getRoomTypes, getRoomTypeById, updateRoomType, deleteRoomType };
