/**
 * Archivo: models/User.js
 * Descripción: Esquema de usuarios para la autenticación en el sistema.
 *              Incluye credenciales básicas y sistema de roles para control de acceso.
 */
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
    enum: ['Admin', 'Capitan', 'Cliente', 'Jugador'],
    default: 'Cliente'
  }
}, { timestamps: true });

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
