import mongoose from 'mongoose';

const RideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

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
      type: Date, // Use actual Date type for validation
      required: true,
      validate: {
        validator: function (value) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          return value >= today;
        },
        message: 'Date must be today or in the future'
      }
    },

    driverArrivingIn: {
      type: Number, // Changed from String ➝ Number (minutes)
      required: true,
      min: [0, 'Driver arrival time must be a non-negative number']
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

    cabScreenshotUrl: {
      type: String
    },

    bookedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ]
  },
  { timestamps: true } // adds createdAt and updatedAt automatically
);

// Store initial seat count when creating a ride
RideSchema.pre('save', function (next) {
  if (this.isNew) {
    this._initialSeatsAvailable = this.seatsAvailable;
  }
  next();
});

// Validate booked users ≤ initial seats
RideSchema.pre('save', function (next) {
  const initialSeats = this.isNew
    ? this.seatsAvailable
    : this._initialSeatsAvailable;

  if (this.bookedBy.length > initialSeats) {
    return next(
      new Error('Number of booked users cannot exceed initial seats available')
    );
  }

  next();
});

const Ride = mongoose.model('Ride', RideSchema);
export default Ride;