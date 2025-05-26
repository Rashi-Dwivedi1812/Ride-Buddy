const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    minlength: [2, 'Name must be at least 2 characters long'], 
    maxlength: [50, 'Name must not exceed 50 characters'] 
  },
  email: { 
    type: String, 
    required: true, 
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address']
  },
  password: { 
    type: String, 
    required: true, 
    minlength: [6, 'Password must be at least 6 characters long'] 
  },
  ratings: [{ 
    type: Number, 
    min: [1, 'Rating must be at least 1'], 
    max: [5, 'Rating must not exceed 5'] 
  }],
});

module.exports = mongoose.model('User', UserSchema);