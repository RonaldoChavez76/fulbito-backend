const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['Admin', 'Capitan', 'Cliente'],
    default: 'Cliente'
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
