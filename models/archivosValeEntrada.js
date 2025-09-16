const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

class ArchivosValeEntrada {
    
    // Crear directorio si no existe
    static crearDirectorio(rutaDirectorio) {
        if (!fs.existsSync(rutaDirectorio)) {
            fs.mkdirSync(rutaDirectorio, { recursive: true });
        }
    }
    
    // Obtener todos los archivos de un vale de entrada (solo no borrados)
    static async obtenerArchivosPorVale(idVale) {
        try {
            const consulta = `
                SELECT 
                    id_vale_de_entrada_archivos,
                    url,
                    id_vale_de_entrada,
                    EXTRACT(EPOCH FROM NOW()) * 1000 as timestamp_actual
                FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada = $1 AND esta_borrado = false
                ORDER BY id_vale_de_entrada_archivos DESC
            `;
            
            const resultado = await pool.query(consulta, [idVale]);
            
            // Agregar información adicional a cada archivo
            const archivosConInfo = resultado.rows.map(archivo => {
                // Limpiar la URL: quitar /public/ si está al inicio
                let urlLimpia = archivo.url;
                if (urlLimpia.startsWith('/public/')) {
                    urlLimpia = urlLimpia.replace('/public/', '/');
                }
                
                const rutaCompleta = path.join(__dirname, '..', 'public', urlLimpia);
                const nombreArchivo = path.basename(archivo.url);
                const extension = path.extname(archivo.url).toLowerCase();
                
                return {
                    ...archivo,
                    nombre_archivo: nombreArchivo,
                    extension: extension,
                    ruta_completa: rutaCompleta,
                    url_publica: urlLimpia.startsWith('/') ? urlLimpia : '/' + urlLimpia,
                    existe: fs.existsSync(rutaCompleta)
                };
            });
            
            return archivosConInfo;
        } catch (error) {
            console.error('Error al obtener archivos del vale:', error);
            throw error;
        }
    }
    
    // Guardar un nuevo archivo
    static async guardarArchivo(idVale, rutaArchivo) {
        try {
            // Convertir ruta absoluta a relativa desde public
            const rutaRelativa = rutaArchivo.replace(path.join(__dirname, '..', 'public'), '').replace(/\\/g, '/');
            const urlFinal = rutaRelativa.startsWith('/') ? rutaRelativa : '/' + rutaRelativa;
            
            const consulta = `
                INSERT INTO vales_de_entrada_archivos (url, id_vale_de_entrada, esta_borrado) 
                VALUES ($1, $2, false) 
                RETURNING *
            `;
            
            const resultado = await pool.query(consulta, [urlFinal, idVale]);
            return resultado.rows[0];
        } catch (error) {
            console.error('Error al guardar archivo en BD:', error);
            throw error;
        }
    }
    
    // Eliminar un archivo (BORRADO LÓGICO + MOVER A CARPETA GLOBAL BORRADOS)
    static async eliminarArchivo(idArchivo) {
        try {
            // Verificar que el archivo existe y no está borrado
            const consultaVerificar = `
                SELECT * FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada_archivos = $1 AND esta_borrado = false
            `;
            
            const resultadoVerificar = await pool.query(consultaVerificar, [idArchivo]);
            
            if (resultadoVerificar.rows.length === 0) {
                throw new Error('Archivo no encontrado o ya está eliminado');
            }
            
            const archivo = resultadoVerificar.rows[0];
            
            // Construir rutas de origen y destino
            let urlLimpia = archivo.url;
            if (urlLimpia.startsWith('/public/')) {
                urlLimpia = urlLimpia.replace('/public/', '/');
            }
            
            const rutaOrigenCompleta = path.join(__dirname, '..', 'public', urlLimpia);
            const nombreArchivo = path.basename(archivo.url);
            
            // Crear carpeta global de borrados
            const carpetaBorrados = path.join(
                __dirname, 
                '..', 
                'public', 
                'uploads', 
                'borrados'
            );
            
            this.crearDirectorio(carpetaBorrados);
            
            // Generar nombre único para evitar duplicados entre vales
            const timestamp = Date.now();
            const extension = path.extname(nombreArchivo);
            const nombreSinExtension = path.basename(nombreArchivo, extension);
            const nombreUnico = `vale${archivo.id_vale_de_entrada}_${timestamp}_${nombreSinExtension}${extension}`;
            
            // Ruta de destino en carpeta global borrados
            const rutaDestinoCompleta = path.join(carpetaBorrados, nombreUnico);
            
            // Mover archivo físico si existe
            if (fs.existsSync(rutaOrigenCompleta)) {
                try {
                    // Mover archivo con nombre único
                    fs.renameSync(rutaOrigenCompleta, rutaDestinoCompleta);
                    console.log(`Archivo movido a: ${rutaDestinoCompleta}`);
                } catch (errorMover) {
                    console.error('Error al mover archivo físico:', errorMover);
                    // Continúa con el borrado lógico aunque falle el movimiento físico
                }
            }
            
            // Marcar como borrado (borrado lógico)
            const consultaEliminar = `
                UPDATE vales_de_entrada_archivos 
                SET esta_borrado = true 
                WHERE id_vale_de_entrada_archivos = $1 
                RETURNING *
            `;
            
            const resultadoEliminar = await pool.query(consultaEliminar, [idArchivo]);
            
            return resultadoEliminar.rows[0];
        } catch (error) {
            console.error('Error al eliminar archivo:', error);
            throw error;
        }
    }
    
