// ========================================
// MIDDLEWARE/JEFEALMACEN.JS - VERIFICAR ROL DE JEFE DE ALMACÉN
// ========================================

const requireJefeAlmacen = (req, res, next) => {
  // Verificar que el usuario esté autenticado
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }

  // Verificar que el usuario tenga el rol de jefe_almacen
  if (req.session.user.rol !== 'Jefe_almacen') {
    return res.status(403).render('error', {
      title: 'Acceso Denegado',
      message: 'No tienes permisos para acceder a esta sección. Solo el Jefe de Almacén puede realizar estas acciones.',
      user: req.session.user
    });
  }

  next();
};

module.exports = {
  requireJefeAlmacen
};