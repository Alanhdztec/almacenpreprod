// ========================================
// ROUTES/EXIT-TICKET-HISTORY-GENERAL.JS - HISTORIAL VALES DE SALIDA ALMACÉN GENERAL
// ========================================

const express = require('express');
const router = express.Router();
const ExitTicketHistoryGeneralController = require('../../controllers/general/exitticketHistoryGeneralController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');

// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// ========================================
// RUTAS PRINCIPALES - HISTORIAL ALMACÉN GENERAL
// ========================================

// Mostrar historial de vales de salida
router.get('/', ExitTicketHistoryGeneralController.showHistory);

// Ver detalle de un vale específico
router.get('/detail/:id', ExitTicketHistoryGeneralController.showValeDetail);

// ========================================
// API PARA EXPORTACIÓN
// ========================================

// API para exportar historial a CSV
router.get('/api/export/csv', ExitTicketHistoryGeneralController.exportHistoryCSV);

module.exports = router;