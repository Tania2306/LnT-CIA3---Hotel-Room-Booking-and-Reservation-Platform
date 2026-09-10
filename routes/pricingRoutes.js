const express = require('express');
const { body, param } = require('express-validator');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const {
  createPricingRule,
  getPricingRules,
  updatePricingRule,
  deletePricingRule,
} = require('../controllers/pricingController');

const router = express.Router();

router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('roomTypeId').isMongoId().withMessage('valid roomTypeId is required'),
    body('season').isIn(['standard', 'weekend', 'peak', 'off-peak']).withMessage('invalid season'),
    body('multiplier').isFloat({ min: 0.1 }).withMessage('multiplier must be at least 0.1'),
  ],
  validate,
  createPricingRule
);

router.get('/', authenticate, getPricingRules);

router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('invalid pricing rule id'),
    body('multiplier').optional().isFloat({ min: 0.1 }).withMessage('multiplier must be at least 0.1'),
  ],
  validate,
  updatePricingRule
);

router.delete(
  '/:id',
  authenticate,
  authorize('admin'),
  [param('id').isMongoId().withMessage('invalid pricing rule id')],
  validate,
  deletePricingRule
);

module.exports = router;
