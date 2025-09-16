const ArchivosValeEntrada = require('../models/archivosValeEntrada');
const path = require('path');
const fs = require('fs');

class ArchivosValeEntradaController {
    
    // Mostrar página de gestión de archivos
    static async mostrarArchivos(req, res) {
        try {
            const idVale = req.params.idVale;
            const sistemaActivo = req.cookies.sistema_activo;
            const esOficialia = sistemaActivo === 'OFICIALIA';
            
            const archivos = await ArchivosValeEntrada.obtenerArchivosPorVale(idVale);
            
            // Obtener información básica del vale con filtro de sistema
            const pool = require('../config/database');
            const consultaVale = `
                SELECT 
                    ve.id_vale_de_entrada,
                    ve.numero_de_factura,
                    ve.fecha_de_entrada,
                    ve.es_oficialia,
                    p.proveedor,
                    req.requisicion_de_entrada
                FROM vales_de_entrada ve
                LEFT JOIN proveedores p ON ve.id_proveedor = p.id_proveedor
                LEFT JOIN requisiciones_de_entrada req ON ve.id_requisicion_de_entrada = req.id_requisicion_de_entrada
                WHERE ve.id_vale_de_entrada = $1 AND ve.esta_borrado = false AND ve.es_oficialia = $2
            `;
            
            const resultadoVale = await pool.query(consultaVale, [idVale, esOficialia]);
            
            if (resultadoVale.rows.length === 0) {
                return res.status(404).render('error', {
                    mensaje: 'Vale de entrada no encontrado o no pertenece a este sistema'
                });
            }
            
            const vale = resultadoVale.rows[0];
            
            res.render('entry-ticket/archivos', {
                titulo: `Gestión de Archivos - ${sistemaActivo === 'OFICIALIA' ? 'Oficialía' : 'General'}`,
                vale: vale,
                archivos: archivos,
                usuario: req.session.usuario,
                sistemaActual: req.sistemaActual,
                sistemaActivo: req.cookies.sistema_activo 

            });
            
        } catch (error) {
            console.error('Error al mostrar archivos:', error);
            res.status(500).render('error', {
                mensaje: 'Error interno del servidor'
            });
        }
    }
    
