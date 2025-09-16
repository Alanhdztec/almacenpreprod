// ========================================
// ROUTES/INVENTARIOROUTE.JS - ACTUALIZADO CON RUTA DE BÚSQUEDA
// ========================================

const express = require('express');
const router = express.Router();
const InventoryController = require('../controllers/adm/inventarioController');
const { requireAuth } = require('../middleware/auth');

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

// Rutas del inventario
router.get('/', requireAuth, requireAlmacenRole, InventoryController.showInventory);
router.get('/api/products', requireAuth, requireAlmacenRole, InventoryController.loadMoreProducts);
router.get('/product/:id', requireAuth, requireAlmacenRole, InventoryController.showProductDetails);

// NUEVA: Ruta para búsqueda con filtros avanzados
router.get('/api/search', requireAuth, requireAlmacenRole, InventoryController.searchInventory);

// Nueva ruta para obtener estadísticas de un producto (opcional, para futuras actualizaciones AJAX)
router.get('/api/product/:id/statistics', requireAuth, requireAlmacenRole, InventoryController.getProductStatistics);

module.exports = router;