const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createRoomType,
  getRoomTypes,
  getRoomTypeById,
  updateRoomType,
  deleteRoomType,
} = require('../controllers/roomTypeController');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('hotelId').isMongoId().withMessage('valid hotelId is required'),
    body('name').trim().notEmpty().withMessage('name is required'),
    body('basePrice').isFloat({ min: 0 }).withMessage('basePrice must be a non-negative number'),
    body('totalRooms').isInt({ min: 0 }).withMessage('totalRooms must be a non-negative integer'),
    body('capacity').isInt({ min: 1 }).withMessage('capacity must be at least 1'),
  ],
  validate,
  createRoomType
);

router.get('/', getRoomTypes);

router.get('/:id', [param('id').isMongoId().withMessage('invalid room type id')], validate, getRoomTypeById);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('invalid room type id')],
  validate,
  updateRoomType
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('invalid room type id')],
  validate,
  deleteRoomType
);

module.exports = router;
