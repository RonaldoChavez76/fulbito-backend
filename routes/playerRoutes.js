/**
 * Archivo: routes/playerRoutes.js
 * Descripción: Define las rutas HTTP para operaciones de jugadores.
 *              Prefijo esperado: /api/players
 */
const express = require('express');
const router = express.Router();
const playerController = require('../controllers/playerController');

// Rutas base para jugadores
<<<<<<< Updated upstream
router.post('/', playerController.createPlayer);
router.post('/bulk', playerController.bulkCreatePlayers);
router.post('/sync-manual', playerController.syncManualPlayer);
router.get('/top-scorers', playerController.getTopScorers); // Debe ir antes de /:id para no confundir
router.get('/my-stats/:userId', playerController.getMyStats);
router.get('/captain-info/:userId', playerController.getCaptainInfo);
=======
router.post('/', playerController.createPlayer); // POST /api/players
router.post('/bulk', playerController.bulkCreatePlayers); // POST /api/players/bulk
router.post('/sync-manual', playerController.syncManualPlayer); // POST /api/players/sync-manual
router.get('/top-scorers', playerController.getTopScorers); // GET /api/players/top-scorers
router.get('/my-stats/:userId', playerController.getMyStats); // GET /api/players/my-stats/:userId
>>>>>>> Stashed changes

// Rutas que requieren parámetros (ID)
router.get('/', playerController.getAllPlayers); // GET /api/players
router.get('/match/:matchId', playerController.getPlayersByMatch); // GET /api/players/match/:matchId
router.get('/team/:teamRef', playerController.getPlayersByTeam); // GET /api/players/team/:teamRef
router.put('/:id', playerController.updatePlayer); // PUT /api/players/:id
router.delete('/:id', playerController.deletePlayer); // DELETE /api/players/:id
router.post('/:id/generate-account', playerController.generateAccount); // POST /api/players/:id/generate-account

module.exports = router;