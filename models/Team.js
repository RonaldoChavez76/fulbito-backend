/**
 * Archivo: models/Team.js
 * Descripción: Define el esquema de equipos en la base de datos.
 *              Guarda nombre, categoría, capitán, escudo e incluye
 *              un arreglo de referencias a las ligas en las que participa.
 */
const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true, default: 'Mayor' },
  captain: { type: String, required: true },
  shieldUrl: { type: String, default: '' },
  leagues: [{ type: mongoose.Schema.Types.ObjectId, ref: 'League' }],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.models.Team || mongoose.model('Team', TeamSchema);
