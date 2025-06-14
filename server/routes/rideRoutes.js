// routes/rideRoutes.js

import express from 'express';
import Ride from '../models/Ride.js';
import auth from '../middleware/authMiddleware.js';

const router = express.Router();

// -------------------------
// Shared booking logic
// -------------------------
const bookRide = async (ride, user, io) => {
  try {
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
      console.log('📢 Emitting ride_booked event to driver:', ride.driver._id);
      const eventData = {
        rideId: ride._id,
        byUserId: user._id,
        driverId: ride.driver._id,
        message: `${user.name} booked your ride`,
        ride: populated
      };
      console.log('📦 Event data:', eventData);
      
      io.to(`driver_${ride.driver._id}`).emit('ride_booked', eventData);
      
      // Also emit passenger update
      io.to(ride._id.toString()).emit('passenger_updated', {
        rideId: ride._id,
        passengers: populated.bookedBy
      });
    }

    return populated;
  } catch (error) {
    console.error('❌ Error in bookRide:', error);
    throw error;
  }
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
      driver: userId,
    });
    
    const savedRide = await ride.save();
    const populatedRide = await Ride.findById(savedRide._id)
      .populate('driver', 'name')
      .populate('bookedBy', 'name');

    // Emit ride update event with driverId ONLY to the specific driver's room
    const io = req.app.get('io');
    if (io) {
      // Use the specific driver's room for the emission
      io.to(`driver_${userId}`).emit('ride_update', {
        driverId: userId,
        action: 'create',
        ride: populatedRide
      });
      console.log('✅ Emitted ride_update to driver:', userId);
    }

    res.status(201).json(populatedRide);
  } catch (err) {
    console.error('❌ Failed to create ride:', err);
    res.status(500).json({ msg: 'Failed to create ride.', error: err.message });
  }
});

// -------------------------
// GET /api/rides/mine - User's posted rides
// -------------------------
router.get('/mine', auth, async (req, res) => {
  try {
    console.log("✅ /mine requested by user:", req.user);
    
    const rides = await Ride.find({ driver: req.user._id })
      .populate('driver', 'name email')  // Add driver population
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

    // Add time-based filtering (show rides that are less than 10 minutes old)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    query.createdAt = { $gte: tenMinutesAgo };

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
// GET /api/rides/booked - Rides the user booked (as passenger)
// -------------------------
// -------------------------
// GET /api/rides/booked - Current active booked rides
// -------------------------
router.get('/booked', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();

    // Only get active/upcoming rides (not completed ones)
    const bookedRides = await Ride.find({ 
      bookedBy: { $in: [userId] },
      date: { $gte: currentDate.toISOString().split('T')[0] }, // Today or future dates
      status: { $ne: 'completed' } // Exclude completed rides
    })
      .populate('driver', 'name')
      .populate('bookedBy', 'name email')
      .sort({ date: -1 });

     const ridesWithType = bookedRides.map(ride => ({
      ...ride.toObject(),
      rideType: 'booked'
    }));

    res.json(ridesWithType);
  } catch (error) {
    console.error('Error fetching booked rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------------
// GET /api/rides/posted - Current active posted rides
// -------------------------
router.get('/posted', auth, async (req, res) => {
  try {
    const userId = req.user._id;
    const currentDate = new Date();

    // Only get active/upcoming rides (not completed ones)
    const postedRides = await Ride.find({ 
      driver: userId,
      date: { $gte: currentDate.toISOString().split('T')[0] }, // Today or future dates
      status: { $ne: 'completed' } // Exclude completed rides
    })
      .populate('bookedBy', 'name email')
      .sort({ date: -1 });

     const ridesWithType = postedRides.map(ride => ({
      ...ride.toObject(),
      rideType: 'posted'
    }));

    res.json(ridesWithType);
  } catch (error) {
    console.error('Error fetching posted rides:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// -------------------------
// GET /api/rides/history - All ride history (booked + posted)
// -------------------------
router.get('/history', auth, async (req, res) => {
  try {
    const userId = req.user._id;

    // Get all rides (past and present) where user was involved
    const [bookedRides, postedRides] = await Promise.all([
      // Rides user booked (as passenger)
      Ride.find({ bookedBy: { $in: [userId] } })
        .populate('driver', 'name')
        .populate('bookedBy', 'name email')
        .sort({ date: -1 }),
      
      // Rides user posted (as driver)
      Ride.find({ driver: userId })
        .populate('bookedBy', 'name email')
        .sort({ date: -1 })
    ]);

    // Mark booked rides
    const bookedHistory = bookedRides.map(ride => ({
      ...ride.toObject(),
      isBooked: true,
      isPostedByUser: false
    }));

    // Mark posted rides
    const postedHistory = postedRides.map(ride => ({
      ...ride.toObject(),
      isBooked: false,
      isPostedByUser: true
    }));

    // Combine and sort all rides by date (newest first)
    const allHistory = [...bookedHistory, ...postedHistory]
      .sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json(allHistory);
  } catch (error) {
    console.error('Error fetching ride history:', error);
    res.status(500).json({ message: 'Server error' });
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

    // Check if ride has expired (only if it hasn't been booked)
    if (ride.bookedBy.length === 0) {
      const createdAt = new Date(ride.createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      const timeoutSeconds = ride.driverArrivingIn * 60;

      if (elapsed > timeoutSeconds) {
        // Ride has expired
        return res.status(404).json({ 
          error: 'Ride has ended',
          expired: true
        });
      }
    } else {
      // For booked rides, extend the expiration to 2 hours from creation
      const createdAt = new Date(ride.createdAt).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - createdAt) / 1000);
      const twoHoursInSeconds = 2 * 60 * 60; // 2 hours

      if (elapsed > twoHoursInSeconds) {
        return res.status(404).json({ 
          error: 'Ride has ended',
          expired: true
        });
      }
    }

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