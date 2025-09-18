// ========================================
// ROUTES/OFICIALIA/ACCIONES-INVENTARIO.JS - RUTAS PARA ACCIONES DE INVENTARIO
// ========================================

const express = require('express');
const router = express.Router();
const AccionesInventarioController = require('../../controllers/oficialia/accionesInventarioOficialiaController');
const { requireAuth } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/system');
const { requireJefeAlmacen } = require('../../middleware/jefeAlmacen');

// Todas las rutas requieren autenticación, sistema y rol de jefe de almacén
router.use(requireAuth);
router.use(requireSistema);
router.use(requireJefeAlmacen);

// Ruta principal - Panel de acciones de inventario
router.get('/', AccionesInventarioController.showAccionesInventario);

// API para obtener estadísticas en tiempo real
router.get('/api/estadisticas', AccionesInventarioController.getEstadisticasAPI);

// Productos con existencias negativas
router.get('/productos-criticos', AccionesInventarioController.showProductosCriticos);

// Rutas para futuras funcionalidades (por implementar)
router.get('/ajustar-existencias', (req, res) => {
  res.render('error', {
    title: 'Funcionalidad en Desarrollo',
    message: 'Esta funcionalidad estará disponible próximamente.',
    user: req.session.user
  });
});

router.get('/transferir-stock', (req, res) => {
  res.render('error', {
    title: 'Funcionalidad en Desarrollo',
    message: 'Esta funcionalidad estará disponible próximamente.',
    user: req.session.user
  });
});

router.get('/reportes', (req, res) => {
  res.render('error', {
    title: 'Funcionalidad en Desarrollo',
    message: 'Esta funcionalidad estará disponible próximamente.',
    user: req.session.user
  });
});

router.get('/auditoria', (req, res) => {
  res.render('error', {
    title: 'Funcionalidad en Desarrollo',
    message: 'Esta funcionalidad estará disponible próximamente.',
    user: req.session.user
  });
});

router.get('/configuracion', (req, res) => {
  res.render('error', {
    title: 'Funcionalidad en Desarrollo',
    message: 'Esta funcionalidad estará disponible próximamente.',
    user: req.session.user
  });
});

module.exports = router;