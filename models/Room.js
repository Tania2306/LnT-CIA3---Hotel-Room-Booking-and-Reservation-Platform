const mongoose = require('mongoose');

// Individual physical rooms are referenced to their RoomType rather than
// embedded, because housekeeping status changes independently and frequently
// per room, and rooms are queried on their own by staff.
const roomSchema = new mongoose.Schema(
  {
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true,
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true,
    },
    housekeepingStatus: {
      type: String,
      enum: ['clean', 'dirty', 'maintenance'],
      default: 'clean',
    },
  },
  { timestamps: true }
);

// Speeds up the very common 'fetch rooms by room type' query.
roomSchema.index({ roomTypeId: 1 });
// A room number should be unique within its room type.
roomSchema.index({ roomTypeId: 1, roomNumber: 1 }, { unique: true });

module.exports = mongoose.model('Room', roomSchema);
