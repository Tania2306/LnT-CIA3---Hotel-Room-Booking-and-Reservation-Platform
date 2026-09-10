const mongoose = require('mongoose');

// Bookings reference guestId, hotelId and roomTypeId (all large, independently
// updated entities) rather than embedding them. Denormalized snapshot fields
// (basePriceAtBooking, multiplierApplied) are stored directly on the booking
// so historical invoices stay accurate even if pricing rules change later.
const bookingSchema = new mongoose.Schema(
  {
    guestId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      required: true,
    },
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true,
    },
    checkIn: {
      type: Date,
      required: true,
    },
    checkOut: {
      type: Date,
      required: true,
    },
    guests: {
      type: Number,
      required: true,
      min: 1,
    },
    status: {
      type: String,
      enum: ['reserved', 'confirmed', 'checked-in', 'checked-out', 'cancelled'],
      default: 'reserved',
    },
    basePriceAtBooking: {
      type: Number,
      required: true,
    },
    multiplierApplied: {
      type: Number,
      required: true,
      default: 1,
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    actualCheckInTime: {
      type: Date,
      default: null,
    },
    actualCheckOutTime: {
      type: Date,
      default: null,
    },
    cancellation: {
      cancelledAt: { type: Date, default: null },
      refundAmount: { type: Number, default: null },
      refundPolicyApplied: { type: String, default: null },
    },
  },
  { timestamps: true }
);

// Speeds up the very common 'fetch bookings by guest' query (booking history).
bookingSchema.index({ guestId: 1 });
// Speeds up availability/overlap checks scoped to a room type and date range.
bookingSchema.index({ roomTypeId: 1, checkIn: 1, checkOut: 1 });
// Speeds up hotel-wise occupancy reporting.
bookingSchema.index({ hotelId: 1, status: 1 });

module.exports = mongoose.model('Booking', bookingSchema);
