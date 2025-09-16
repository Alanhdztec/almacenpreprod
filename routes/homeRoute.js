// ========================================
// 9. ROUTES/HOME.JS
// ========================================

const express = require('express');
const router = express.Router();
const HomeController = require('../controllers/adm/homeController');
const { requireAuth } = require('../middleware/auth');

// Ruta del dashboard (requiere autenticación)
router.get('/dashboard', requireAuth, HomeController.showDashboard);

module.exports = router;