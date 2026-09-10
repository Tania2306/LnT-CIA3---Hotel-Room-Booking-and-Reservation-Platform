const Hotel = require('../models/Hotel');
const RoomType = require('../models/RoomType');
const Booking = require('../models/Booking');

// Statuses that count as "currently occupying/holding" a room for reporting.
const OCCUPYING_STATUSES = ['reserved', 'confirmed', 'checked-in'];

// GET /api/admin/reports/occupancy (admin)
// Every number here is computed live from the database - nothing hardcoded.
const getOccupancyReport = async (req, res, next) => {
  try {
    const hotels = await Hotel.find();

    const hotelReports = [];
    let grandTotalRooms = 0;
    let grandBookedRooms = 0;
    let grandRevenue = 0;

    for (const hotel of hotels) {
      const roomTypes = await RoomType.find({ hotelId: hotel._id });
      const totalRooms = roomTypes.reduce((sum, rt) => sum + rt.totalRooms, 0);

      // "Booked rooms" = count of active bookings currently overlapping today for this hotel.
      const now = new Date();
      const bookedRooms = await Booking.countDocuments({
        hotelId: hotel._id,
        status: { $in: OCCUPYING_STATUSES },
        checkIn: { $lte: now },
        checkOut: { $gt: now },
      });

      const revenueAgg = await Booking.aggregate([
        { $match: { hotelId: hotel._id, status: { $in: ['checked-out', 'checked-in', 'confirmed'] } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);
      const revenue = revenueAgg.length > 0 ? revenueAgg[0].total : 0;

      const availableRooms = totalRooms - bookedRooms;
      const occupancyPercentage = totalRooms > 0 ? Math.round((bookedRooms / totalRooms) * 10000) / 100 : 0;

      grandTotalRooms += totalRooms;
      grandBookedRooms += bookedRooms;
      grandRevenue += revenue;

      hotelReports.push({
        hotelId: hotel._id,
        hotelName: hotel.name,
        city: hotel.city,
        totalRooms,
        bookedRooms,
        availableRooms,
        occupancyPercentage,
        revenue: Math.round(revenue * 100) / 100,
      });
    }

    const overallOccupancyPercentage =
      grandTotalRooms > 0 ? Math.round((grandBookedRooms / grandTotalRooms) * 10000) / 100 : 0;

    res.status(200).json({
      success: true,
      message: 'Occupancy report generated successfully',
      data: {
        generatedAt: new Date(),
        overall: {
          totalRooms: grandTotalRooms,
          bookedRooms: grandBookedRooms,
          availableRooms: grandTotalRooms - grandBookedRooms,
          occupancyPercentage: overallOccupancyPercentage,
          totalRevenue: Math.round(grandRevenue * 100) / 100,
        },
        hotelWise: hotelReports,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getOccupancyReport };
