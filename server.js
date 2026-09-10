require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
const path = require('path');
const { notFound, errorHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const roomTypeRoutes = require('./routes/roomTypeRoutes');
const roomRoutes = require('./routes/roomRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const pricingRoutes = require('./routes/pricingRoutes');
const historyRoutes = require('./routes/historyRoutes');
const reportRoutes = require('./routes/reportRoutes');

const app = express();

connectDB();

app.use(cors());
app.use(express.json());

// Serve static frontend assets (index: false so content negotiation at '/' works cleanly)
app.use(express.static(path.join(__dirname, 'frontend'), { index: false }));

// Health check endpoint for frontend / monitoring
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Hotel Chain Reservation Backend API is running',
    timestamp: new Date().toISOString()
  });
});

// Root route: serve frontend UI for browser requests, JSON for API clients
app.get('/', (req, res) => {
  if (req.accepts(['html', 'json']) === 'html') {
    return res.sendFile(path.join(__dirname, 'frontend', 'hotel-booking-frontend.html'));
  }
  res.status(200).json({ success: true, message: 'Hotel Chain Reservation Backend API is running' });
});

// Explicit frontend route
app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'hotel-booking-frontend.html'));
});

app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/room-types', roomTypeRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/pricing-rules', pricingRoutes);
app.use('/api/guests', historyRoutes);
app.use('/api/admin/reports', reportRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`> Frontend: http://localhost:${PORT}`);
  console.log(`> Health:   http://localhost:${PORT}/api/health`);
});

module.exports = app;
