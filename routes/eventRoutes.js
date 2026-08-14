/**
 * Archivo: routes/eventRoutes.js
 * Descripción: Define las rutas HTTP para operaciones de eventos de partido.
 *              Prefijo esperado: /api/events
 */
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.post('/', eventController.registerEvent); // POST /api/events
router.get('/match/:matchId', eventController.getEventsByMatch); // GET /api/events/match/:matchId
router.put('/:id', eventController.updateEvent); // PUT /api/events/:id
router.delete('/:id', eventController.deleteEvent); // DELETE /api/events/:id

module.exports = router;