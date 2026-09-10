const mongoose = require('mongoose');

// Referenced to RoomType because pricing rules are managed independently by
// admins and a room type can have several rules (one per season/day-type).
const pricingRuleSchema = new mongoose.Schema(
  {
    roomTypeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RoomType',
      required: true,
    },
    season: {
      type: String,
      enum: ['standard', 'weekend', 'peak', 'off-peak'],
      required: true,
    },
    multiplier: {
      type: Number,
      required: true,
      min: 0.1,
    },
  },
  { timestamps: true }
);

roomTypeAndSeasonIndex(pricingRuleSchema);

function roomTypeAndSeasonIndex(schema) {
  // A room type should have at most one rule per season, and this speeds up
  // the pricing lookup that runs on every booking.
  schema.index({ roomTypeId: 1, season: 1 }, { unique: true });
}

module.exports = mongoose.model('PricingRule', pricingRuleSchema);
