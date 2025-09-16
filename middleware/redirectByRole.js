
// ========================================
// MIDDLEWARE/REDIRECTBYROLE.JS 
// ========================================

const redirectByRole = (req, res, next) => {
  const user = req.session.user;
  
  if (!user) {
    return res.redirect('/auth/login');
  }

  // Redirigir según el rol del usuario
  switch (user.rol) {
    case 'almacen':
    case 'Jefe_almacen':
      return res.redirect('/inventario');
    case 'Administrador':
    case 'Financieros':
    default:
      return res.redirect('/dashboard');
  }
};

module.exports = { redirectByRole };