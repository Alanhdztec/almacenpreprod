// ========================================
// CONTROLLERS/EXITTICKETOFICIALIACONTROLLER.JS - CONTROLADOR PARA OFICIALÍA
// ========================================

const ExitTicket = require('../../models/exitticket');

class ExitTicketOficialiaController {
  // Mostrar formulario de nuevo vale de salida - SOLO OFICIALÍA
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

      res.render('exit-ticket/oficialia/create', {
        title: 'Nuevo Vale de Salida - Oficialía',
        user: req.session.user,
        areas,
        estatusCaptura,
        requisiciones,
        allEmpleados,
        currentPage: 'exit-ticket',
        sistema: 'OFICIALIA', // FORZAR sistema oficialía
        esAlmacenGeneral: false // SIEMPRE false para oficialía
      });
      
      console.log('✅ [CONTROLLER] Formulario renderizado exitosamente para OFICIALÍA');
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al mostrar formulario:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el formulario de oficialía: ' + error.message,
        user: req.session.user
      });
    }
  }

  // API para buscar productos - FORZAR OFICIALÍA
  static async searchProductos(req, res) {
    try {
      const { q } = req.query;
      const sistemaActivo = 'OFICIALIA'; // FORZADO
      
      console.log(`🔍 [CONTROLLER] API búsqueda productos: "${q}" en OFICIALÍA`);
      
      if (!q || q.length < 2) {
        console.log('⚠️ [CONTROLLER] Query muy corta, retornando array vacío');
        return res.json({ success: true, productos: [] });
      }

      // PASAR SISTEMA FORZADO AL MODELO
      const productos = await ExitTicket.searchProductos(q, sistemaActivo);
      console.log(`📦 [CONTROLLER] ${productos.length} productos encontrados en OFICIALÍA`);
      
      // Log adicional para debug
      if (productos.length > 0) {
        const primerProducto = productos[0];
        console.log(`📝 [CONTROLLER] Primer producto encontrado:`, {
          id: primerProducto.id_producto,
          nombre: primerProducto.producto_generico,
          stock_disponible: primerProducto.stock_disponible,
          disponible_presentacion: primerProducto.disponible_presentacion,
          existencia_oficialia: primerProducto.existencia_oficialia
        });
      } else {
        console.log(`⚠️ [CONTROLLER] No se encontraron productos con stock para "${q}" en OFICIALÍA`);
      }
      
      res.json({ success: true, productos });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error en searchProductos:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error al buscar productos: ' + error.message 
      });
    }
  }

  // API para buscar empleados - SIN CAMBIOS
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

  // API para buscar proveedores - SIN CAMBIOS
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

  // Procesar creación de vale de salida - FORZAR OFICIALÍA
  static async createValeSalida(req, res) {
    try {
      console.log('🚀 [CONTROLLER] Iniciando creación de vale de salida para OFICIALÍA...');
      console.log('📦 [CONTROLLER] Body recibido:', JSON.stringify(req.body, null, 2));
      console.log('👤 [CONTROLLER] Usuario de sesión:', req.session.user?.usuario);
      console.log('🆔 [CONTROLLER] ID empleado del usuario:', req.session.user?.id_empleado);

      // Procesar y validar datos
      const valeData = {
        ...req.body,
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
        fecha_de_salida: new Date(Math.floor(Date.now() / 1000) * 1000)
      };

      console.log('🏢 [CONTROLLER] Vale será procesado en: OFICIALÍA');

      // Validaciones básicas
      if (!valeData.id_empleado_entrega) {
        throw new Error('No se pudo determinar el empleado que entrega');
      }

      if (!valeData.id_empleado_recibe) {
        throw new Error('Debe seleccionar un empleado que recibe');
      }

      // Procesar productos si existen
      if (valeData.productos) {
        if (!Array.isArray(valeData.productos)) {
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

      // PASAR SISTEMA FORZADO
      const resultado = await ExitTicket.createValeSalida(valeData, 'OFICIALIA');
      
      res.redirect(`/exit-ticket/oficialia/success/${resultado.id_vale_de_salida}`);
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al crear vale de salida:', error);
      
      // Manejo específico de stock insuficiente
      if (error.message.includes('Stock insuficiente')) {
        try {
          const [areas, estatusCaptura, requisiciones, allEmpleados] = await Promise.all([
            ExitTicket.getAreas(),
            ExitTicket.getEstatusCaptura(),
            ExitTicket.getRequisicionesSalida(),
            ExitTicket.getAllEmpleados()
          ]);
          
          return res.status(400).render('exit-ticket/oficialia/create', {
            title: 'Nuevo Vale de Salida - Oficialía',
            user: req.session.user,
            areas,
            estatusCaptura,
            requisiciones,
            allEmpleados,
            currentPage: 'exit-ticket-oficialia',
            sistema: 'OFICIALIA',
            esAlmacenGeneral: false,
            error: 'Stock insuficiente para realizar la salida en Oficialía',
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
        
        res.status(500).render('exit-ticket/oficialia/create', {
          title: 'Nuevo Vale de Salida - Oficialía',
          user: req.session.user,
          areas,
          estatusCaptura,
          requisiciones,
          allEmpleados,
          currentPage: 'exit-ticket-oficialia',
          sistema: 'OFICIALIA',
          esAlmacenGeneral: false,
          error: 'Error al crear el vale de salida: ' + error.message,
          formData: req.body
        });
      } catch (innerError) {
        console.error('❌ [CONTROLLER] Error al recuperar datos para formulario:', innerError);
        res.status(500).render('error', {
          title: 'Error al Crear Vale',
          message: 'Error al crear el vale de salida de oficialía: ' + error.message,
          user: req.session.user
        });
      }
    }
  }

  // Mostrar página de éxito - ESPECÍFICA PARA OFICIALÍA
  static showSuccess(req, res) {
    const { id } = req.params;
    
    console.log(`🎉 [CONTROLLER] Mostrando página de éxito para vale ID: ${id} (OFICIALÍA)`);
    
    res.render('exit-ticket/oficialia/success', {
      title: 'Vale de Salida Creado - Oficialía',
      user: req.session.user,
      valeId: id,
      currentPage: 'exit-ticket-oficialia',
      sistema: 'OFICIALIA'
    });
  }

  // Mostrar historial de vales de salida - SOLO OFICIALÍA
  static async showHistory(req, res) {
    try {
      console.log('📋 [CONTROLLER] Mostrando historial de vales de salida para OFICIALÍA...');
      
      res.render('exit-ticket/oficialia/history', {
        title: 'Historial de Vales de Salida - Oficialía',
        user: req.session.user,
        currentPage: 'exit-ticket-oficialia-history',
        sistema: 'OFICIALIA'
      });
    } catch (error) {
      console.error('❌ [CONTROLLER] Error al mostrar historial:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de oficialía',
        user: req.session.user
      });
    }
  }
}

module.exports = ExitTicketOficialiaController;