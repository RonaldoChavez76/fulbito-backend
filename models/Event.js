const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  type: { 
    type: String, 
    enum: ['GOAL', 'YELLOW_CARD', 'RED_CARD'], 
    required: true 
  },
  playerDorsal: { type: String, required: true },
  teamId: { type: Number, enum: [0, 1], required: true },
  timestampSeconds: { type: Number, required: true },
  period: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Event || mongoose.model('Event', EventSchema);