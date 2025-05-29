import express from 'express';
import Ride from '../models/Ride.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/rides - create a new ride
router.post('/', auth, async (req, res) => {
  const { from, to, date, driverArrivingIn, seatsAvailable, costPerPerson, cabScreenshotUrl } = req.body;

  // Basic validation
  if (!from || !to || !date || !driverArrivingIn || !seatsAvailable || !costPerPerson) {
    return res.status(400).json({ msg: 'Missing required fields' });
  }

  try {
    const newRide = new Ride({
      driver: req.user,
      from,
      to,
      date,
      driverArrivingIn,
      seatsAvailable,
      costPerPerson,
      cabScreenshotUrl,
    });

    const savedRide = await newRide.save();
    res.json(savedRide);
  } catch (err) {
    console.error('Error creating ride:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/rides - list rides with optional filters
router.get('/', async (req, res) => {
  try {
    const { sortBy, seats } = req.query;
    const query = {};

    if (seats) query.seatsAvailable = { $gte: parseInt(seats) };

    const sortOption = {};
    if (sortBy === 'cost') sortOption.costPerPerson = 1;
    else if (sortBy === 'date') sortOption.date = 1;

    const rides = await Ride.find(query)
      .populate('driver', 'name email')
      .sort(sortOption);

    res.json(rides);
  } catch (err) {
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/rides/:id - get ride detail
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name');
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

// POST /api/rides/:id/reject - reject a ride
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    // Optional: do something like marking it as rejected or logging it

    res.json({ msg: 'Ride rejected' });
  } catch (err) {
    console.error('Error rejecting ride:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});


export default router;