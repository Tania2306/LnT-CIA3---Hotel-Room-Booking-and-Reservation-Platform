const PricingRule = require('../models/PricingRule');
const RoomType = require('../models/RoomType');
const { AppError } = require('../middleware/errorHandler');

// POST /api/pricing-rules (admin)
const createPricingRule = async (req, res, next) => {
  try {
    const { roomTypeId, season, multiplier } = req.body;

    const roomType = await RoomType.findById(roomTypeId);
    if (!roomType) {
      return next(new AppError('Referenced room type does not exist', 404, 'ROOM_TYPE_NOT_FOUND'));
    }

    const rule = await PricingRule.create({ roomTypeId, season, multiplier });
    res.status(201).json({ success: true, message: 'Pricing rule created successfully', data: rule });
  } catch (err) {
    next(err);
  }
};

// GET /api/pricing-rules?roomTypeId=
const getPricingRules = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.roomTypeId) filter.roomTypeId = req.query.roomTypeId;
    const rules = await PricingRule.find(filter).populate('roomTypeId', 'name basePrice');
    res.status(200).json({ success: true, message: 'Pricing rules fetched successfully', data: rules });
  } catch (err) {
    next(err);
  }
};

// PUT /api/pricing-rules/:id (admin)
const updatePricingRule = async (req, res, next) => {
  try {
    const { roomTypeId, ...updateFields } = req.body;
    const rule = await PricingRule.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true,
    });
    if (!rule) {
      return next(new AppError('Pricing rule not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Pricing rule updated successfully', data: rule });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/pricing-rules/:id (admin)
const deletePricingRule = async (req, res, next) => {
  try {
    const rule = await PricingRule.findByIdAndDelete(req.params.id);
    if (!rule) {
      return next(new AppError('Pricing rule not found', 404, 'NOT_FOUND'));
    }
    res.status(200).json({ success: true, message: 'Pricing rule deleted successfully', data: { id: req.params.id } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPricingRule, getPricingRules, updatePricingRule, deletePricingRule };
