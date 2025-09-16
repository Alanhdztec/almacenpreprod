// ========================================
// MIDDLEWARE/AUTH.JS - SIN IMPORTACIÓN CIRCULAR
// ========================================

const requireAuth = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  } else {
    return res.redirect('/auth/login?error=Debes iniciar sesión para acceder');
  }
};

// ✅ MIDDLEWARE CORREGIDO - Lógica de redirección DIRECTA (sin importar AuthController)
const redirectIfAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    const user = req.session.user;
    const sistemaActivo = req.cookies.sistema_activo || 'GENERAL';
    
    console.log(`🔄 redirectIfAuthenticated - Usuario: ${user.usuario}, Rol: ${user.rol}, Sistema: ${sistemaActivo}`);

    // ✅ LÓGICA DE REDIRECCIÓN DIRECTA (copiada del AuthController)
    switch (user.rol) {
      case 'almacen':
      case 'Jefe_almacen':
        // REDIRECCIÓN AUTOMÁTICA SEGÚN EL SISTEMA
        if (sistemaActivo === 'OFICIALIA') {
          console.log('🔄 Redirigiendo a: /inventario/oficialia');
          return res.redirect('/inventario/oficialia');
        } else {
          console.log('🔄 Redirigiendo a: /inventario/general');
          return res.redirect('/inventario/general');
        }
        
      case 'Administrador':
        // Los administradores van a la vista combinada
        console.log('🔄 Redirigiendo a: /inventario');
        return res.redirect('/inventario');
        
      case 'Financieros':
      default:
        console.log('🔄 Redirigiendo a: /dashboard');
        return res.redirect('/dashboard');
    }
  }
  next();
};

// Middleware de autorización por roles
const requireRole = (rolesPermitidos) => {
  return (req, res, next) => {
    const user = req.session.user;
    
    if (!user) {
      return res.redirect('/auth/login?error=Debes iniciar sesión para acceder');
    }
    
    // Convertir a array si es un string
    const roles = Array.isArray(rolesPermitidos) ? rolesPermitidos : [rolesPermitidos];
    
    if (!roles.includes(user.rol)) {
      return res.status(403).render('error', {
        title: 'Acceso Denegado',
        message: `No tiene permisos para acceder a esta sección. Su rol actual: ${user.rol}. Rol(es) requerido(s): ${roles.join(' o ')}`
      });
    }
    
    next();
  };
};

// Middleware específicos para cada tipo de inventario
const requireAdmin = requireRole(['Administrador']);
const requireAlmacen = requireRole(['almacen', 'Jefe_almacen']);
const requireAlmacenOrAdmin = requireRole(['almacen', 'Jefe_almacen', 'Administrador']);
const requireFinancieros = requireRole(['Financieros', 'Administrador']);

module.exports = {
  requireAuth,
  redirectIfAuthenticated,
  requireRole,
  requireAdmin,
  requireAlmacen, 
  requireAlmacenOrAdmin,
  requireFinancieros
};