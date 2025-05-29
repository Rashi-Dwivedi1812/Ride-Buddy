import mongoose from 'mongoose';

const RideSchema = new mongoose.Schema({
  driver: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  from: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: [1, 'Starting location must not be empty'] 
  },

  to: { 
    type: String, 
    required: true, 
    trim: true, 
    minlength: [1, 'Destination must not be empty'] 
  },

  date: { 
    type: String, // Store as ISO date string or use Date if you prefer
    required: true,
    validate: {
      validator: function (value) {
        return new Date(value) >= new Date().setHours(0, 0, 0, 0);
      },
      message: 'Date must be today or in the future'
    }
  },

  driverArrivingIn: {
    type: String,
    required: true,
    trim: true,
    minlength: [1, 'Driver arrival time must not be empty']
  },

  seatsAvailable: { 
    type: Number, 
    required: true, 
    min: [0, 'Seats available cannot be negative'] 
  },

  costPerPerson: { 
    type: Number, 
    required: true, 
    min: [0, 'Cost per person must be non-negative'] 
  },

  cabScreenshotUrl: { type: String },
  createdAt: {
    type: Date,
    default: Date.now
  },

  bookedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  
}, { timestamps: true });

// Pre-save hook for seatsAvailable consistency
RideSchema.pre('save', function(next) {
  if (this.seatsAvailable < 0) {
    return next(new Error('Seats available cannot be negative'));
  }
  const initialSeats = this.isNew ? this.seatsAvailable : this._initialSeatsAvailable;
  if (this.bookedBy.length > initialSeats) {
    return next(new Error('Number of booked users cannot exceed initial seats available'));
  }
  next();
});

RideSchema.pre('save', function(next) {
  if (this.isNew) {
    this._initialSeatsAvailable = this.seatsAvailable;
  }
  next();
});

const Ride = mongoose.model('Ride', RideSchema);
export default Ride;