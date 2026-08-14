/**
 * Archivo: routes/authRoutes.js
 * Descripción: Define las rutas de la API relacionadas a la autenticación de usuarios.
 *              Prefijo esperado: /api/auth
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.post('/register', authController.register); // POST /api/auth/register
router.post('/login', authController.login);       // POST /api/auth/login
router.put('/change-password', authController.changePassword); // PUT /api/auth/change-password

module.exports = router;