    // Subir nuevos archivos (PDF, DOC, DOCX, PNG, JPG)
    static async subirArchivos(req, res) {
        try {
            const idVale = req.params.idVale;
            const archivos = req.files;
            
            if (!archivos || archivos.length === 0) {
                return res.status(400).json({
                    exito: false,
                    mensaje: 'No se enviaron archivos'
                });
            }
            
            const archivosGuardados = [];
            const archivosRechazados = [];
            const tiposPermitidos = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
            const tamañoMaximo = 10 * 1024 * 1024; // 10MB
            
            // Procesar cada archivo subido
            for (const archivo of archivos) {
                try {
                    // Verificar extensión
                    const extension = path.extname(archivo.originalname).toLowerCase();
                    if (!tiposPermitidos.includes(extension)) {
                        archivosRechazados.push({
                            nombre: archivo.originalname,
                            razon: 'Solo se permiten archivos PDF, DOC, DOCX, PNG y JPG'
                        });
                        
                        // Eliminar archivo físico
                        if (fs.existsSync(archivo.path)) {
                            fs.unlinkSync(archivo.path);
                        }
                        continue;
                    }
                    
                    // Verificar tamaño (10MB máximo)
                    if (archivo.size > tamañoMaximo) {
                        archivosRechazados.push({
                            nombre: archivo.originalname,
                            razon: 'El archivo excede el límite de 10MB'
                        });
                        
                        // Eliminar archivo físico
                        if (fs.existsSync(archivo.path)) {
                            fs.unlinkSync(archivo.path);
                        }
                        continue;
                    }
                    
                    const archivoGuardado = await ArchivosValeEntrada.guardarArchivo(
                        idVale,
                        archivo.path
                    );
                    
                    archivosGuardados.push({
                        id: archivoGuardado.id_vale_de_entrada_archivos,
                        nombre: archivo.filename,
                        tamaño: archivo.size,
                        url: archivoGuardado.url
                    });
                } catch (error) {
                    console.error('Error al guardar archivo:', archivo.filename, error);
                    archivosRechazados.push({
                        nombre: archivo.originalname,
                        razon: 'Error al procesar el archivo'
                    });
                    
                    // Si falla al guardar en BD, eliminar archivo físico
                    if (fs.existsSync(archivo.path)) {
                        fs.unlinkSync(archivo.path);
                    }
                }
            }
            
            // Preparar mensaje de respuesta
            let mensaje = '';
            if (archivosGuardados.length > 0) {
                mensaje += `Se subieron ${archivosGuardados.length} archivo(s) correctamente`;
            }
            if (archivosRechazados.length > 0) {
                if (mensaje) mensaje += '. ';
                mensaje += `${archivosRechazados.length} archivo(s) fueron rechazados`;
            }
            
            res.json({
                exito: archivosGuardados.length > 0,
                mensaje: mensaje,
                archivos: archivosGuardados,
                rechazados: archivosRechazados
            });
            
        } catch (error) {
            console.error('Error al subir archivos:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
    
    // Obtener lista de archivos (AJAX)
    static async obtenerListaArchivos(req, res) {
        try {
            const idVale = req.params.idVale;
            const archivos = await ArchivosValeEntrada.obtenerArchivosPorVale(idVale);
            
            res.json({
                exito: true,
                archivos: archivos
            });
            
        } catch (error) {
            console.error('Error al obtener lista de archivos:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
    
    // Eliminar un archivo (borrado lógico)
    static async eliminarArchivo(req, res) {
        try {
            const idArchivo = req.params.idArchivo;
            
            const archivoEliminado = await ArchivosValeEntrada.eliminarArchivo(idArchivo);
            
            res.json({
                exito: true,
                mensaje: 'Archivo eliminado correctamente',
                archivo: archivoEliminado
            });
            
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            res.status(500).json({
                exito: false,
                mensaje: error.message || 'Error interno del servidor'
            });
        }
    }
    
    // Descargar un archivo
    static async descargarArchivo(req, res) {
        try {
            const idArchivo = req.params.idArchivo;
            const archivo = await ArchivosValeEntrada.obtenerArchivoPorId(idArchivo);
            
            if (!archivo) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'Archivo no encontrado'
                });
            }
            
            if (!archivo.existe) {
                return res.status(404).json({
                    exito: false,
                    mensaje: 'El archivo físico no existe en el servidor'
                });
            }
            
            // Configurar headers para descarga
            const nombreDescarga = `vale_${archivo.id_vale_de_entrada}_${archivo.nombre_archivo}`;
            
            res.download(archivo.ruta_completa, nombreDescarga, (error) => {
                if (error) {
                    console.error('Error al descargar archivo:', error);
                    if (!res.headersSent) {
                        res.status(500).json({
                            exito: false,
                            mensaje: 'Error al descargar el archivo'
                        });
                    }
                }
            });
            
        } catch (error) {
            console.error('Error al descargar archivo:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
    
    // Visualizar un archivo (solo para archivos que se pueden mostrar en navegador)
    static async visualizarArchivo(req, res) {
        try {
            const idArchivo = req.params.idArchivo;
            const archivo = await ArchivosValeEntrada.obtenerArchivoPorId(idArchivo);
            
            if (!archivo) {
                return res.status(404).render('error', {
                    mensaje: 'Archivo no encontrado'
                });
            }
            
            if (!archivo.existe) {
                return res.status(404).render('error', {
                    mensaje: 'El archivo físico no existe en el servidor'
                });
            }
            
            // Determinar tipo de contenido y si se puede visualizar
            let tipoContenido = 'application/octet-stream';
            let puedeVisualizar = false;
            
            switch (archivo.extension) {
                case '.pdf':
                    tipoContenido = 'application/pdf';
                    puedeVisualizar = true;
                    break;
                case '.jpg':
                case '.jpeg':
                    tipoContenido = 'image/jpeg';
                    puedeVisualizar = true;
                    break;
                case '.png':
                    tipoContenido = 'image/png';
                    puedeVisualizar = true;
                    break;
                case '.doc':
                case '.docx':
                    // Los archivos DOC/DOCX no se pueden visualizar directamente
                    puedeVisualizar = false;
                    break;
            }
            
            if (puedeVisualizar) {
                // Para archivos visualizables (PDF, JPG, PNG), mostrar directamente
                res.setHeader('Content-Type', tipoContenido);
                res.setHeader('Content-Disposition', 'inline');
                res.sendFile(archivo.ruta_completa);
            } else {
                // Para archivos no visualizables (DOC, DOCX), redirigir a descarga
                return res.redirect(`/archivos-vale-entrada/archivo/${idArchivo}/descargar`);
            }
            
        } catch (error) {
            console.error('Error al visualizar archivo:', error);
            res.status(500).render('error', {
                mensaje: 'Error interno del servidor'
            });
        }
    }
    
    // Obtener información de archivos para un vale (para usar en otras vistas)
    static async obtenerInfoArchivos(req, res) {
        try {
            const idVale = req.params.idVale;
            
            const tieneArchivos = await ArchivosValeEntrada.tieneArchivos(idVale);
            const totalArchivos = await ArchivosValeEntrada.contarArchivos(idVale);
            
            res.json({
                exito: true,
                tiene_archivos: tieneArchivos,
                total_archivos: totalArchivos
            });
            
        } catch (error) {
            console.error('Error al obtener información de archivos:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
    
    // Limpiar archivos huérfanos (función de mantenimiento)
    static async limpiarArchivosHuerfanos(req, res) {
        try {
            const archivosEliminados = await ArchivosValeEntrada.limpiarArchivosHuerfanos();
            
            res.json({
                exito: true,
                mensaje: `Se limpiaron ${archivosEliminados.length} archivos huérfanos`,
                archivos_eliminados: archivosEliminados
            });
            
        } catch (error) {
            console.error('Error al limpiar archivos huérfanos:', error);
            res.status(500).json({
                exito: false,
                mensaje: 'Error interno del servidor'
            });
        }
    }
}

module.exports = ArchivosValeEntradaController;