// ========================================
// ROUTES/ENTRY-TICKET.JS - OPTIMIZADO
// ========================================
/*

const express = require('express');
const router = express.Router();
const EntryTicketController = require('../controllers/entryticketController');
const EntryTicketHistoryController = require('../controllers/entryTicketHistoryController');
const { requireAuth } = require('../middleware/auth');
const { requireSistema } = require('../middleware/system'); // Nuevo middleware

// Middleware para verificar rol de almacén
const requireAlmacenRole = (req, res, next) => {
  const user = req.session.user;
  if (!user || !['almacen', 'Jefe_almacen', 'Administrador'].includes(user.rol)) {
    return res.status(403).render('error', {
      title: 'Acceso Denegado',
      message: 'No tienes permisos para acceder a esta sección'
    });
  }
  next();
};

// Aplicar middleware común a todas las rutas
router.use(requireAuth, requireAlmacenRole, requireSistema);

// ========================================
// RUTAS PRINCIPALES
// ========================================

// Crear vale de entrada
router.get('/create', EntryTicketController.showCreateForm);
router.post('/create', EntryTicketController.createValeEntrada);
router.get('/success', EntryTicketController.showSuccess);

// Historial
router.get('/history', EntryTicketHistoryController.showHistory);
router.get('/details/:id', EntryTicketHistoryController.showValeDetails);

// ========================================
// APIs PARA BÚSQUEDAS Y AUTOCOMPLETADO
// ========================================

router.get('/api/search-proveedores', EntryTicketController.searchProveedores);
router.get('/api/repartidores/:id_proveedor', EntryTicketController.getRepartidores);
router.get('/api/search-productos', EntryTicketController.searchProductos);
router.get('/api/search-similar-productos-genericos', EntryTicketController.searchSimilarProductosGenericos);
router.get('/api/search-productos-genericos', EntryTicketController.searchProductosGenericos);
router.get('/api/search/requisiciones', EntryTicketController.searchRequisiciones);

// ========================================
// APIs PARA CREAR NUEVOS REGISTROS
// ========================================

router.post('/api/create-proveedor', EntryTicketController.createProveedor);
router.post('/api/create-repartidor', EntryTicketController.createRepartidor);
router.post('/api/create-producto-generico', EntryTicketController.createProductoGenerico);
router.post('/api/create-producto', EntryTicketController.createProducto);

// ========================================
// APIs PARA HISTORIAL
// ========================================

router.get('/api/history/load-more', EntryTicketHistoryController.loadMoreVales);
router.get('/api/history/statistics', EntryTicketHistoryController.getStatistics);

module.exports = router;*/