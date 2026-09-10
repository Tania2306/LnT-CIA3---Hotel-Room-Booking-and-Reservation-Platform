const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createRoom, getRooms, getRoomById, updateRoom } = require('../controllers/roomController');
const { updateHousekeepingStatus } = require('../controllers/housekeepingController');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('admin', 'staff'),
  [
    body('roomTypeId').isMongoId().withMessage('valid roomTypeId is required'),
    body('roomNumber').trim().notEmpty().withMessage('roomNumber is required'),
    body('housekeepingStatus').optional().isIn(['clean', 'dirty', 'maintenance']),
  ],
  validate,
  createRoom
);

router.get('/', getRooms);

router.get('/:id', [param('id').isMongoId().withMessage('invalid room id')], validate, getRoomById);

router.put(
  '/:id',
  authenticate,
  authorize('admin', 'staff'),
  [param('id').isMongoId().withMessage('invalid room id')],
  validate,
  updateRoom
);

// Module 9: Housekeeping Status Tracking
router.put(
  '/:id/housekeeping',
  authenticate,
  authorize('admin', 'staff'),
  [
    param('id').isMongoId().withMessage('invalid room id'),
    body('housekeepingStatus').isIn(['clean', 'dirty', 'maintenance']).withMessage('invalid housekeeping status'),
  ],
  validate,
  updateHousekeepingStatus
);

module.exports = router;
