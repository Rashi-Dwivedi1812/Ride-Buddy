// routes/rideRoutes.js

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
    io.to(`driver_${ride.driver._id}`).emit('ride_booked', {
  rideId: ride._id,
  byUserId: user._id,
  driverId: ride.driver._id, // ✅ Add this
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
  try {
     console.log('👉 Authenticated user:', req.user);
    const userId = req.user.id;
    const { from, to, date, driverArrivingIn, seatsAvailable, costPerPerson, cabScreenshotUrl } = req.body;

    if (!from || !to || !date || !driverArrivingIn || !seatsAvailable || !costPerPerson) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const ride = new Ride({
      from,
      to,
      date,
      driverArrivingIn,
      seatsAvailable: parseInt(seatsAvailable),
      initialSeats: parseInt(seatsAvailable),
      costPerPerson,
      cabScreenshotUrl,
      driver: userId, // ✅ key line: set driver from auth token
    });

    await ride.save();
    const populatedRide = await ride.populate('driver', 'name');
    res.status(201).json(populatedRide);
  } catch (err) {
    console.error('❌ Failed to create ride:', err); // 👈 log full error
    res.status(500).json({ msg: 'Failed to create ride.', error: err.message }); // 👈 send message to client
  }
});

// -------------------------
// GET /api/rides/mine - User's posted rides
// -------------------------
router.get('/mine', auth, async (req, res) => {
  try {
    console.log("✅ /mine requested by user:", req.user);

    const rides = await Ride.find({ driver: req.user._id })
      .populate('bookedBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(rides);
  } catch (error) {
    console.error('❌ Error in /api/rides/mine:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// -------------------------
// GET /api/rides - List all rides
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
    console.error('❌ Error fetching rides:', err);
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
    console.error('❌ Error fetching ride:', err);
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
    console.error('❌ Book ride error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// -------------------------
// POST /api/rides/:rideId/accept - Accept ride request
// -------------------------
router.post('/:rideId/accept', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.rideId);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    const io = req.app.get('io');
    const updatedRide = await bookRide(ride, req.user, io);

    res.json(updatedRide); // ✅ Make sure this is sending correct ride data
  } catch (err) {
    console.error('❌ Accept ride error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// -------------------------
// POST /api/rides/:id/reject - Reject a ride (stub)
// -------------------------
router.post('/:id/reject', auth, async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return res.status(404).json({ error: 'Ride not found' });

    // TODO: Add actual rejection tracking if needed
    res.json({ msg: 'Ride rejected' });
  } catch (err) {
    console.error('❌ Reject ride error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
