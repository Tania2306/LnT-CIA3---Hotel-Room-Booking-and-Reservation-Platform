const Room = require('../models/Room');
const RoomType = require('../models/RoomType');
const { AppError } = require('../middleware/errorHandler');

// POST /api/rooms (admin/staff)
const createRoom = async (req, res, next) => {
  try {
    const { roomTypeId, roomNumber, housekeepingStatus } = req.body;

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return next(new AppError('Referenced room type does not exist', 404, 'ROOM_TYPE_NOT_FOUND'));
    }

    // Do not allow creating more physical rooms than the room type's totalRooms count.
    const existingCount = await Room.countDocuments({ roomTypeId });
    if (existingCount >= roomType.totalRooms) {
      return next(
        new AppError(
          `Room type already has ${existingCount} rooms which matches its totalRooms (${roomType.totalRooms})`,
          409,
          'ROOM_LIMIT_REACHED'
        )
      );
    }

    const room = await Room.create({ roomTypeId, roomNumber, housekeepingStatus });
    res.status(201).json({ success: true, message: 'Room created successfully', data: room });
  } catch (err) {
    next(err);
  }
};

// GET /api/rooms?roomTypeId=
const getRooms = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.roomTypeId) filter.roomTypeId = req.query.roomTypeId;
    if (req.query.housekeepingStatus) filter.housekeepingStatus = req.query.housekeepingStatus;
    const rooms = await Room.find(filter).populate('roomTypeId', 'name hotelId');
    res.status(200).json({ success: true, message: 'Rooms fetched successfully', data: rooms });
  } catch (err) {
    next(err);
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res, next) => {
  try {
    const room = await Room.findById(req.params.id).populate('roomTypeId', 'name hotelId');
    if (!room) {
      return next(new AppError('Room not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Room fetched successfully', data: room });
  } catch (err) {
    next(err);
  }
};

// PUT /api/rooms/:id (admin/staff)
const updateRoom = async (req, res, next) => {
  try {
    const { roomTypeId, ...updateFields } = req.body;
    const room = await Room.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!room) {
      return next(new AppError('Room not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Room updated successfully', data: room });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRoom, getRooms, getRoomById, updateRoom };
