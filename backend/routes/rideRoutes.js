import express from 'express';
import Ride from '../models/Ride.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// POST /api/rides - create a new ride
router.post('/', auth, async (req, res) => {
  const { from, to, date, driverArrivingIn, seatsAvailable, costPerPerson, cabScreenshotUrl } = req.body;

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
    console.error('Error fetching rides:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/rides/:id - get ride detail
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name')
      .populate('bookedBy', 'name');

    if (!ride) return res.status(404).json({ msg: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('Error fetching ride:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/rides/:id/book - book a seat
router.post('/:id/book', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name _id');
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    if (ride.seatsAvailable <= 0) return res.status(400).json({ msg: 'No seats available' });

    if (ride.bookedBy.some(userId => userId.toString() === req.user._id.toString())) {
      return res.status(400).json({ msg: 'Already booked this ride' });
    }

    ride.bookedBy.push(req.user._id);
    ride.seatsAvailable -= 1;
    await ride.save();

    const io = req.app.get('io');
    io.to(ride._id.toString()).emit('ride_booked', {
      rideId: ride._id,
      byUserId: req.user._id,
      message: 'A user just booked your ride!',
    });

    res.json({ msg: 'Seat booked successfully' });
  } catch (err) {
    console.error('Book ride error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/rides/:id/reject - reject a ride
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    // Optionally track rejections

    res.json({ msg: 'Ride rejected' });
  } catch (err) {
    console.error('Reject ride error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// GET /api/rides/mine - get user's posted rides
router.get('/mine', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ msg: 'Unauthorized: no user._id' });
    }

    const rides = await Ride.find({ driver: req.user._id }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error('Error fetching user rides:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

// POST /api/rides/:rideId/accept - accept a ride
// POST /api/rides/:rideId/accept - safely accept a ride
router.post('/:rideId/accept', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);

    if (!ride) return res.status(404).json({ msg: 'Ride not found' });

    // Ensure bookedBy is treated as array
    const alreadyBooked = Array.isArray(ride.bookedBy)
      ? ride.bookedBy.some(userId => userId.toString() === req.user._id.toString())
      : false;

    if (alreadyBooked) {
      return res.status(400).json({ msg: 'Already booked this ride' });
    }

    if (ride.seatsAvailable <= 0) {
      return res.status(400).json({ msg: 'No seats available' });
    }

    ride.bookedBy.push(req.user._id);
    ride.seatsAvailable -= 1;
    await ride.save();

    const updatedRide = await Ride.findById(req.params.rideId)
      .populate('driver', 'name')
      .populate('bookedBy', 'name');

    res.json(updatedRide);
  } catch (err) {
    console.error('Accept ride error:', err);
    res.status(500).json({ msg: 'Server error' });
  }
});

export default router;