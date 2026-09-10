const mongoose = require('mongoose');

// Referenced to Hotel (not embedded) because room types are queried, updated,
// and priced independently of the parent hotel document, and a hotel can have
// many room types that change over time.
const roomTypeSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Room type name is required'],
      trim: true,
    },
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: 0,
    },
    totalRooms: {
      type: Number,
      required: [true, 'Total rooms is required'],
      min: 0,
    },
    capacity: {
      type: Number,
      required: [true, 'Capacity is required'],
      min: 1,
    },
  },
  { timestamps: true }
);

// Speeds up the very common 'fetch room types by hotel' query.
roomTypeSchema.index({ hotelId: 1 });

module.exports = mongoose.model('RoomType', roomTypeSchema);