    // Verificar si un vale tiene archivos (solo no borrados)
    static async tieneArchivos(idVale) {
        try {
            const consulta = `
                SELECT COUNT(*) as total 
                FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada = $1 AND esta_borrado = false
            `;
            
            const resultado = await pool.query(consulta, [idVale]);
            return parseInt(resultado.rows[0].total) > 0;
        } catch (error) {
            console.error('Error al verificar archivos:', error);
            throw error;
        }
    }
    
    // Contar archivos de un vale (solo no borrados)
    static async contarArchivos(idVale) {
        try {
            const consulta = `
                SELECT COUNT(*) as total 
                FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada = $1 AND esta_borrado = false
            `;
            
            const resultado = await pool.query(consulta, [idVale]);
            return parseInt(resultado.rows[0].total);
        } catch (error) {
            console.error('Error al contar archivos:', error);
            throw error;
        }
    }
    
    // Obtener información de un archivo específico (solo si no está borrado)
    static async obtenerArchivoPorId(idArchivo) {
        try {
            const consulta = `
                SELECT 
                    vea.*,
                    ve.numero_de_factura,
                    ve.id_vale_de_entrada
                FROM vales_de_entrada_archivos vea
                INNER JOIN vales_de_entrada ve ON vea.id_vale_de_entrada = ve.id_vale_de_entrada
                WHERE vea.id_vale_de_entrada_archivos = $1 AND vea.esta_borrado = false
            `;
            
            const resultado = await pool.query(consulta, [idArchivo]);
            
            if (resultado.rows.length === 0) {
                return null;
            }
            
            const archivo = resultado.rows[0];
            
            // Limpiar la URL: quitar /public/ si está al inicio
            let urlLimpia = archivo.url;
            if (urlLimpia.startsWith('/public/')) {
                urlLimpia = urlLimpia.replace('/public/', '/');
            }
            
            const rutaCompleta = path.join(__dirname, '..', 'public', urlLimpia);
            
            return {
                ...archivo,
                nombre_archivo: path.basename(archivo.url),
                extension: path.extname(archivo.url).toLowerCase(),
                ruta_completa: rutaCompleta,
                existe: fs.existsSync(rutaCompleta)
            };
        } catch (error) {
            console.error('Error al obtener archivo por ID:', error);
            throw error;
        }
    }
    
