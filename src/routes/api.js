const express = require('express');
const { calculateChart } = require('../controllers/astrologyController');
const router = express.Router();


router.post('/chart', calculateChart);

module.exports = router;
