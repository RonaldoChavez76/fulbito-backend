

/**
 * Archivo: models/Match.js
 * Descripción: Define el esquema de MongoDB para los partidos,
 *              incluyendo equipos, marcador, estado del partido y tiempos.
 */
const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  homeTeam: { type: String, required: true },
  awayTeam: { type: String, required: true },
  homeScore: { type: Number, default: 0 },
  awayScore: { type: Number, default: 0 },
  currentPeriod: { 
    type: String, 
    enum: ['1ER TIEMPO', '2DO TIEMPO', 'FIN'], 
    default: '1ER TIEMPO' 
  },
  elapsedTimeSeconds: { type: Number, default: 0 },
  isPaused: { type: Boolean, default: true },
  isFinished: { type: Boolean, default: false },
  startTime: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Match || mongoose.model('Match', MatchSchema);