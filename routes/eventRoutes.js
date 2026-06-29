/**
 * Archivo: routes/eventRoutes.js
 * Descripción: Define las rutas HTTP para operaciones de eventos de partido.
 */
const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');

router.post('/', eventController.registerEvent);
router.get('/match/:matchId', eventController.getEventsByMatch);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

module.exports = router;