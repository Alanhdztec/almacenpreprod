
// ========================================
// ROUTES/ENTRY-TICKET-GENERAL.JS - SOLO ALMACÉN GENERAL
// ========================================

const express = require('express');
const router = express.Router();
const EntryTicketGeneralController = require('../../controllers/general/entryticketGeneralController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');
// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);


// ========================================
// RUTAS PRINCIPALES - ALMACÉN GENERAL
// ========================================

router.get('/create', EntryTicketGeneralController.showCreateForm);
router.post('/create', EntryTicketGeneralController.createValeEntrada);
router.get('/success/:id', EntryTicketGeneralController.showSuccess);

// ========================================
// APIs PARA BÚSQUEDAS Y AUTOCOMPLETADO
// ========================================

router.get('/api/search-proveedores', EntryTicketGeneralController.searchProveedores);
router.get('/api/repartidores/:id_proveedor', EntryTicketGeneralController.getRepartidores);
router.get('/api/search-productos', EntryTicketGeneralController.searchProductos);
router.get('/api/search-similar-productos-genericos', EntryTicketGeneralController.searchSimilarProductosGenericos);
router.get('/api/search-productos-genericos', EntryTicketGeneralController.searchProductosGenericos);
router.get('/api/search/requisiciones', EntryTicketGeneralController.searchRequisiciones);

// ========================================
// APIs PARA CREAR NUEVOS REGISTROS
// ========================================

router.post('/api/create-proveedor', EntryTicketGeneralController.createProveedor);
router.post('/api/create-repartidor', EntryTicketGeneralController.createRepartidor);
router.post('/api/create-producto-generico', EntryTicketGeneralController.createProductoGenerico);
router.post('/api/create-producto', EntryTicketGeneralController.createProducto);

module.exports = router;
