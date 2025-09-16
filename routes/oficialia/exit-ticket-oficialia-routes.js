// ========================================
// ROUTES/EXIT-TICKET-OFICIALIA-ROUTES.JS - OFICIALÍA
// ========================================

const express = require('express');
const router = express.Router();
const exitTicketOficialiaController = require('../../controllers/oficialia/exitticketOficialiaController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');

// ========================================
// MIDDLEWARE COMÚN - IGUAL QUE ENTRY-TICKET
// ========================================
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// ========================================
// RUTAS PRINCIPALES - OFICIALÍA
// ========================================
router.get('/create', exitTicketOficialiaController.showCreateForm);
router.post('/create', exitTicketOficialiaController.createValeSalida);
router.get('/success/:id', exitTicketOficialiaController.showSuccess);
router.get('/history', exitTicketOficialiaController.showHistory);

// ========================================
// APIs PARA BÚSQUEDAS
// ========================================
router.get('/api/search/productos', exitTicketOficialiaController.searchProductos);
router.get('/api/search/empleados', exitTicketOficialiaController.searchEmpleados);
router.get('/api/search/proveedores', exitTicketOficialiaController.searchProveedores);

module.exports = router;