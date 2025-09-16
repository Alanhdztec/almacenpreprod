// ========================================
// CONTROLLERS/AUTHCONTROLLER.JS - VERSIÓN MEJORADA
// ========================================

const User = require('../models/Usuario');
const { clearSystemCookies } = require('./systemController');

class AuthController {
  static showLogin(req, res) {
    // ✅ VERIFICACIÓN MEJORADA: Si ya está autenticado, redirigir apropiadamente
    if (req.session.user) {
      return AuthController.redirectByRole(req, res);
    }
    
    res.render('login', {
      title: 'Iniciar Sesión - Sistema de Almacén',
      error: req.query.error || null,
      defaultSistema: req.query.default || 'OFICIALIA' 
    });
  }

  static async login(req, res) {
    try {
      const { usuario, contraseña, sistema } = req.body;
      
      // Validar campos
      if (!usuario || !contraseña) {
        return res.redirect('/auth/login?error=Usuario y contraseña son requeridos');
      }

      // OFICIALÍA COMO PREDETERMINADO
      const sistemaSeleccionado = sistema || 'OFICIALIA';

      // Validar sistema
      if (sistemaSeleccionado !== 'GENERAL' && sistemaSeleccionado !== 'OFICIALIA') {
        return res.redirect('/auth/login?error=Sistema de almacén no válido');
      }

      // Buscar usuario
      const user = await User.findByCredentials(usuario, contraseña);
      if (!user) {
        return res.redirect('/auth/login?error=Usuario o contraseña incorrectos');
      }

      // Limpiar cookies anteriores
      res.clearCookie('sistema_activo');
      res.clearCookie('sistema_nombre');
      res.clearCookie('sistema_inicio');

      // Guardar usuario en sesión
      req.session.user = user;

      // Establecer sistema en cookies
      res.cookie('sistema_activo', sistemaSeleccionado, {
        maxAge: 10 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });

      const sistemaNombre = sistemaSeleccionado === 'GENERAL' ? 'Sistema General' : 'Sistema Oficialía';
      res.cookie('sistema_nombre', sistemaNombre, {
        maxAge: 10 * 60 * 60 * 1000,
        httpOnly: false,
        secure: false,
        sameSite: 'lax'
      });

      res.cookie('sistema_inicio', Date.now(), {
        maxAge: 10 * 60 * 60 * 1000,
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
      });

      req.session.save((err) => {
        if (err) {
          console.error('Error al guardar sesión:', err);
          return res.status(500).render('login', { 
            error: 'Error interno del sistema' 
          });
        }
        // REDIRECCIÓN CON SISTEMA
        AuthController.redirectByRoleAndSystem(req, res, sistemaSeleccionado);
      });
      
    } catch (error) {
      console.error('Error en login:', error);
      res.redirect('/auth/login?error=Error interno del servidor');
    }
  }

  static logout(req, res) {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error('Error al destruir la sesión:', err);
          return res.status(500).render('error', {
            title: 'Error',
            message: 'Error al cerrar sesión'
          });
        }
        
        clearSystemCookies(res);
        res.clearCookie('connect.sid');
        res.redirect('/auth/login');
      });
    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).render('error', {
        title: 'Error',
        message: 'Error al cerrar sesión'
      });
    }
  }

  // ✅ MÉTODO PRINCIPAL: Redirigir según rol Y sistema
  static redirectByRoleAndSystem(req, res, sistema = null) {
    const user = req.session.user;
    const sistemaActivo = sistema || req.cookies.sistema_activo || 'GENERAL';
    
    if (!user) {
      return res.redirect('/auth/login');
    }

    console.log(`🔄 Redirigiendo usuario: ${user.usuario}, Rol: ${user.rol}, Sistema: ${sistemaActivo}`);

    // Redirigir según el rol del usuario
    switch (user.rol) {
      case 'almacen':
      case 'Jefe_almacen':
        // REDIRECCIÓN AUTOMÁTICA SEGÚN EL SISTEMA
        if (sistemaActivo === 'OFICIALIA') {
          return res.redirect('/inventario/oficialia');
        } else {
          return res.redirect('/inventario/general');
        }
        
      case 'Administrador':
        // Los administradores van a la vista combinada
        return res.redirect('/inventario');
        
      case 'Financieros':
      default:
        return res.redirect('/dashboard');
    }
  }

  // ✅ MÉTODO MEJORADO: Para cambiar de sistema
  static cambiarSistema(req, res) {
    if (!req.body.sistema) {
      return res.status(400).json({ 
        success: false, 
        message: 'Sistema no especificado' 
      });
    }
    
    if (req.body.sistema !== 'GENERAL' && req.body.sistema !== 'OFICIALIA') {
      return res.status(400).json({ 
        success: false, 
        message: 'Sistema no válido' 
      });
    }
    
    // Establecer nuevo sistema como cookie
    res.cookie('sistema_activo', req.body.sistema, {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });

    const sistemaNombre = req.body.sistema === 'GENERAL' ? 'Sistema General' : 'Sistema Oficialía';
    res.cookie('sistema_nombre', sistemaNombre, {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: false,
      secure: false,
      sameSite: 'lax'
    });

    res.cookie('sistema_inicio', Date.now(), {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    
    // REDIRECCIÓN AUTOMÁTICA AL CAMBIAR SISTEMA
    const user = req.session.user;
    let redirectUrl = '/dashboard';
    
    if (user && (user.rol === 'almacen' || user.rol === 'Jefe_almacen')) {
      redirectUrl = req.body.sistema === 'OFICIALIA' 
        ? '/inventario/oficialia' 
        : '/inventario/general';
    } else if (user && user.rol === 'Administrador') {
      redirectUrl = '/inventario'; // Vista combinada para admin
    }
    
    res.json({ 
      success: true, 
      sistema: req.body.sistema,
      sistemaNombre: sistemaNombre,
      redirectUrl: redirectUrl,
      message: 'Sistema cambiado correctamente'
    });
  }

  // ✅ MÉTODO CORREGIDO: Compatibilidad con middleware
  static redirectByRole(req, res) {
    const sistema = req.cookies.sistema_activo;
    return AuthController.redirectByRoleAndSystem(req, res, sistema);
  }

  // Funciones auxiliares (sin cambios)
  static isSystemExpired(req) {
    const sistemaInicio = req.cookies.sistema_inicio;
    if (!sistemaInicio) return true;
    
    const tiempoTranscurrido = Date.now() - parseInt(sistemaInicio);
    const diezHoras = 10 * 60 * 60 * 1000;
    
    return tiempoTranscurrido > diezHoras;
  }

  static getCurrentSystemInfo(req) {
    return {
      id: req.cookies.sistema_activo || null,
      nombre: req.cookies.sistema_nombre || null,
      inicio: req.cookies.sistema_inicio || null,
      expirado: AuthController.isSystemExpired(req)
    };
  }
}

module.exports = AuthController;