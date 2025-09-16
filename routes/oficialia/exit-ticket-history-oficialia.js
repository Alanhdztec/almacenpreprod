// ========================================
// ROUTES/EXIT-TICKET-HISTORY-OFICIALIA.JS - HISTORIAL VALES DE SALIDA OFICIALÍA
// ========================================

const express = require('express');
const router = express.Router();
const ExitTicketHistoryOficialiaController = require('../../controllers/oficialia/exitticketHistoryOficialiaController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');

// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// ========================================
// RUTAS PRINCIPALES - HISTORIAL ALMACÉN OFICIALÍA
// ========================================

// Mostrar historial de vales de salida
router.get('/', ExitTicketHistoryOficialiaController.showHistory);

// Ver detalle de un vale específico
router.get('/detail/:id', ExitTicketHistoryOficialiaController.showValeDetail);

// ========================================
// APIs PARA AJAX Y EXPORTACIÓN
// ========================================

// API para obtener datos del historial con filtros
router.get('/api/data', ExitTicketHistoryOficialiaController.getHistoryData);

// API para exportar historial a CSV
router.get('/api/export/csv', ExitTicketHistoryOficialiaController.exportHistoryCSV);

// API para obtener estadísticas
router.get('/api/statistics', ExitTicketHistoryOficialiaController.getStatistics);

module.exports = router;