// ========================================
// ROUTES/ENTRY-TICKET-HISTORY-OFICIALIA.JS - HISTORIAL ALMACÉN OFICIALÍA
// ========================================

const express = require('express');
const router = express.Router();
const EntryTicketHistoryOficialiaController = require('../../controllers/oficialia/entryticketHistoryOficialiaController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');

// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// ========================================
// RUTAS PRINCIPALES - HISTORIAL ALMACÉN OFICIALÍA
// ========================================

// Mostrar historial de vales de entrada
router.get('/', EntryTicketHistoryOficialiaController.showHistory);

// Ver detalle de un vale específico
router.get('/detail/:id', EntryTicketHistoryOficialiaController.showValeDetail);

// ========================================
// APIs PARA AJAX Y EXPORTACIÓN
// ========================================

// API para obtener datos del historial con filtros
router.get('/api/data', EntryTicketHistoryOficialiaController.getHistoryData);

// API para exportar historial a CSV
router.get('/api/export/csv', EntryTicketHistoryOficialiaController.exportHistoryCSV);

// API para obtener estadísticas
router.get('/api/statistics', EntryTicketHistoryOficialiaController.getStatistics);

module.exports = router;