    // Restaurar un archivo eliminado (MOVER DE VUELTA DESDE CARPETA GLOBAL BORRADOS)
    static async restaurarArchivo(idArchivo) {
        try {
            // Verificar que el archivo existe y está borrado
            const consultaVerificar = `
                SELECT * FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada_archivos = $1 AND esta_borrado = true
            `;
            
            const resultadoVerificar = await pool.query(consultaVerificar, [idArchivo]);
            
            if (resultadoVerificar.rows.length === 0) {
                throw new Error('Archivo no encontrado o no está eliminado');
            }
            
            const archivo = resultadoVerificar.rows[0];
            const nombreArchivoOriginal = path.basename(archivo.url);
            
            // Buscar archivo en carpeta global borrados (con patrón vale{id}_timestamp_nombre)
            const carpetaBorrados = path.join(
                __dirname, 
                '..', 
                'public', 
                'uploads', 
                'borrados'
            );
            
            let archivoEncontrado = null;
            if (fs.existsSync(carpetaBorrados)) {
                const archivosEnBorrados = fs.readdirSync(carpetaBorrados);
                // Buscar archivo que contenga el patrón vale{id}_ y termine con el nombre original
                const patron = `vale${archivo.id_vale_de_entrada}_`;
                archivoEncontrado = archivosEnBorrados.find(nombreArchivo => 
                    nombreArchivo.startsWith(patron) && 
                    nombreArchivo.endsWith(nombreArchivoOriginal.replace(/[^a-zA-Z0-9.]/g, '_'))
                );
            }
            
            if (archivoEncontrado) {
                const rutaOrigenBorrados = path.join(carpetaBorrados, archivoEncontrado);
                
                let urlLimpia = archivo.url;
                if (urlLimpia.startsWith('/public/')) {
                    urlLimpia = urlLimpia.replace('/public/', '/');
                }
                const rutaDestinoOriginal = path.join(__dirname, '..', 'public', urlLimpia);
                
                try {
                    // Crear directorio de destino si no existe
                    const directorioDestino = path.dirname(rutaDestinoOriginal);
                    this.crearDirectorio(directorioDestino);
                    
                    fs.renameSync(rutaOrigenBorrados, rutaDestinoOriginal);
                    console.log(`Archivo restaurado desde: ${rutaOrigenBorrados}`);
                } catch (errorMover) {
                    console.error('Error al restaurar archivo físico:', errorMover);
                }
            }
            
            // Marcar como no borrado
            const consulta = `
                UPDATE vales_de_entrada_archivos 
                SET esta_borrado = false 
                WHERE id_vale_de_entrada_archivos = $1
                RETURNING *
            `;
            
            const resultado = await pool.query(consulta, [idArchivo]);
            return resultado.rows[0];
        } catch (error) {
            console.error('Error al restaurar archivo:', error);
            throw error;
        }
    }
    
    // Obtener archivos eliminados (para auditoría)
    static async obtenerArchivosEliminados(idVale) {
        try {
            const consulta = `
                SELECT 
                    id_vale_de_entrada_archivos,
                    url,
                    id_vale_de_entrada,
                    EXTRACT(EPOCH FROM NOW()) * 1000 as timestamp_actual
                FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada = $1 AND esta_borrado = true
                ORDER BY id_vale_de_entrada_archivos DESC
            `;
            
            const resultado = await pool.query(consulta, [idVale]);
            
            return resultado.rows.map(archivo => {
                const nombreArchivoOriginal = path.basename(archivo.url);
                
                // Buscar en carpeta global borrados
                const carpetaBorrados = path.join(
                    __dirname, 
                    '..', 
                    'public', 
                    'uploads', 
                    'borrados'
                );
                
                let existeEnBorrados = false;
                let rutaBorrados = null;
                
                if (fs.existsSync(carpetaBorrados)) {
                    const archivosEnBorrados = fs.readdirSync(carpetaBorrados);
                    const patron = `vale${archivo.id_vale_de_entrada}_`;
                    const archivoEncontrado = archivosEnBorrados.find(nombreArchivo => 
                        nombreArchivo.startsWith(patron) && 
                        nombreArchivo.includes(nombreArchivoOriginal.replace(/[^a-zA-Z0-9.]/g, '_'))
                    );
                    
                    if (archivoEncontrado) {
                        existeEnBorrados = true;
                        rutaBorrados = path.join(carpetaBorrados, archivoEncontrado);
                    }
                }
                
                return {
                    ...archivo,
                    nombre_archivo: nombreArchivoOriginal,
                    extension: path.extname(archivo.url).toLowerCase(),
                    existe_en_borrados: existeEnBorrados,
                    ruta_borrados: rutaBorrados
                };
            });
        } catch (error) {
            console.error('Error al obtener archivos eliminados:', error);
            throw error;
        }
    }
    
