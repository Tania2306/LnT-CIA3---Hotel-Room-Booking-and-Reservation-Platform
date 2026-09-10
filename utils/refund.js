/**
 * Cancellation & Refund Policy (documented in README section
 * "Cancellation / Refund Policy"):
 *
 *   - Cancelled 48+ hours before check-in   -> 100% refund ("full")
 *   - Cancelled 24-48 hours before check-in -> 50% refund  ("partial")
 *   - Cancelled less than 24 hours before   -> 0% refund   ("none")
 *   - Only bookings in 'reserved' or 'confirmed' status may be cancelled.
 *     A 'checked-in' or 'checked-out' booking cannot be cancelled through
 *     this endpoint (see bookingController for the allowed transitions).
 */

const HOURS_48 = 48 * 60 * 60 * 1000;
const HOURS_24 = 24 * 60 * 60 * 1000;

const calculateRefund = (totalAmount, checkInDate, cancelledAt = new Date()) => {
  const msUntilCheckIn = new Date(checkInDate).getTime() - cancelledAt.getTime();

  let policy;
  let refundAmount;

  if (msUntilCheckIn >= HOURS_48) {
    policy = 'full';
    refundAmount = totalAmount;
  } else if (msUntilCheckIn >= HOURS_24) {
    policy = 'partial';
    refundAmount = Math.round(totalAmount * 0.5 * 100) / 100;
  } else {
    policy = 'none';
    refundAmount = 0;
  }

  return { policy, refundAmount };
};

module.exports = { calculateRefund };
