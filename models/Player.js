const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: true },
  dorsal: { type: String, required: true },
  name: { type: String, default: "" },
  teamId: { type: Number, enum: [0, 1], required: true }, // 0: Local, 1: Visita
  isManualEntry: { type: Boolean, default: false }
});

module.exports = mongoose.models.Player || mongoose.model('Player', PlayerSchema);