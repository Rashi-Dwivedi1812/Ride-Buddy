const express = require('express');
const router = express.Router();
const Ride = require('../models/Ride');
const auth = require('../middleware/authMiddleware');

// POST /api/rides - create a new ride
router.post('/', auth, async (req, res) => {
  const { from, to, departureTime, seatsAvailable, costPerPerson, cabScreenshotUrl } = req.body;
  try {
    const newRide = new Ride({
      driver: req.user,
      from,
      to,
      departureTime,
      seatsAvailable,
      costPerPerson,
      cabScreenshotUrl,
    });
    const savedRide = await newRide.save();
    res.json(savedRide);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/rides - list rides with optional filters
router.get('/', async (req, res) => {
  try {
    const { sortBy, seats } = req.query;
    let query = {};

    if (seats) query.seatsAvailable = { $gte: parseInt(seats) };

    let rides = await Ride.find(query).populate('driver', 'name email');

    if (sortBy === 'cost') rides = rides.sort((a, b) => a.costPerPerson - b.costPerPerson);
    else if (sortBy === 'time') rides = rides.sort((a, b) => new Date(a.departureTime) - new Date(b.departureTime));

    res.json(rides);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/rides/:id - get ride detail
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name email');
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/rides/:id/book - book a seat
router.post('/:id/book', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    if (ride.seatsAvailable <= 0) return res.status(400).json({ msg: 'No seats available' });

    if (ride.bookedBy.includes(req.user)) return res.status(400).json({ msg: 'Already booked' });

    ride.bookedBy.push(req.user);
    ride.seatsAvailable -= 1;
    await ride.save();

    res.json({ msg: 'Seat booked successfully' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});
let sortOption = {};
if (sortBy === 'cost') sortOption.costPerPerson = 1;
else if (sortBy === 'time') sortOption.departureTime = 1;
let rides = await Ride.find(query).populate('driver', 'name email').sort(sortOption);

module.exports = router;
