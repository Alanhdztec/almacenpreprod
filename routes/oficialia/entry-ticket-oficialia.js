
// ========================================
// ROUTES/ENTRY-TICKET-OFICIALIA.JS - SOLO OFICIALÍA
// ========================================

const express = require('express');
const router = express.Router();
const EntryTicketOficialiaController = require('../../controllers/oficialia/entryticketOficialiaController');
const { requireAuth, requireAlmacen } = require('../../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../../middleware/system');


// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);


// ========================================
// RUTAS PRINCIPALES - OFICIALÍA
// ========================================

router.get('/create', EntryTicketOficialiaController.showCreateForm);
router.post('/create', EntryTicketOficialiaController.createValeEntrada);
router.get('/success/:id', EntryTicketOficialiaController.showSuccess);
router.get('/history', EntryTicketOficialiaController.showHistory);

// ========================================
// APIs PARA BÚSQUEDAS Y AUTOCOMPLETADO
// ========================================

router.get('/api/search-proveedores', EntryTicketOficialiaController.searchProveedores);
router.get('/api/repartidores/:id_proveedor', EntryTicketOficialiaController.getRepartidores);
router.get('/api/search-productos', EntryTicketOficialiaController.searchProductos);
router.get('/api/search-similar-productos-genericos', EntryTicketOficialiaController.searchSimilarProductosGenericos);
router.get('/api/search-productos-genericos', EntryTicketOficialiaController.searchProductosGenericos);
router.get('/api/search/requisiciones', EntryTicketOficialiaController.searchRequisiciones);

// ========================================
// APIs PARA CREAR NUEVOS REGISTROS
// ========================================

router.post('/api/create-proveedor', EntryTicketOficialiaController.createProveedor);
router.post('/api/create-repartidor', EntryTicketOficialiaController.createRepartidor);
router.post('/api/create-producto-generico', EntryTicketOficialiaController.createProductoGenerico);
router.post('/api/create-producto', EntryTicketOficialiaController.createProducto);

module.exports = router;