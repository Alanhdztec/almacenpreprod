// ========================================
// ROUTES/GENERAL/STOCK-CONFIG-ROUTES.JS - RUTAS PARA CONFIGURACIÓN DE STOCK
// ========================================

const express = require('express');
const router = express.Router();
const StockConfigController = require('../../controllers/general/stockConfigController');
const { requireAuth } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/system');
const { requireJefeAlmacen } = require('../../middleware/jefeAlmacen');

// Middleware: todas las rutas requieren autenticación y rol de jefe de almacén
router.use(requireAuth);
router.use(requireSistema);
router.use(requireJefeAlmacen);


// ========================================
// RUTAS PRINCIPALES
// ========================================

// GET: Mostrar página de configuración de stock
router.get('/', StockConfigController.showStockConfig);

// ========================================
// API ENDPOINTS
// ========================================

// PUT: Actualizar stock de un producto específico
router.put('/api/producto/:id', StockConfigController.updateStock);

// PUT: Actualización masiva de stock
router.put('/api/masivo', StockConfigController.updateMassiveStock);

// GET: Obtener datos de un producto específico
router.get('/api/producto/:id', StockConfigController.getProducto);

// GET: Obtener estadísticas de configuración de stock
router.get('/api/estadisticas', async (req, res) => {
  try {
    const estadisticas = await StockConfigController.getEstadisticasStock();
    res.json({
      success: true,
      estadisticas: estadisticas
    });
  } catch (error) {
    console.error('Error al obtener estadísticas API:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas'
    });
  }
});

module.exports = router;