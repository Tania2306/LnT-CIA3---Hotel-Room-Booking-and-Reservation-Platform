const mongoose = require('mongoose');

// Establishes the MongoDB connection using the URI from environment variables.
// The app intentionally exits on failure - a booking backend must not run without a DB.
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    console.error(`MongoDB connection error: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
