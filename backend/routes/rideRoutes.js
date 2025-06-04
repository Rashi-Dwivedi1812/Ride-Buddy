// routes/rides.js

import express from 'express';
import Ride from '../models/Ride.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// -------------------------
// Shared booking logic
// -------------------------
const bookRide = async (ride, user, io) => {
  if (ride.seatsAvailable <= 0) {
    throw new Error('No seats available');
  }

  if (ride.bookedBy.some(u => u.toString() === user._id.toString())) {
    throw new Error('Already booked this ride');
  }

  ride.bookedBy.push(user._id);
  ride.seatsAvailable -= 1;
  await ride.save();

  const populated = await Ride.findById(ride._id)
    .populate('driver', 'name')
    .populate('bookedBy', 'name');

  if (io && ride._id) {
    io.to(ride._id.toString()).emit('ride_booked', {
      rideId: ride._id,
      byUserId: user._id,
      message: `${user.name} booked your ride`,
    });
    io.to(ride._id.toString()).emit('passenger_updated', {
      rideId: ride._id,
      passengers: populated.bookedBy,
    });
  }

  return populated;
};

// -------------------------
// POST /api/rides - Create a ride
// -------------------------
router.post('/', auth, async (req, res) => {
  const { from, to, date, driverArrivingIn, seatsAvailable, costPerPerson, cabScreenshotUrl } = req.body;

  if (!from || !to || !date || !driverArrivingIn || !seatsAvailable || !costPerPerson) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const newRide = new Ride({
      driver: req.user,
      from,
      to,
      date,
      driverArrivingIn,
      seatsAvailable,
      initialSeats: seatsAvailable,
      costPerPerson,
      cabScreenshotUrl,
    });

    const savedRide = await newRide.save();
    res.json(savedRide);
  } catch (err) {
    console.error('Error creating ride:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------------
// GET /api/rides - List rides
// -------------------------
router.get('/', async (req, res) => {
  try {
    const { sortBy, seats } = req.query;
    const query = {};

    if (seats && !isNaN(parseInt(seats))) {
      query.seatsAvailable = { $gte: parseInt(seats) };
    }

    const sortOption = {};
    if (sortBy === 'cost') sortOption.costPerPerson = 1;
    else if (sortBy === 'date') sortOption.date = 1;

    const rides = await Ride.find(query)
      .populate('driver', 'name email')
      .sort(sortOption);

    res.json(rides);
  } catch (err) {
    console.error('Error fetching rides:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------------
// GET /api/rides/:id - Ride detail
// -------------------------
router.get('/:id', async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id)
      .populate('driver', 'name')
      .populate('bookedBy', 'name');

    if (!ride) return res.status(404).json({ error: 'Ride not found' });
    res.json(ride);
  } catch (err) {
    console.error('Error fetching ride:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------------
// POST /api/rides/:id/book - Book ride
// -------------------------
router.post('/:id/book', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id).populate('driver', 'name _id');
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const io = req.app.get('io');
    const updatedRide = await bookRide(ride, req.user, io);
    res.json({ msg: 'Seat booked successfully', ride: updatedRide });
  } catch (err) {
    console.error('Book ride error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// -------------------------
// POST /api/rides/:rideId/accept - Accept ride (duplicate booking handler)
// -------------------------
router.post('/:rideId/accept', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const io = req.app.get('io');
    const updatedRide = await bookRide(ride, req.user, io);
    res.json(updatedRide);
  } catch (err) {
    console.error('Accept ride error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// -------------------------
// POST /api/rides/:id/reject - Reject a ride (placeholder)
// -------------------------
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // TODO: Add rejection tracking logic here
    res.json({ msg: 'Ride rejected' });
  } catch (err) {
    console.error('Reject ride error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// -------------------------
// GET /api/rides/mine - Get user's posted rides
// -------------------------
router.get('/mine', auth, async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const rides = await Ride.find({ driver: req.user._id }).sort({ createdAt: -1 });
    res.json(rides);
  } catch (err) {
    console.error('Error fetching user rides:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;