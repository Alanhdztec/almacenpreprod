// ========================================
// ROUTES/INVENTORY-GENERAL.JS - RUTAS PARA ALMACÉN GENERAL
// ========================================

const express = require('express');
const router = express.Router();
const InventoryGeneralController = require('../../controllers/general/inventarioGeneralController');
const { requireAuth } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/system');

// Rutas del inventario general (sin restricción de sistema para flexibilidad)
router.get('/', requireAuth, requireSistema, InventoryGeneralController.showGeneralInventory);
router.get('/api/products', requireAuth, requireSistema, InventoryGeneralController.loadMoreGeneralProducts);
router.get('/product/:id', requireAuth, requireSistema, InventoryGeneralController.showGeneralProductDetails);
router.get('/api/statistics/:id', requireAuth, requireSistema, InventoryGeneralController.getGeneralProductStatistics);
router.post('/search', requireAuth, requireSistema, InventoryGeneralController.searchGeneralInventory);

module.exports = router;