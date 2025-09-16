// ========================================
// CONTROLLERS/ENTRYTICKETCONTROLLER.JS 
// ========================================
/*
const EntryTicket = require('../models/entryticket');

class EntryTicketController {
  // Mostrar formulario de nuevo vale de entrada
  static async showCreateForm(req, res) {
    try {
      const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
        EntryTicket.getTiposCompra(),
        EntryTicket.getPartidas(),
        EntryTicket.getEstatusCaptura(),
        EntryTicket.getRequisicionesEntrada(),
        EntryTicket.getUnidades(),
      ]);

      res.render('entry-ticket/create', {
        title: 'Nuevo Vale de Entrada - Sistema de Almacén',
        user: req.session.user,
        tiposCompra,
        partidas,
        estatusCaptura,
        requisiciones,
        unidades,
        currentPage: 'entry-ticket',
        sistema: req.cookies.sistema_activo,
        esAlmacenGeneral: req.cookies.sistema_activo !== 'OFICIALIA' 

      });
    } catch (error) {
      console.error('Error al mostrar formulario de vale de entrada:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el formulario'
      });
    }
  }

  // API para buscar proveedores
  static async searchProveedores(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ success: true, proveedores: [] });
      }

      const proveedores = await EntryTicket.searchProveedores(q);
      res.json({ success: true, proveedores });
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      res.status(500).json({ success: false, message: 'Error al buscar proveedores' });
    }
  }

  // API para obtener repartidores por proveedor
  static async getRepartidores(req, res) {
    try {
      const { id_proveedor } = req.params;
      const repartidores = await EntryTicket.getRepartidoresByProveedor(id_proveedor);
      res.json({ success: true, repartidores });
    } catch (error) {
      console.error('Error al obtener repartidores:', error);
      res.status(500).json({ success: false, message: 'Error al obtener repartidores' });
    }
  }

  // API para buscar requisiciones (NUEVO)
  static async searchRequisiciones(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ success: true, requisiciones: [] });
      }

      const requisiciones = await EntryTicket.searchRequisiciones(q);
      res.json({ success: true, requisiciones });
    } catch (error) {
      console.error('Error al buscar requisiciones:', error);
      res.status(500).json({ success: false, message: 'Error al buscar requisiciones' });
    }
  }

  // API para buscar productos
  static async searchProductos(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ success: true, productos: [] });
      }

      const productos = await EntryTicket.searchProductos(q);
      res.json({ success: true, productos });
    } catch (error) {
      console.error('Error al buscar productos:', error);
      res.status(500).json({ success: false, message: 'Error al buscar productos' });
    }
  }

  // API para buscar productos genéricos (NUEVO)
  static async searchProductosGenericos(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ success: true, productos: [] });
      }

      const productos = await EntryTicket.searchProductosGenericos(q);
      res.json({ success: true, productos });
    } catch (error) {
      console.error('Error al buscar productos genéricos:', error);
      res.status(500).json({ success: false, message: 'Error al buscar productos genéricos' });
    }
  }

  // API para crear proveedor
  static async createProveedor(req, res) {
    try {
      const proveedor = await EntryTicket.createProveedor(req.body);
      res.json({ success: true, proveedor });
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      res.status(500).json({ success: false, message: 'Error al crear proveedor' });
    }
  }

  // API para crear repartidor
  static async createRepartidor(req, res) {
    try {
      const repartidor = await EntryTicket.createRepartidor(req.body);
      res.json({ success: true, repartidor });
    } catch (error) {
      console.error('Error al crear repartidor:', error);
      res.status(500).json({ success: false, message: 'Error al crear repartidor' });
    }
  }

  // API para crear producto genérico
  static async createProductoGenerico(req, res) {
    try {
      const producto = await EntryTicket.createProductoGenerico(req.body);
      res.json({ success: true, producto });
    } catch (error) {
      console.error('Error al crear producto genérico:', error);
      res.status(500).json({ success: false, message: 'Error al crear producto genérico' });
    }
  }

  // API para crear presentación de producto (ACTUALIZADO)
  static async createProducto(req, res) {
    try {
      const { 
        id_producto_generico, 
        codigo, 
        id_unidad, 
        cantidad_secundaria, 
        id_unidad_secundaria 
      } = req.body;
      console.log('Datos recibidos:', req.body);

      // Validaciones
      if (!id_producto_generico) {
        return res.status(400).json({ 
          success: false, 
          message: 'Debe seleccionar un producto genérico' 
        });
      }

      if (!codigo || codigo.trim() === '') {
        return res.status(400).json({ 
          success: false, 
          message: 'El código es requerido y no puede estar vacío' 
        });
      }

      if (!id_unidad) {
        return res.status(400).json({ 
          success: false, 
          message: 'Unidad principal son requeridos' 
        });
      }

      // Si hay cantidad secundaria, debe haber unidad secundaria
      if (cantidad_secundaria && !id_unidad_secundaria) {
        return res.status(400).json({ 
          success: false, 
          message: 'Si especifica cantidad secundaria, debe seleccionar unidad secundaria' 
        });
      }

      const datosLimpios = {
        id_producto_generico: parseInt(id_producto_generico),
        codigo: codigo.trim(), // Limpiar espacios
        id_unidad: parseInt(id_unidad),
        cantidad_secundaria: cantidad_secundaria ? parseFloat(cantidad_secundaria) : null,
        id_unidad_secundaria: id_unidad_secundaria ? parseInt(id_unidad_secundaria) : null
      };

    console.log('✅ Datos procesados:', datosLimpios); // DEBUG

      const producto = await EntryTicket.createProducto(req.body);
      res.json({ success: true, producto });
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
  }

  // API para buscar productos genéricos similares (para validación de duplicados)
  static async searchSimilarProductosGenericos(req, res) {
    try {
      const { q } = req.query;
      if (!q || q.length < 2) {
        return res.json({ success: true, productos: [] });
      }

      const productos = await EntryTicket.searchSimilarProductosGenericos(q);
      res.json({ success: true, productos });
    } catch (error) {
      console.error('Error al buscar productos genéricos similares:', error);
      res.status(500).json({ success: false, message: 'Error al buscar productos genéricos similares' });
    }
  }

  // Procesar creación de vale de entrada
  static async createValeEntrada(req, res) {
    try {
      // Determinar sistema desde la sesión
      const esOficialia = req.cookies.sistema_activo === 'OFICIALIA';
      
      const { es_oficialia, ...datosVale } = req.body;
      
      const valeData = {
        ...datosVale,
        es_oficialia: esOficialia,
        id_empleado: req.body.id_empleado || req.session.user.id_empleado || req.session.user.id,
        fecha_de_entrada: new Date() // Fecha automática
      };

      const resultado = await EntryTicket.createValeEntrada(valeData, req.cookies.sistema_activo);
      
      res.redirect(`/entry-ticket/success/${resultado.valeId}`);
    } catch (error) {
      console.error('Error al crear vale de entrada:', error);
      
      // Intentar recuperar datos para rellenar el formulario en caso de error
      try {
        const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
          EntryTicket.getTiposCompra(),
          EntryTicket.getPartidas(),
          EntryTicket.getEstatusCaptura(),
          EntryTicket.getRequisicionesEntrada(),
          EntryTicket.getUnidades(),
        ]);

        res.status(500).render('entry-ticket/create', {
          title: 'Nuevo Vale de Entrada - Sistema de Almacén',
          user: req.session.user,
          tiposCompra,
          partidas,
          estatusCaptura,
          requisiciones,
          unidades,
          currentPage: 'entry-ticket',
          sistema: req.cookies.sistema_activo,
          error: 'Error al crear el vale de entrada',
          // Aquí podrías añadir lógica para preservar los datos del formulario
          formData: req.body // Preservar datos ingresados
        });
      } catch (innerError) {
        // Si falla la recuperación de datos, mostrar página de error genérica
        res.status(500).render('error', {
          title: 'Error al Crear Vale',
          message: 'Error al crear el vale de entrada'
        });
      }
    }
  }

  // Mostrar página de éxito
  static showSuccess(req, res) {
    const { id } = req.params;
    res.render('entry-ticket/success', {
      title: 'Vale de Entrada Creado',
      user: req.session.user,
      valeId: id,
      currentPage: 'entry-ticket'
    });
  }

  // Mostrar historial de vales de entrada
  static async showHistory(req, res) {
    try {
      // Por ahora una página básica - después implementaremos la lógica completa
      res.render('entry-ticket/history', {
        title: 'Historial de Vales de Entrada - Sistema de Almacén',
        user: req.session.user,
        currentPage: 'entry-ticket-history',
        sistema: req.cookies.sistema_activo // Añadido: pasar sistema a la vista
      });
    } catch (error) {
      console.error('Error al mostrar historial de vales de entrada:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial'
      });
    }
  }
}

module.exports = EntryTicketController;*/