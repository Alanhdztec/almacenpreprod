const express = require('express');
const router = express.Router();
const ArchivosValeEntradaController = require('../controllers/archivosValeEntradaController');
const { subirArchivos, manejarErroresSubida, validarValeExiste } = require('../middleware/subirArchivos');
const { requireAuth, requireAlmacen } = require('../middleware/auth');
const { requireSistema, getCurrentSystem } = require('../middleware/system');

// Middleware común: autenticación + rol almacén + sistema activo
router.use(requireAuth, requireAlmacen, requireSistema, getCurrentSystem);

// Ruta principal para mostrar la página de gestión de archivos
router.get('/vale/:idVale', validarValeExiste, ArchivosValeEntradaController.mostrarArchivos);

// Ruta para subir archivos (máximo 5 archivos por vez)
router.post('/vale/:idVale/subir', 
    validarValeExiste,
    subirArchivos.array('archivos', 5),
    manejarErroresSubida,
    ArchivosValeEntradaController.subirArchivos
);

// Ruta para obtener lista de archivos (AJAX)
router.get('/vale/:idVale/lista', validarValeExiste, ArchivosValeEntradaController.obtenerListaArchivos);

// Ruta para eliminar un archivo específico
router.delete('/archivo/:idArchivo', ArchivosValeEntradaController.eliminarArchivo);

// Ruta para descargar un archivo
router.get('/archivo/:idArchivo/descargar', ArchivosValeEntradaController.descargarArchivo);

// Ruta para visualizar un archivo (abrir en navegador)
router.get('/archivo/:idArchivo/ver', ArchivosValeEntradaController.visualizarArchivo);

// Ruta para obtener información básica de archivos de un vale (para botones en otras vistas)
router.get('/vale/:idVale/info', validarValeExiste, ArchivosValeEntradaController.obtenerInfoArchivos);

// Ruta de mantenimiento para limpiar archivos huérfanos (solo para administradores)
router.post('/mantenimiento/limpiar', (req, res, next) => {
    // Verificar que el usuario sea administrador
    if (!req.session.usuario || req.session.usuario.rol !== 'Administrador') {
        return res.status(403).json({
            exito: false,
            mensaje: 'Acceso denegado. Solo administradores pueden realizar esta acción.'
        });
    }
    next();
}, ArchivosValeEntradaController.limpiarArchivosHuerfanos);

module.exports = router;