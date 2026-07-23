const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.League || mongoose.model('League', LeagueSchema);
