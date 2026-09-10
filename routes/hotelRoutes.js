const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { createHotel, getHotels, getHotelById, updateHotel, deleteHotel } = require('../controllers/hotelController');
const { searchAvailability } = require('../controllers/availabilityController');

const router = express.Router();

// IMPORTANT: /search must be declared before /:id so Express doesn't treat
// "search" as an :id value.
router.get('/search', searchAvailability);

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').trim().notEmpty().withMessage('name is required'),
    body('city').trim().notEmpty().withMessage('city is required'),
    body('amenities').optional().isArray().withMessage('amenities must be an array'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  ],
  validate,
  createHotel
);

router.get('/', getHotels);

router.get('/:id', [param('id').isMongoId().withMessage('invalid hotel id')], validate, getHotelById);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('invalid hotel id'),
    body('rating').optional().isFloat({ min: 0, max: 5 }).withMessage('rating must be between 0 and 5'),
  ],
  validate,
  updateHotel
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('invalid hotel id')],
  validate,
  deleteHotel
);

module.exports = router;
