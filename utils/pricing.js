const PricingRule = require('../models/PricingRule');

/**
 * Dynamic pricing logic (documented in README section "Dynamic Pricing Logic"):
 *
 * The stay is broken into individual nights. Each night is automatically
 * classified as:
 *   - 'weekend'  -> the night of Friday or Saturday
 *   - 'standard' -> every other night
 *
 * An admin may optionally force a specific season for the whole stay
 * (e.g. 'peak' or 'off-peak') by passing `season` in the booking request -
 * this is useful for holiday periods that don't align with the weekday
 * calendar. When no override is given, the automatic weekday/weekend
 * classification above is used per night.
 *
 * For every night, the applicable PricingRule for (roomTypeId, season) is
 * looked up. If no rule exists for that season, a neutral multiplier of 1.0
 * is used so the booking never fails purely because a pricing rule is
 * missing. basePrice * multiplier is summed across all nights to produce
 * the total amount. All multiplier values live in the pricingRules
 * collection - nothing is hardcoded in the application logic.
 */

const isWeekendNight = (date) => {
  const day = date.getUTCDay(); // 0 = Sunday ... 6 = Saturday
  return day === 5 || day === 6; // Friday or Saturday night
};

const getNights = (checkIn, checkOut) => {
  const nights = [];
  const cursor = new Date(checkIn);
  while (cursor < checkOut) {
    nights.push(new Date(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return nights;
};

/**
 * Calculates the total price for a stay.
 * @param {Object} roomType - the RoomType document (must have basePrice, _id)
 * @param {Date} checkIn
 * @param {Date} checkOut
 * @param {String} [forcedSeason] - optional admin override ('peak' | 'off-peak' | 'standard' | 'weekend')
 * @returns {Promise<{ totalAmount: number, breakdown: Array, effectiveMultiplier: number }>}
 */
const calculatePrice = async (roomType, checkIn, checkOut, forcedSeason = null) => {
  const nights = getNights(checkIn, checkOut);
  if (nights.length === 0) {
    throw new Error('Stay must be at least one night');
  }

  // Preload all pricing rules for this room type in one query.
  const rules = await PricingRule.find({ roomTypeId: roomType._id });
  const ruleMap = {};
  rules.forEach((r) => {
    ruleMap[r.season] = r.multiplier;
  });

  let totalAmount = 0;
  const breakdown = [];

  for (const night of nights) {
    const season = forcedSeason || (isWeekendNight(night) ? 'weekend' : 'standard');
    const multiplier = ruleMap[season] !== undefined ? ruleMap[season] : 1.0;
    const nightlyRate = roomType.basePrice * multiplier;
    totalAmount += nightlyRate;
    breakdown.push({
      date: night.toISOString().slice(0, 10),
      season,
      multiplier,
      rate: nightlyRate,
    });
  }

  const effectiveMultiplier = totalAmount / (roomType.basePrice * nights.length);

  return {
    totalAmount: Math.round(totalAmount * 100) / 100,
    breakdown,
    nights: nights.length,
    effectiveMultiplier: Math.round(effectiveMultiplier * 100) / 100,
  };
};

module.exports = { calculatePrice, isWeekendNight, getNights };
