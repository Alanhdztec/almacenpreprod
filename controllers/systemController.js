// ========================================
// SYSTEM CONTROLLER - VERSIÓN SIMPLIFICADA PARA TU ESTRUCTURA
// ========================================

const showSystemSelection = async (req, res) => {
  // Como el sistema se selecciona en el login, redirigir al login
  // si llegamos aquí significa que no hay sistema activo
  res.redirect('/auth/login');
};

const setSystem = async (req, res) => {
  try {
    const { sistema_id } = req.body;
    const user = req.session.user;
    
    if (!user) {
      return res.redirect('/auth/login');
    }
    
    // Validar que el sistema sea válido
    if (sistema_id !== 'GENERAL' && sistema_id !== 'OFICIALIA') {
      return res.status(400).json({
        success: false,
        message: 'Sistema no válido'
      });
    }
    
    // Establecer cookies que expiren en 10 horas
    res.cookie('sistema_activo', sistema_id, {
      maxAge: 10 * 60 * 60 * 1000, // 10 horas
      httpOnly: true,
      secure: false, // Cambiar a true en producción
      sameSite: 'lax'
    });
    
    const sistemaNombre = sistema_id === 'GENERAL' ? 'Sistema General' : 'Sistema Oficialía';
    res.cookie('sistema_nombre', sistemaNombre, {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: false, // Para mostrar en la UI
      secure: false,
      sameSite: 'lax'
    });
    
    // Cookie con timestamp para verificar tiempo restante
    res.cookie('sistema_inicio', Date.now(), {
      maxAge: 10 * 60 * 60 * 1000,
      httpOnly: true,
      secure: false,
      sameSite: 'lax'
    });
    
    // Si es una petición AJAX, responder JSON
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.json({
        success: true,
        sistema: sistema_id,
        sistemaNombre: sistemaNombre,
        message: 'Sistema seleccionado correctamente'
      });
    }
    
    // Si es una petición normal, redirigir
    res.redirect('/dashboard');
  } catch (error) {
    console.error('Error al establecer sistema:', error);
    
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(500).json({
        success: false,
        message: 'Error al seleccionar el sistema'
      });
    }
    
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error al seleccionar el sistema'
    });
  }
};

// Función para limpiar cookies del sistema (útil en logout)
const clearSystemCookies = (res) => {
  res.clearCookie('sistema_activo');
  res.clearCookie('sistema_nombre');
  res.clearCookie('sistema_inicio');
};

// Función para verificar si las cookies del sistema han expirado
const isSystemExpired = (req) => {
  const sistemaInicio = req.cookies.sistema_inicio;
  if (!sistemaInicio) return true;
  
  const tiempoTranscurrido = Date.now() - parseInt(sistemaInicio);
  const diezHoras = 10 * 60 * 60 * 1000;
  
  return tiempoTranscurrido > diezHoras;
};

// Función para refrescar cookies del sistema (extender tiempo)
const refreshSystemCookies = (req, res) => {
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
    
    return true; // Cookies refrescadas
  }
  
  return false; // No se pudieron refrescar
};

module.exports = {
  showSystemSelection,
  setSystem,
  clearSystemCookies,
  isSystemExpired,
  refreshSystemCookies
};