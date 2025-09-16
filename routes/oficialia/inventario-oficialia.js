// ========================================
// ROUTES/INVENTORY-OFICIALIA.JS - RUTAS PARA OFICIALÍA
// ========================================

const express = require('express');
const router = express.Router();
const InventoryOficialiaController = require('../../controllers/oficialia/inventarioOficialiaController');
const { requireAuth } = require('../../middleware/auth');
const { requireSistema } = require('../../middleware/system');

// Rutas del inventario de oficialía (sin restricción de sistema para flexibilidad)
router.get('/', requireAuth, requireSistema, InventoryOficialiaController.showOficialiaInventory);
router.get('/api/products', requireAuth, requireSistema, InventoryOficialiaController.loadMoreOficialiaProducts);
router.get('/product/:id', requireAuth, requireSistema, InventoryOficialiaController.showOficialiaProductDetails);
router.get('/api/statistics/:id', requireAuth, requireSistema, InventoryOficialiaController.getOficialiaProductStatistics);
router.post('/search', requireAuth, requireSistema, InventoryOficialiaController.searchOficialiaInventory);

module.exports = router;