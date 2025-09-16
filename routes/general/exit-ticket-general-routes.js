// ========================================
// ROUTES/EXIT-TICKET-GENERAL-ROUTES.JS - ALMACÉN GENERAL
// ========================================

const express = require('express');
const router = express.Router();
const exitTicketGeneralController = require('../../controllers/general/exitticketGeneralController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');

// ========================================
// MIDDLEWARE COMÚN - IGUAL QUE ENTRY-TICKET
// ========================================
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// ========================================
// RUTAS PRINCIPALES - ALMACÉN GENERAL
// ========================================
router.get('/create', exitTicketGeneralController.showCreateForm);
router.post('/create', exitTicketGeneralController.createValeSalida);
router.get('/success/:id', exitTicketGeneralController.showSuccess);
router.get('/history', exitTicketGeneralController.showHistory);

// ========================================
// APIs PARA BÚSQUEDAS
// ========================================
router.get('/api/search/productos', exitTicketGeneralController.searchProductos);
router.get('/api/search/empleados', exitTicketGeneralController.searchEmpleados);
router.get('/api/search/proveedores', exitTicketGeneralController.searchProveedores);

module.exports = router;