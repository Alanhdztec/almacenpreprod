// ========================================
// CONTROLLERS/ENTRYTICKETGENERALCONTROLLER.JS - SOLO ALMACÉN GENERAL
// ========================================

const EntryTicket = require('../../models/entryticket');

class EntryTicketGeneralController {
  // Mostrar formulario de nuevo vale de entrada - SOLO ALMACÉN GENERAL
  static async showCreateForm(req, res) {
    try {
      const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
        EntryTicket.getTiposCompra(),
        EntryTicket.getPartidas(),
        EntryTicket.getEstatusCaptura(),
        EntryTicket.getRequisicionesEntrada(),
        EntryTicket.getUnidades(),
      ]);

      res.render('entry-ticket/general/create', {
        title: 'Nuevo Vale de Entrada - Almacén General',
        user: req.session.user,
        tiposCompra,
        partidas,
        estatusCaptura,
        requisiciones,
        unidades,
        currentPage: 'entry-ticket',
        sistema: 'GENERAL', // FORZAR sistema general
        esAlmacenGeneral: true // SIEMPRE true para este controlador
      });
    } catch (error) {
      console.error('Error al mostrar formulario de vale de entrada (general):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el formulario de vale de entrada'
      });
    }
  }

  // API para buscar proveedores - SIN CAMBIOS
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

  // API para obtener repartidores por proveedor - SIN CAMBIOS
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

  // API para buscar requisiciones - SIN CAMBIOS
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

  // API para buscar productos - SIN CAMBIOS
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

  // API para buscar productos genéricos - SIN CAMBIOS
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

  // API para crear proveedor - SIN CAMBIOS
  static async createProveedor(req, res) {
    try {
      const proveedor = await EntryTicket.createProveedor(req.body);
      res.json({ success: true, proveedor });
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      res.status(500).json({ success: false, message: 'Error al crear proveedor' });
    }
  }

  // API para crear repartidor - SIN CAMBIOS
  static async createRepartidor(req, res) {
    try {
      const repartidor = await EntryTicket.createRepartidor(req.body);
      res.json({ success: true, repartidor });
    } catch (error) {
      console.error('Error al crear repartidor:', error);
      res.status(500).json({ success: false, message: 'Error al crear repartidor' });
    }
  }

  // API para crear producto genérico - SIN CAMBIOS
  static async createProductoGenerico(req, res) {
    try {
      const producto = await EntryTicket.createProductoGenerico(req.body);
      res.json({ success: true, producto });
    } catch (error) {
      console.error('Error al crear producto genérico:', error);
      res.status(500).json({ success: false, message: 'Error al crear producto genérico' });
    }
  }

  // API para crear presentación de producto - SIN CAMBIOS
  static async createProducto(req, res) {
    try {
      const { 
        id_producto_generico, 
        codigo, 
        id_unidad, 
        cantidad_secundaria, 
        id_unidad_secundaria 
      } = req.body;

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

      if (cantidad_secundaria && !id_unidad_secundaria) {
        return res.status(400).json({ 
          success: false, 
          message: 'Si especifica cantidad secundaria, debe seleccionar unidad secundaria' 
        });
      }

      const producto = await EntryTicket.createProducto(req.body);
      res.json({ success: true, producto });
    } catch (error) {
      console.error('Error al crear producto:', error);
      res.status(500).json({ success: false, message: 'Error al crear producto' });
    }
  }

  // API para buscar productos genéricos similares - SIN CAMBIOS
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

  // Procesar creación de vale de entrada - FORZAR ALMACÉN GENERAL
  static async createValeEntrada(req, res) {
    try {
      // FORZAR sistema GENERAL (no oficialía)
      const esOficialia = false;
      
      const { es_oficialia, ...datosVale } = req.body;
      
      const valeData = {
        ...datosVale,
        es_oficialia: esOficialia, // SIEMPRE false para almacén general
        id_empleado: req.body.id_empleado || req.session.user.id_empleado || req.session.user.id,
        fecha_de_entrada: new Date()
      };

      const resultado = await EntryTicket.createValeEntrada(valeData, 'GENERAL');
      
      res.redirect(`/entry-ticket/general/success/${resultado.id_vale_de_entrada}`);
    } catch (error) {
      console.error('Error al crear vale de entrada (general):', error);
      
      try {
        const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
          EntryTicket.getTiposCompra(),
          EntryTicket.getPartidas(),
          EntryTicket.getEstatusCaptura(),
          EntryTicket.getRequisicionesEntrada(),
          EntryTicket.getUnidades(),
        ]);

        res.status(500).render('entry-ticket/general/create', {
          title: 'Nuevo Vale de Entrada - Almacén General',
          user: req.session.user,
          tiposCompra,
          partidas,
          estatusCaptura,
          requisiciones,
          unidades,
          currentPage: 'entry-ticket-general',
          sistema: 'GENERAL',
          esAlmacenGeneral: true,
          error: 'Error al crear el vale de entrada',
          formData: req.body
        });
      } catch (innerError) {
        res.status(500).render('error', {
          title: 'Error al Crear Vale',
          message: 'Error al crear el vale de entrada del almacén general'
        });
      }
    }
  }

  // Mostrar página de éxito - ESPECÍFICA PARA ALMACÉN GENERAL
  static showSuccess(req, res) {
    const { id } = req.params;
    res.render('entry-ticket/general/success', {
      title: 'Vale de Entrada Creado - Almacén General',
      user: req.session.user,
      valeId: id,
      currentPage: 'entry-ticket-general',
      sistema: 'GENERAL'
    });
  }

  // Mostrar historial de vales de entrada - SOLO ALMACÉN GENERAL
  static async showHistory(req, res) {
    try {
      res.render('entry-ticket/general/history', {
        title: 'Historial de Vales de Entrada - Almacén General',
        user: req.session.user,
        currentPage: 'entry-ticket-general-history',
        sistema: 'GENERAL'
      });
    } catch (error) {
      console.error('Error al mostrar historial de vales de entrada (general):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial del almacén general'
      });
    }
  }

  // Mostrar formulario para EDITAR un vale de entrada
  static async showEditForm(req, res) {
    try {
      const { id } = req.params;
      const { vale, productos } = await EntryTicket.getValeForEditing(id);

      // Cargar datos necesarios para los select del formulario
      const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
        EntryTicket.getTiposCompra(),
        EntryTicket.getPartidas(),
        EntryTicket.getEstatusCaptura(),
        EntryTicket.getRequisicionesEntrada(),
        EntryTicket.getUnidades(),
      ]);

      res.render('entry-ticket/general/edit', {
        title: `Editar Vale de Entrada #${vale.id_vale_de_entrada} - Almacén General`,
        user: req.session.user,
        vale,
        productos: JSON.stringify(productos), // Convertir a JSON para el script
        tiposCompra,
        partidas,
        estatusCaptura,
        requisiciones,
        unidades,
        currentPage: 'entry-ticket-general',
        sistema: 'GENERAL',
        esAlmacenGeneral: true,
        formData: vale
      });

    } catch (error) {
      console.error(`Error al mostrar formulario de edición para vale #${req.params.id}:`, error);
      res.status(500).render('error', {
        title: 'Error al Cargar el Vale',
        message: error.message || 'No se pudo cargar el vale de entrada para su edición.'
      });
    }
  }
}

module.exports = EntryTicketGeneralController;