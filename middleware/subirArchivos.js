const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Crear directorio si no existe
const crearDirectorio = (rutaDirectorio) => {
    if (!fs.existsSync(rutaDirectorio)) {
        fs.mkdirSync(rutaDirectorio, { recursive: true });
    }
};

// Configuración de almacenamiento
const almacenamiento = multer.diskStorage({
    destination: function (req, file, cb) {
        const rutaBase = 'public/uploads/facturas-vales-entrada';
        const idVale = req.params.idVale || req.body.idVale;
        const rutaCompleta = path.join(rutaBase, `vale-${idVale}`);
        
        crearDirectorio(rutaCompleta);
        cb(null, rutaCompleta);
    },
    filename: function (req, file, cb) {
        // Generar nombre único con timestamp
        const timestamp = Date.now();
        const extension = path.extname(file.originalname);
        const nombreSinExtension = path.basename(file.originalname, extension);
        const nombreLimpio = nombreSinExtension.replace(/[^a-zA-Z0-9]/g, '_');
        
        const nombreFinal = `${timestamp}_${nombreLimpio}${extension}`;
        cb(null, nombreFinal);
    }
});

// Filtro de archivos permitidos (CORREGIDO)
const filtroArchivos = (req, file, cb) => {
    // Extensiones permitidas
    const extensionesPermitidas = ['.jpg', '.jpeg', '.png', '.pdf', '.doc', '.docx'];
    
    // Mimetypes permitidos
    const mimetypesPermitidos = [
        'image/jpeg',
        'image/jpg', 
        'image/png',
        'application/pdf',
        'application/msword',                                                           // .doc
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'     // .docx
    ];
    
    const extension = path.extname(file.originalname).toLowerCase();
    const mimetype = file.mimetype;
    
    // Validar extensión
    const extensionValida = extensionesPermitidas.includes(extension);
    
    // Validar mimetype
    const mimetypeValido = mimetypesPermitidos.includes(mimetype);
    
    if (extensionValida && mimetypeValido) {
        return cb(null, true);
    } else {
        // Mensaje de error más específico
        let razonRechazo = '';
        if (!extensionValida) {
            razonRechazo += `Extensión no permitida: ${extension}. `;
        }
        if (!mimetypeValido) {
            razonRechazo += `Tipo MIME no permitido: ${mimetype}. `;
        }
        razonRechazo += 'Solo se permiten: PDF, DOC, DOCX, PNG, JPG';
        
        cb(new Error(razonRechazo));
    }
};

// Configuración de multer
const subirArchivos = multer({
    storage: almacenamiento,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB 
    },
    fileFilter: filtroArchivos
});

// Middleware para manejar errores de multer
const manejarErroresSubida = (error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        switch (error.code) {
            case 'LIMIT_FILE_SIZE':
                return res.status(400).json({
                    exito: false,
                    mensaje: 'El archivo es demasiado grande. Tamaño máximo: 10MB'
                });
            case 'LIMIT_FILE_COUNT':
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Demasiados archivos por vez'
                });
            case 'LIMIT_UNEXPECTED_FILE':
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Campo de archivo inesperado'
                });
            default:
                return res.status(400).json({
                    exito: false,
                    mensaje: 'Error al subir archivo: ' + error.message
                });
        }
    } else if (error) {
        return res.status(400).json({
            exito: false,
            mensaje: error.message
        });
    }
    next();
};

// Middleware para validar que el vale existe y pertenece al sistema activo
const validarValeExiste = async (req, res, next) => {
    try {
        const pool = require('../config/database');
        const idVale = req.params.idVale || req.body.idVale;
        const sistemaActivo = req.cookies.sistema_activo;
        
        if (!idVale) {
            return res.status(400).json({
                exito: false,
                mensaje: 'ID del vale es requerido'
            });
        }

        if (!sistemaActivo) {
            return res.status(401).json({
                exito: false,
                mensaje: 'Sistema no identificado'
            });
        }

        // Consulta que incluye verificación del sistema (es_oficialia)
        const esOficialia = sistemaActivo === 'OFICIALIA';
        
        const resultado = await pool.query(
            'SELECT id_vale_de_entrada FROM vales_de_entrada WHERE id_vale_de_entrada = $1 AND esta_borrado = false AND es_oficialia = $2',
            [idVale, esOficialia]
        );

        if (resultado.rows.length === 0) {
            return res.status(404).json({
                exito: false,
                mensaje: 'Vale de entrada no encontrado o no pertenece a este sistema'
            });
        }

        // Agregar información del sistema al request
        req.sistemaVale = {
            es_oficialia: esOficialia,
            sistema_id: sistemaActivo
        };

        next();
    } catch (error) {
        console.error('Error al validar vale:', error);
        res.status(500).json({
            exito: false,
            mensaje: 'Error interno del servidor'
        });
    }
};

module.exports = {
    subirArchivos,
    manejarErroresSubida,
    validarValeExiste
};