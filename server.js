// ========================================
// SERVER.JS - CONFIGURACIÓN CORREGIDA CON RUTAS DE HISTORIAL Y ARCHIVOS
// ========================================

const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/authRoute');
//const homeRoutes = require('./routes/homeRoute');
//const inventoryRoutes = require('./routes/inventarioRoute'); 
const exitTicketRoutes = require('./routes/exit-ticket');
const systemRoutes = require('./routes/system');

//inventarios
const inventoryGeneralRoutes = require('./routes/general/inventario-general');
const inventoryOficialiaRoutes = require('./routes/oficialia/inventario-oficialia');
//vales de entrada
const entryTicketGeneralRoutes = require('./routes/general/entry-ticket-general');
const entryTicketOficialiaRoutes = require('./routes/oficialia/entry-ticket-oficialia');
//vales de salida
const exitTicketGeneralRoutes = require('./routes/general/exit-ticket-general-routes');
const exitTicketOficialiaRoutes = require('./routes/oficialia/exit-ticket-oficialia-routes');
//historial de vales de entrada
const entryTicketHistoryOficialiaRoutes = require('./routes/oficialia/entry-ticket-history-oficialia');
const entryTicketHistoryGeneralRoutes = require('./routes/general/entry-ticket-history-general');
//historial de vales de salida
const exitTicketHistoryOficialiaRoutes = require('./routes/oficialia/exit-ticket-history-oficialia');
const exitTicketHistoryGeneralRoutes = require('./routes/general/exit-ticket-history-general');

const archivosValeEntradaRoutes = require('./routes/archivos-vale-entrada');

const accionesInventarioOficialiaRoutes = require('./routes/oficialia/acciones-inventario-oficialia');
const accionesInventarioGeneralRoutes = require('./routes/general/acciones-inventario-general');

const stockConfigGeneral = require('./routes/general/stock-config-routes');



const app = express();
const PORT = process.env.PORT;

// Configuración del motor de plantillas
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Configuración de sesiones
app.use(session({
  secret: process.env.SESSION_SECRET || 'almacen-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, 
    maxAge: 24 * 60 * 60 * 1000 // 24 horas
  }
}));

// Middleware para hacer disponible la sesión Y cookies en todas las vistas
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.sistema_activo = req.cookies.sistema_activo;
  next();
});

function redirectByRoleAndSystem(req, res) {
  const user = req.session.user;
  const sistemaActivo = req.cookies.sistema_activo || 'GENERAL';
  
  if (!user) {
    return res.redirect('/auth/login');
  }

  console.log(`🏠 SERVER.JS - Redirigiendo usuario: ${user.usuario}, Rol: ${user.rol}, Sistema: ${sistemaActivo}`);

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

// Rutas - ORDEN CORRECTO
app.use('/auth', authRoutes);
app.use('/system', systemRoutes);
//app.use('/inventario', inventoryRoutes);
//app.use('/', homeRoutes);
app.use('/inventario/general', inventoryGeneralRoutes);
app.use('/inventario/oficialia', inventoryOficialiaRoutes);

app.use('/archivos-vale-entrada', archivosValeEntradaRoutes);

// Historial de vales de entrada
app.use('/entry-ticket/general/history', entryTicketHistoryGeneralRoutes);
app.use('/entry-ticket/oficialia/history', entryTicketHistoryOficialiaRoutes);

// Historial de vales de salida
app.use('/exit-ticket/general/history', exitTicketHistoryGeneralRoutes);
app.use('/exit-ticket/oficialia/history', exitTicketHistoryOficialiaRoutes); 

// Vales de entrada y salida
app.use('/entry-ticket/general', entryTicketGeneralRoutes);
app.use('/entry-ticket/oficialia', entryTicketOficialiaRoutes);
app.use('/exit-ticket/general', exitTicketGeneralRoutes);
app.use('/exit-ticket/oficialia', exitTicketOficialiaRoutes);

app.use('/oficialia/historial-vales', entryTicketHistoryOficialiaRoutes);
app.use('/oficialia/historial-salidas', exitTicketHistoryOficialiaRoutes);

app.use('/inventario/oficialia/acciones', accionesInventarioOficialiaRoutes);
app.use('/inventario/general/acciones/ajustar-stock', stockConfigGeneral);

app.use('/inventario/general/acciones', accionesInventarioGeneralRoutes);




app.get('/', (req, res) => {
  console.log('🏠 Ruta raíz accedida');
  
  if (req.session.user) {
    console.log(`🏠 Usuario encontrado: ${req.session.user.usuario}`);
    
    // Si tiene usuario pero no sistema, redirigir a selección
    if (!req.cookies.sistema_activo) {
      console.log('🏠 No hay sistema activo, redirigiendo a selección');
      return res.redirect('/system/seleccionar-sistema');
    }
    
    // USAR FUNCIÓN LOCAL (sin importar AuthController)
    console.log('🏠 Usando función de redirección local');
    redirectByRoleAndSystem(req, res);
  } else {
    console.log('🏠 No hay usuario, redirigiendo a login');
    res.redirect('/auth/login');
  }
});

// Ruta para selección de sistema (alternativa)
app.get('/seleccionar-sistema', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/auth/login');
  }
  res.redirect('/system/seleccionar-sistema');
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).render('error', {
    title: 'Página no encontrada',
    message: 'La página que buscas no existe'
  });
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).render('error', {
    title: 'Error del servidor',
    message: 'Ocurrió un error interno en el servidor'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
});