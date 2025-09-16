// ========================================
// ROUTES/AUTH.JS - VERSIÓN MEJORADA
// ========================================

const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { redirectIfAuthenticated } = require('../middleware/auth');

// ✅ Ruta para mostrar el formulario de login
// Ahora redirige correctamente según rol y sistema
router.get('/login', redirectIfAuthenticated, AuthController.showLogin);

// Ruta para procesar el login
router.post('/login', AuthController.login);

// Ruta para logout
router.post('/logout', AuthController.logout);

// ✅ NUEVA: Ruta para cambiar sistema (desde el frontend)
router.post('/cambiar-sistema', AuthController.cambiarSistema);

module.exports = router;