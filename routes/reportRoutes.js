const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const { getOccupancyReport } = require('../controllers/reportController');

const router = express.Router();

// GET /api/admin/reports/occupancy
router.get('/occupancy', authenticate, authorize('admin'), getOccupancyReport);

module.exports = router;
