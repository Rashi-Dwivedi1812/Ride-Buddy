const mongoose = require('mongoose');

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
  departureTime: { 
    type: Date, 
    required: true,
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Departure time must be in the future'
    }
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
  bookedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
}, { timestamps: true });

// Pre-save hook to ensure seatsAvailable consistency
RideSchema.pre('save', function(next) {
  if (this.seatsAvailable < 0) {
    return next(new Error('Seats available cannot be negative'));
  }
  // Optional: Ensure bookedBy length doesn't exceed initial seats
  const initialSeats = this.isNew ? this.seatsAvailable : this._initialSeatsAvailable;
  if (this.bookedBy.length > initialSeats) {
    return next(new Error('Number of booked users cannot exceed initial seats available'));
  }
  next();
});

// Store initial seatsAvailable for validation in pre-save hook
RideSchema.pre('save', function(next) {
  if (this.isNew) {
    this._initialSeatsAvailable = this.seatsAvailable;
  }
  next();
});

module.exports = mongoose.model('Ride', RideSchema);