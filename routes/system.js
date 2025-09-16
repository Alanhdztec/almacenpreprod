// routes/system.js
const express = require('express');
const router = express.Router();
const systemController = require('../controllers/systemController');
const { requireAuth } = require('../middleware/auth'); // 

router.get('/seleccionar-sistema', requireAuth, systemController.showSystemSelection);
router.post('/seleccionar-sistema', requireAuth, systemController.setSystem);

module.exports = router;