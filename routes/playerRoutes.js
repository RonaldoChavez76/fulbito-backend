/**
 * Archivo: routes/playerRoutes.js
 * Descripción: Define las rutas HTTP para operaciones de jugadores.
 */
const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Rutas base para jugadores
router.post('/', playerController.createPlayer);
router.post('/bulk', playerController.bulkCreatePlayers);
router.post('/sync', playerController.syncManualPlayer);

// Rutas que requieren parámetros (ID)
router.get('/match/:matchId', playerController.getPlayersByMatch);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);

module.exports = router;