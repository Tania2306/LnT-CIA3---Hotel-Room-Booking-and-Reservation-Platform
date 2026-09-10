const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['guest', 'staff', 'admin'],
      default: 'guest',
    },
  },
  { timestamps: true }
);

// Note: `unique: true` on the email field above already creates the unique
// index that enforces uniqueness and speeds up login lookups.

module.exports = mongoose.model('User', userSchema);
