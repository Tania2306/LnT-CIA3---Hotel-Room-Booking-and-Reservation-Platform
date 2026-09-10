// Populates the database with a small demo dataset so the team can run the
// end-to-end demonstration flow immediately without manual setup.
// Usage: npm run seed
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');
const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const Room = require('../models/Room');
const PricingRule = require('../models/PricingRule');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  await Promise.all([
    User.deleteMany({}),
    Hotel.deleteMany({}),
    RoomType.deleteMany({}),
    Room.deleteMany({}),
    PricingRule.deleteMany({}),
  ]);

  const salt = await bcrypt.genSalt(10);

  const admin = await User.create({
    name: 'Admin User',
    email: 'admin@hotelchain.com',
    passwordHash: await bcrypt.hash('Admin@123', salt),
    role: 'admin',
  });

  const staff = await User.create({
    name: 'Staff User',
    email: 'staff@hotelchain.com',
    passwordHash: await bcrypt.hash('Staff@123', salt),
    role: 'staff',
  });

  const guest = await User.create({
    name: 'Guest User',
    email: 'guest@hotelchain.com',
    passwordHash: await bcrypt.hash('Guest@123', salt),
    role: 'guest',
  });

  const hotel = await Hotel.create({
    name: 'Grand Bengaluru Palace',
    city: 'Bengaluru',
    amenities: ['WiFi', 'Pool', 'Gym', 'Spa'],
    rating: 4.5,
  });

  const roomType = await RoomType.create({
    hotelId: hotel._id,
    name: 'Deluxe Room',
    basePrice: 4500,
    totalRooms: 5,
    capacity: 2,
  });

  await Room.insertMany([
    { roomTypeId: roomType._id, roomNumber: '101', housekeepingStatus: 'clean' },
    { roomTypeId: roomType._id, roomNumber: '102', housekeepingStatus: 'clean' },
    { roomTypeId: roomType._id, roomNumber: '103', housekeepingStatus: 'dirty' },
    { roomTypeId: roomType._id, roomNumber: '104', housekeepingStatus: 'clean' },
    { roomTypeId: roomType._id, roomNumber: '105', housekeepingStatus: 'maintenance' },
  ]);

  await PricingRule.create({ roomTypeId: roomType._id, season: 'standard', multiplier: 1.0 });
  await PricingRule.create({ roomTypeId: roomType._id, season: 'weekend', multiplier: 1.25 });
  await PricingRule.create({ roomTypeId: roomType._id, season: 'peak', multiplier: 1.5 });

  console.log('Seed complete.');
  console.log('Admin login -> admin@hotelchain.com / Admin@123');
  console.log('Staff login -> staff@hotelchain.com / Staff@123');
  console.log('Guest login -> guest@hotelchain.com / Guest@123');
  console.log('Hotel ID:', hotel._id.toString());
  console.log('Room Type ID:', roomType._id.toString());

  await mongoose.disconnect();
};

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
