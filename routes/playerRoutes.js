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
router.post('/sync-manual', playerController.syncManualPlayer);
router.get('/top-scorers', playerController.getTopScorers); // Debe ir antes de /:id para no confundir
router.get('/my-stats/:userId', playerController.getMyStats);

// Rutas que requieren parámetros (ID)
router.get('/', playerController.getAllPlayers);
router.get('/match/:matchId', playerController.getPlayersByMatch);
router.get('/team/:teamRef', playerController.getPlayersByTeam);
router.put('/:id', playerController.updatePlayer);
router.delete('/:id', playerController.deletePlayer);
router.post('/:id/generate-account', playerController.generateAccount);

module.exports = router;