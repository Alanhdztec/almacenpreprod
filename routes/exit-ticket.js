// ========================================
// ROUTES/EXIT-TICKET.JS
// ========================================

const express = require('express');
const router = express.Router();
const ExitTicketController = require('../controllers/adm/exitTicketController');
const ExitTicketHistoryController = require('../controllers/adm/exitTicketHistoryController');

const { requireAuth } = require('../middleware/auth');
const { requireSistema } = require('../middleware/system'); // Nuevo middleware de sistema

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

// Aplicar middleware de sistema a todas las rutas
router.use(requireAuth, requireAlmacenRole, requireSistema);

// Rutas principales
router.get('/create', ExitTicketController.showCreateForm);
router.post('/create', ExitTicketController.createValeSalida);
router.get('/success', ExitTicketController.showSuccess);

// Rutas de historial (también requieren sistema)
router.get('/history', ExitTicketHistoryController.showHistory);
router.get('/details/:id', ExitTicketHistoryController.showValeDetails);
router.get('/api/history/load-more', ExitTicketHistoryController.loadMoreVales);
router.get('/api/history/statistics', ExitTicketHistoryController.getStatistics);

router.get('/api/history/export', ExitTicketHistoryController.exportHistory);

// APIs para búsquedas
router.get('/api/search/productos', ExitTicketController.searchProductos);
router.get('/api/search/proveedores', ExitTicketController.searchProveedores);


module.exports = router;