    // Eliminar permanentemente archivos (BORRADO FÍSICO DEFINITIVO)
    static async eliminarPermanentemente(idArchivo) {
        try {
            // Obtener información del archivo
            const consultaObtener = `
                SELECT * FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada_archivos = $1
            `;
            
            const resultadoObtener = await pool.query(consultaObtener, [idArchivo]);
            
            if (resultadoObtener.rows.length === 0) {
                throw new Error('Archivo no encontrado');
            }
            
            const archivo = resultadoObtener.rows[0];
            const nombreArchivoOriginal = path.basename(archivo.url);
            
            // Eliminar de carpeta global borrados si existe
            const carpetaBorrados = path.join(
                __dirname, 
                '..', 
                'public', 
                'uploads', 
                'borrados'
            );
            
            if (fs.existsSync(carpetaBorrados)) {
                const archivosEnBorrados = fs.readdirSync(carpetaBorrados);
                const patron = `vale${archivo.id_vale_de_entrada}_`;
                const archivoEncontrado = archivosEnBorrados.find(nombreArchivo => 
                    nombreArchivo.startsWith(patron) && 
                    nombreArchivo.includes(nombreArchivoOriginal.replace(/[^a-zA-Z0-9.]/g, '_'))
                );
                
                if (archivoEncontrado) {
                    const rutaBorrados = path.join(carpetaBorrados, archivoEncontrado);
                    fs.unlinkSync(rutaBorrados);
                }
            }
            
            // También eliminar de ubicación original por si acaso
            let urlLimpia = archivo.url;
            if (urlLimpia.startsWith('/public/')) {
                urlLimpia = urlLimpia.replace('/public/', '/');
            }
            const rutaOriginal = path.join(__dirname, '..', 'public', urlLimpia);
            
            if (fs.existsSync(rutaOriginal)) {
                fs.unlinkSync(rutaOriginal);
            }
            
            // Eliminar completamente de la base de datos
            const consultaEliminar = `
                DELETE FROM vales_de_entrada_archivos 
                WHERE id_vale_de_entrada_archivos = $1 
                RETURNING *
            `;
            
            const resultadoEliminar = await pool.query(consultaEliminar, [idArchivo]);
            return resultadoEliminar.rows[0];
        } catch (error) {
            console.error('Error al eliminar permanentemente:', error);
            throw error;
        }
    }
    
    // Limpiar archivos huérfanos
    static async limpiarArchivosHuerfanos() {
        try {
            const consulta = `SELECT * FROM vales_de_entrada_archivos`;
            const resultado = await pool.query(consulta);
            
            const archivosEliminados = [];
            
            for (const archivo of resultado.rows) {
                let urlLimpia = archivo.url;
                if (urlLimpia.startsWith('/public/')) {
                    urlLimpia = urlLimpia.replace('/public/', '/');
                }
                
                const rutaOriginal = path.join(__dirname, '..', 'public', urlLimpia);
                const nombreArchivoOriginal = path.basename(archivo.url);
                
                // Buscar en carpeta global borrados
                const carpetaBorrados = path.join(
                    __dirname, 
                    '..', 
                    'public', 
                    'uploads', 
                    'borrados'
                );
                
                let existeEnBorrados = false;
                if (fs.existsSync(carpetaBorrados)) {
                    const archivosEnBorrados = fs.readdirSync(carpetaBorrados);
                    const patron = `vale${archivo.id_vale_de_entrada}_`;
                    const archivoEncontrado = archivosEnBorrados.find(nombreArchivo => 
                        nombreArchivo.startsWith(patron) && 
                        nombreArchivo.includes(nombreArchivoOriginal.replace(/[^a-zA-Z0-9.]/g, '_'))
                    );
                    existeEnBorrados = !!archivoEncontrado;
                }
                
                // Si no existe ni en original ni en borrados, eliminar de BD
                if (!fs.existsSync(rutaOriginal) && !existeEnBorrados) {
                    await pool.query(
                        'DELETE FROM vales_de_entrada_archivos WHERE id_vale_de_entrada_archivos = $1',
                        [archivo.id_vale_de_entrada_archivos]
                    );
                    archivosEliminados.push({
                        ...archivo,
                        razon: 'Archivo físico no encontrado en ninguna ubicación'
                    });
                }
            }
            
            return archivosEliminados;
        } catch (error) {
            console.error('Error al limpiar archivos huérfanos:', error);
            throw error;
        }
    }
}

module.exports = ArchivosValeEntrada;