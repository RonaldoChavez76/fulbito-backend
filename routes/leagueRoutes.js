/**
 * Archivo: routes/leagueRoutes.js
 * Descripción: Define las rutas HTTP para la administración de Ligas.
 *              Prefijo esperado: /api/leagues
 */
const express = require('express');
const router = express.Router();
const leagueController = require('../controllers/leagueController');

router.get('/', leagueController.getLeagues); // GET /api/leagues
router.get('/:id', leagueController.getLeagueById); // GET /api/leagues/:id
router.post('/', leagueController.createLeague); // POST /api/leagues
router.put('/:id', leagueController.updateLeague); // PUT /api/leagues/:id
router.delete('/:id', leagueController.deleteLeague); // DELETE /api/leagues/:id

module.exports = router;
