/**
 * Archivo: routes/matchRoutes.js
 * Descripción: Define las rutas HTTP para operaciones de partidos de futbol.
 */
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Rutas base para los partidos
router.post('/', matchController.createMatch);
router.get('/', matchController.getAllMatches);
router.get('/:id', matchController.getMatchDetails);
router.put('/:id', matchController.updateMatchStatus);
router.delete('/:id', matchController.deleteMatch);

// Ruta específica para eventos
router.post('/events', matchController.registerEvent);

module.exports = router;