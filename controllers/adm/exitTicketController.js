// ========================================
// CONTROLLERS/EXITTICKETCONTROLLER.JS - SIMPLIFICADO SIN SELECCIÓN DE ALMACÉN
// ========================================

const ExitTicket = require('../../models/exitticket');
const pool = require('../../config/database'); // Agregado para debug queries

class ExitTicketController {
  // Mostrar formulario de nuevo vale de salida
  static async showCreateForm(req, res) {
    try {
      
      const [areas, estatusCaptura, requisiciones, allEmpleados] = await Promise.all([
        ExitTicket.getAreas(),
        ExitTicket.getEstatusCaptura(),
        ExitTicket.getRequisicionesSalida(),
        ExitTicket.getAllEmpleados()
      ]);

      
      if (allEmpleados.length === 0) {
        console.warn('⚠️ [CONTROLLER] No se encontraron empleados en la base de datos');
      }

      // Verificar que el usuario tiene id_empleado
      if (!req.session.user?.id_empleado) {
        console.warn('⚠️ [CONTROLLER] Usuario sin id_empleado asociado');
      }

      res.render('exit-ticket/create', {
        title: `Nuevo Vale de Salida - ${req.cookies.sistema_activo === 'OFICIALIA' ? 'Oficialía' : 'Almacén General'}`,
        user: req.session.user,
        areas,
        estatusCaptura,
        requisiciones,
        allEmpleados,
        currentPage: 'exit-ticket',
        sistema: req.cookies.sistema_activo,
        esAlmacenGeneral: req.cookies.sistema_activo !== 'OFICIALIA'  // NUEVA LÍNEA

      });
      
      console.log(`✅ [CONTROLLER] Formulario renderizado exitosamente para ${req.cookies.sistema_activo}`);
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al mostrar formulario:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el formulario: ' + error.message,
        user: req.session.user
      });
    }
  }

  // API para buscar productos - AHORA PASA EL SISTEMA ACTIVO
  static async searchProductos(req, res) {
    try {
      const { q } = req.query;
      const sistemaActivo = req.cookies.sistema_activo;
      
      console.log(`🔍 [CONTROLLER] API búsqueda productos: "${q}" en sistema ${sistemaActivo}`);
      console.log(`🔍 [CONTROLLER] Sesión completa:`, {
        user: req.session.user?.usuario,
        sistema_activo: req.cookies.sistema_activo,
        es_oficialia: req.cookies.sistema_activo === 'OFICIALIA'
      });
      
      if (!q || q.length < 2) {
        console.log('⚠️ [CONTROLLER] Query muy corta, retornando array vacío');
        return res.json({ success: true, productos: [] });
      }

      if (!sistemaActivo) {
        console.error('❌ [CONTROLLER] Sistema activo no definido en sesión');
        return res.status(400).json({ 
          success: false, 
          message: 'Sistema activo no definido' 
        });
      }

      // PASAR EL SISTEMA ACTIVO AL MODELO
      const productos = await ExitTicket.searchProductos(q, sistemaActivo);
      console.log(`📦 [CONTROLLER] ${productos.length} productos encontrados en ${sistemaActivo}`);
      
      // Log adicional para debug con todos los campos importantes
      if (productos.length > 0) {
        const primerProducto = productos[0];
        console.log(`📝 [CONTROLLER] Primer producto encontrado:`, {
          id: primerProducto.id_producto,
          nombre: primerProducto.producto_generico,
          stock_disponible: primerProducto.stock_disponible,
          disponible_presentacion: primerProducto.disponible_presentacion,
          existencia_almacen_general: primerProducto.existencia_almacen_general,
          existencia_oficialia: primerProducto.existencia_oficialia,
          sistema_activo: sistemaActivo
        });
      } else {
        console.log(`⚠️ [CONTROLLER] No se encontraron productos con stock para "${q}" en ${sistemaActivo}`);
        
        // Para debug: hacer una consulta sin filtro de stock para ver qué hay
        const productosDebug = await pool.query(`
          SELECT 
            pg.producto_generico,
            pg.existencia,
            pg.existencia_oficialia
          FROM productos p
          INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
          WHERE pg.producto_generico ILIKE $1
          LIMIT 5
        `, [`%${q}%`]);
        
        console.log(`🔍 [CONTROLLER] Debug - Productos encontrados sin filtro de stock:`, 
          productosDebug.rows.map(p => ({
            nombre: p.producto_generico,
            stock_ag: p.existencia,
            stock_of: p.existencia_oficialia
          }))
        );
      }
      
      res.json({ success: true, productos });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error en searchProductos:', error);
      console.error('Stack completo:', error.stack);
      res.status(500).json({ 
        success: false, 
        message: 'Error al buscar productos: ' + error.message 
      });
    }
  }

  // API para buscar empleados (mantenida por compatibilidad)
  static async searchEmpleados(req, res) {
    try {
      const { q } = req.query;
      console.log(`👥 [CONTROLLER] API búsqueda empleados: "${q}"`);
      
      if (!q || q.length < 2) {
        return res.json({ success: true, empleados: [] });
      }

      const empleados = await ExitTicket.getAllEmpleados();
      
      // Filtrar por nombre
      const empleadosFiltrados = empleados.filter(emp => 
        emp.nombre_completo.toLowerCase().includes(q.toLowerCase())
      );

      console.log(`👥 [CONTROLLER] ${empleadosFiltrados.length} empleados filtrados`);

      res.json({ success: true, empleados: empleadosFiltrados });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al buscar empleados:', error);
      res.status(500).json({ success: false, message: 'Error al buscar empleados' });
    }
  }

  // En ExitTicketController - añadir esta función
  static async searchProveedores(req, res) {
    try {
      const { q } = req.query;
      console.log(`🔍 [CONTROLLER] API búsqueda proveedores: "${q}"`);
      
      if (!q || q.length < 2) {
        return res.json({ success: true, proveedores: [] });
      }

      const proveedores = await ExitTicket.searchProveedores(q);
      console.log(`🏢 [CONTROLLER] ${proveedores.length} proveedores encontrados`);
      
      res.json({ success: true, proveedores });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al buscar proveedores:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al buscar proveedores: ' + error.message 
      });
    }
  }

  // Procesar creación de vale de salida - SIMPLIFICADO SIN LÓGICA DE SELECCIÓN
  static async createValeSalida(req, res) {
    try {
      console.log('🚀 [CONTROLLER] Iniciando creación de vale de salida...');
      console.log('📦 [CONTROLLER] Body recibido:', JSON.stringify(req.body, null, 2));
      console.log('👤 [CONTROLLER] Usuario de sesión:', req.session.user?.usuario);
      console.log('🆔 [CONTROLLER] ID empleado del usuario:', req.session.user?.id_empleado);
      console.log('🏢 [CONTROLLER] Sistema activo:', req.cookies.sistema_activo);

      // Procesar y validar datos - SIN LÓGICA DE es_oficialia
      const valeData = {
        ...req.body,
        // Asegurar que los IDs sean números enteros
        id_empleado_entrega: req.session.user.id,
        id_empleado_recibe: req.body.id_empleado_recibe && !isNaN(req.body.id_empleado_recibe)
          ? parseInt(req.body.id_empleado_recibe)
          : null,
        id_proveedor: req.body.id_proveedor && !isNaN(req.body.id_proveedor)
          ? parseInt(req.body.id_proveedor)
          : null,
        id_area: req.body.id_area && !isNaN(req.body.id_area)
          ? parseInt(req.body.id_area)
          : null,
        id_estatus_de_captura: req.body.id_estatus_de_captura && !isNaN(req.body.id_estatus_de_captura)
          ? parseInt(req.body.id_estatus_de_captura)
          : null,
        // Fecha sin milisegundos para evitar problemas de timezone
        fecha_de_salida: new Date(Math.floor(Date.now() / 1000) * 1000)
      };

      console.log(`🏢 [CONTROLLER] Vale será procesado en: ${req.cookies.sistema_activo === 'OFICIALIA' ? 'OFICIALÍA' : 'ALMACÉN GENERAL'}`);

      // Validaciones básicas
      if (!valeData.id_empleado_entrega) {
        throw new Error('No se pudo determinar el empleado que entrega');
      }

      if (!valeData.id_empleado_recibe) {
        throw new Error('Debe seleccionar un empleado que recibe');
      }

      // Procesar productos si existen
      if (valeData.productos) {
        // Convertir productos a array si no lo es
        if (!Array.isArray(valeData.productos)) {
          // Si productos viene como objeto indexado, convertir a array
          const productosArray = [];
          Object.keys(valeData.productos).forEach(key => {
            if (valeData.productos[key].id_producto) {
              productosArray.push({
                id_producto: parseInt(valeData.productos[key].id_producto),
                cantidad: parseInt(valeData.productos[key].cantidad),
                id_unidad: parseInt(valeData.productos[key].id_unidad),
                nota: valeData.productos[key].nota || null
              });
            }
          });
          valeData.productos = productosArray;
        }

        console.log(`📦 [CONTROLLER] ${valeData.productos.length} productos procesados`);
      } else {
        console.warn('⚠️ [CONTROLLER] No se recibieron productos');
        valeData.productos = [];
      }

      console.log('📝 [CONTROLLER] Datos finales procesados:', JSON.stringify(valeData, null, 2));

      // PASAR SOLO EL SISTEMA ACTIVO, SIN LÓGICA ADICIONAL
      const resultado = await ExitTicket.createValeSalida(valeData, req.cookies.sistema_activo);
      
      res.redirect(`/exit-ticket/success/${resultado.id_vale_de_salida}`);
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al crear vale de salida:', error);
      console.error('Stack trace:', error.stack);
      
      const sistemaTexto = req.cookies.sistema_activo === 'OFICIALIA' ? 'Oficialía' : 'Almacén General';
      
      // Manejo específico de stock insuficiente
      if (error.message.includes('Stock insuficiente')) {
        try {
          const [areas, estatusCaptura, requisiciones, allEmpleados] = await Promise.all([
            ExitTicket.getAreas(),
            ExitTicket.getEstatusCaptura(),
            ExitTicket.getRequisicionesSalida(),
            ExitTicket.getAllEmpleados()
          ]);
          
          return res.status(400).render('exit-ticket/create', {
            title: `Nuevo Vale de Salida - ${sistemaTexto}`,
            user: req.session.user,
            areas,
            estatusCaptura,
            requisiciones,
            allEmpleados,
            currentPage: 'exit-ticket',
            sistema: req.cookies.sistema_activo,
            esAlmacenGeneral: req.cookies.sistema_activo !== 'OFICIALIA',  
            error: `Stock insuficiente para realizar la salida en ${sistemaTexto}`,
            formData: req.body
          });
        } catch (innerError) {
          console.error('❌ [CONTROLLER] Error al recuperar datos para formulario:', innerError);
        }
      }
      
      // Error genérico
      try {
        const [areas, estatusCaptura, requisiciones, allEmpleados] = await Promise.all([
          ExitTicket.getAreas(),
          ExitTicket.getEstatusCaptura(),
          ExitTicket.getRequisicionesSalida(),
          ExitTicket.getAllEmpleados()
        ]);
        
        res.status(500).render('exit-ticket/create', {
          title: `Nuevo Vale de Salida - ${sistemaTexto}`,
          user: req.session.user,
          areas,
          estatusCaptura,
          requisiciones,
          allEmpleados,
          currentPage: 'exit-ticket',
          sistema: req.cookies.sistema_activo,

          error: 'Error al crear el vale de salida: ' + error.message,
          formData: req.body
        });
      } catch (innerError) {
        console.error('❌ [CONTROLLER] Error al recuperar datos para formulario:', innerError);
        res.status(500).render('error', {
          title: 'Error al Crear Vale',
          message: 'Error al crear el vale de salida: ' + error.message,
          user: req.session.user
        });
      }
    }
  }

  // Mostrar página de éxito
  static showSuccess(req, res) {
    const { id } = req.params;
    const sistemaTexto = req.cookies.sistema_activo === 'OFICIALIA' ? 'Oficialía' : 'Almacén General';
    
    console.log(`🎉 [CONTROLLER] Mostrando página de éxito para vale ID: ${id} (${sistemaTexto})`);
    
    res.render('exit-ticket/success', {
      title: `Vale de Salida Creado - ${sistemaTexto}`,
      user: req.session.user,
      valeId: id,
      currentPage: 'exit-ticket',
      sistema: req.cookies.sistema_activo
    });
  }

  // Mostrar historial de vales de salida
  static async showHistory(req, res) {
    try {
      const sistemaTexto = req.cookies.sistema_activo === 'OFICIALIA' ? 'Oficialía' : 'Almacén General';
      
      console.log(`📋 [CONTROLLER] Mostrando historial de vales de salida para ${sistemaTexto}...`);
      
      res.render('exit-ticket/history', {
        title: `Historial de Vales de Salida - ${sistemaTexto}`,
        user: req.session.user,
        currentPage: 'exit-ticket-history',
        sistema: req.cookies.sistema_activo
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al mostrar historial:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial',
        user: req.session.user
      });
    }
  }

}

module.exports = ExitTicketController;