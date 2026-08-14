/**
 * Archivo: models/League.js
 * Descripción: Esquema Mongoose para representar una Liga.
 *              Contiene información básica como nombre, descripción y el logo (escudo) de la liga.
 */
const mongoose = require('mongoose');

const LeagueSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String, default: '' },
  logoUrl: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.League || mongoose.model('League', LeagueSchema);
