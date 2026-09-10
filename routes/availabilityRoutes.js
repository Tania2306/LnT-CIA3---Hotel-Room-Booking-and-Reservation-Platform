const express = require('express');
const { searchAvailability } = require('../controllers/availabilityController');

const router = express.Router();

// Same handler as GET /api/hotels/search - the spec's sample API list uses
// /api/hotels/search, this route is provided as a convenience alias.
router.get('/search', searchAvailability);

module.exports = router;
