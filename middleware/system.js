// ========================================
// MIDDLEWARE SYSTEM 
// ========================================

const { isSystemExpired, clearSystemCookies } = require('../controllers/systemController');

const requireSistema = (req, res, next) => {
  // Verificar si existe la cookie del sistema
  if (!req.cookies.sistema_activo) {
    req.session.destroy();
    return res.redirect('/auth/login'); 
  }
  
  // Verificar si el sistema ha expirado (verificación adicional)
  if (isSystemExpired(req)) {
    // Limpiar cookies expiradas
    clearSystemCookies(res);
    req.session.destroy();

    return res.redirect('/auth/login'); // Redirigir al login si expiró
  }
  
  next();
};

const checkSistemaPermission = (sistemasPermitidos) => {
  return (req, res, next) => {
    const sistemaActivo = req.cookies.sistema_activo;
    
    if (!sistemaActivo) {

      req.session.destroy();
      return res.redirect('/auth/login');
    }
    
    // Verificar expiración
    if (isSystemExpired(req)) {
      clearSystemCookies(res);
      req.session.destroy();
      return res.redirect('/auth/login');
    }
    
    if (!sistemasPermitidos.includes(sistemaActivo)) {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        mensaje: 'No tiene permisos para acceder a este sistema'
      });
    }
    
    next();
  };
};

// Middleware para refrescar cookies (extender tiempo)
const refreshSystemCookies = (req, res, next) => {
  const sistemaActivo = req.cookies.sistema_activo;
  const sistemaNombre = req.cookies.sistema_nombre;
  
  if (sistemaActivo && !isSystemExpired(req)) {
    // Refrescar cookies por otras 10 horas
    res.cookie('sistema_activo', sistemaActivo, {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    
    if (sistemaNombre) {
      res.cookie('sistema_nombre', sistemaNombre, {
        maxAge: 10 * 60 * 60 * 1000,
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });
    }
    
    res.cookie('sistema_inicio', Date.now(), {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
  }
  
  next();
};

// Middleware para obtener información del sistema actual
const getCurrentSystem = (req, res, next) => {
  req.sistemaActual = {
    id: req.cookies.sistema_activo || null,
    nombre: req.cookies.sistema_nombre || null,
    inicio: req.cookies.sistema_inicio || null
  };
  
  // También disponible en las vistas
  res.locals.sistemaActual = req.sistemaActual;
  
  next();
};

module.exports = {
  requireSistema,
  checkSistemaPermission,
  refreshSystemCookies,
  getCurrentSystem
};