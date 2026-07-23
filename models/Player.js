/**
 * Archivo: models/Player.js
 * Descripción: Define el esquema de jugadores asociados a un partido,
 *              con dorsal, nombre, equipo y marca de entrada manual.
 */
const mongoose = require('mongoose');

const PlayerSchema = new mongoose.Schema({
  matchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Match', required: false },
  teamRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: false }, // Para jugadores globales del equipo
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }, // Referencia al usuario (rol Jugador)
  dorsal: { type: String, required: true },
  name: { type: String, default: "" },
  position: { type: String, default: "Jugador" },
  photoUrl: { type: String, default: "" },
  goals: { type: Number, default: 0 },
  teamId: { type: Number, enum: [0, 1], required: false },
  isManualEntry: { type: Boolean, default: false }
});

module.exports = mongoose.models.Player || mongoose.model('Player', PlayerSchema);