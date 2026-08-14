/**
 * Archivo: routes/teamRoutes.js
 * Descripción: Define las rutas HTTP para la administración de Equipos.
 *              Prefijo esperado: /api/teams
 */
const express = require('express');
const router = express.Router();
const teamController = require('../controllers/teamController');

router.post('/', teamController.createTeam); // POST /api/teams
router.get('/', teamController.getTeams); // GET /api/teams
router.put('/:id', teamController.updateTeam); // PUT /api/teams/:id
router.delete('/:id', teamController.deleteTeam); // DELETE /api/teams/:id

module.exports = router;
