// ========================================
// ROUTES/ENTRY-TICKET-HISTORY-GENERAL.JS - HISTORIAL ALMACÉN GENERAL
// ========================================

const express = require('express');
const router = express.Router();
const EntryTicketHistoryGeneralController = require('../../controllers/general/entryticketHistoryGeneralController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');

// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// ========================================
// RUTAS PRINCIPALES - HISTORIAL ALMACÉN GENERAL
// ========================================

// Mostrar historial de vales de entrada
router.get('/', EntryTicketHistoryGeneralController.showHistory);

// Ver detalle de un vale específico
router.get('/detail/:id', EntryTicketHistoryGeneralController.showValeDetail);

// ========================================
// APIs PARA AJAX Y EXPORTACIÓN
// ========================================

// API para obtener datos del historial con filtros
router.get('/api/data', EntryTicketHistoryGeneralController.getHistoryData);

// API para exportar historial a CSV
router.get('/api/export/csv', EntryTicketHistoryGeneralController.exportHistoryCSV);

// API para obtener estadísticas
router.get('/api/statistics', EntryTicketHistoryGeneralController.getStatistics);

module.exports = router;