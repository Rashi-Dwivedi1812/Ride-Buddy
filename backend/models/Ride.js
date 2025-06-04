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
    status: {
  type: String,
  enum: ['active', 'completed', 'cancelled'],
  default: 'active',
},
    to: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Destination must not be empty']
    },

    date: {
      type: Date,
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
      type: Number,
      required: true,
      min: [0, 'Driver arrival time must be a non-negative number']
    },

    seatsAvailable: {
      type: Number,
      required: true,
      min: [0, 'Seats available cannot be negative']
    },

    initialSeats: {
      type: Number,
      required: true,
      min: [0, 'Initial seats must be non-negative']
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
  { timestamps: true }
);

// Ensure number of bookings does not exceed initial seats
RideSchema.pre('save', function (next) {
  if (this.bookedBy.length > this.initialSeats) {
    return next(
      new Error('Number of booked users cannot exceed initial seats available')
    );
  }
  next();
});

// Virtual field to compute how many seats have been booked
RideSchema.virtual('seatsBooked').get(function () {
  return this.bookedBy.length;
});

const Ride = mongoose.model('Ride', RideSchema);
export default Ride;