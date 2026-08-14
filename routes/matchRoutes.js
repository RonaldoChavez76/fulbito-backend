/**
 * Archivo: routes/matchRoutes.js
 * Descripción: Define las rutas HTTP para operaciones de partidos de futbol.
 *              Prefijo esperado: /api/matches
 */
const express = require('express');
const router = express.Router();
const matchController = require('../controllers/matchController');

// Rutas base para los partidos
router.post('/', matchController.createMatch); // POST /api/matches
router.get('/', matchController.getAllMatches); // GET /api/matches
router.get('/:id', matchController.getMatchDetails); // GET /api/matches/:id
router.put('/:id', matchController.updateMatchStatus); // PUT /api/matches/:id
router.delete('/:id', matchController.deleteMatch); // DELETE /api/matches/:id

// Ruta específica para eventos
router.post('/events', matchController.registerEvent); // POST /api/matches/events

module.exports = router;