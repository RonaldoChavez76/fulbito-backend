const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, default: 'Mayor' },
  captain: { type: String, required: true },
  shieldUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Team || mongoose.model('Team', TeamSchema);
