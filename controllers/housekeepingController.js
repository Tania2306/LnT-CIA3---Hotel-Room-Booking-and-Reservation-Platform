const Room = require('../models/Room');
const { AppError } = require('../middleware/errorHandler');

const VALID_STATUSES = ['clean', 'dirty', 'maintenance'];

// PUT /api/rooms/:id/housekeeping (staff/admin)
const updateHousekeepingStatus = async (req, res, next) => {
  try {
    const { housekeepingStatus } = req.body;

    if (!VALID_STATUSES.includes(housekeepingStatus)) {
      return next(
        new AppError(`housekeepingStatus must be one of: ${VALID_STATUSES.join(', ')}`, 400, 'INVALID_STATUS')
      );
    }

    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { housekeepingStatus },
      { new: true, runValidators: true }
    );

    if (!room) {
      return next(new AppError('Room not found', 404, 'NOT_FOUND'));
    }

    res.status(200).json({ success: true, message: 'Housekeeping status updated successfully', data: room });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateHousekeepingStatus };
