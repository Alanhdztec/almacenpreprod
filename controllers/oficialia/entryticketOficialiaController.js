// ========================================
// CONTROLLERS/ENTRYTICKETOFICIALIACONTROLLER.JS - SOLO OFICIALÍA
// ========================================

const EntryTicket = require('../../models/entryticket');

class EntryTicketOficialiaController {
  // Mostrar formulario de nuevo vale de entrada - SOLO OFICIALÍA
  static async showCreateForm(req, res) {
    try {
      const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
        EntryTicket.getTiposCompra(),
        EntryTicket.getPartidas(),
        EntryTicket.getEstatusCaptura(),
        EntryTicket.getRequisicionesEntrada(),
        EntryTicket.getUnidades(),
      ]);

      res.render('entry-ticket/oficialia/create', {
        title: 'Nuevo Vale de Entrada - Oficialía',
        user: req.session.user,
        tiposCompra,
        partidas,
        estatusCaptura,
        requisiciones,
        unidades,
        currentPage: 'entry-ticket',
        sistema: 'OFICIALIA', // FORZAR sistema oficialía
        esAlmacenGeneral: false // SIEMPRE false para oficialía
      });
    } catch (error) {
      console.error('Error al mostrar formulario de vale de entrada (oficialía):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el formulario de vale de entrada de oficialía'
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

  // API para buscar requisiciones 
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

  // API para buscar productos genéricos 
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

  // API para crear presentación de producto 
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

  // API para buscar productos genéricos similares 
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
      // FORZAR sistema OFICIALÍA
      const esOficialia = true;
      
      const { es_oficialia, ...datosVale } = req.body;
      
      const valeData = {
        ...datosVale,
        es_oficialia: esOficialia, // SIEMPRE true para oficialía
        id_empleado: req.body.id_empleado || req.session.user.id_empleado || req.session.user.id,
        fecha_de_entrada: new Date()
      };

      const resultado = await EntryTicket.createValeEntrada(valeData, 'OFICIALIA');
      
      res.redirect(`/entry-ticket/oficialia/success/${resultado.id_vale_de_entrada}`);
    } catch (error) {
      console.error('Error al crear vale de entrada (oficialía):', error);
      
      try {
        const [tiposCompra, partidas, estatusCaptura, requisiciones, unidades] = await Promise.all([
          EntryTicket.getTiposCompra(),
          EntryTicket.getPartidas(),
          EntryTicket.getEstatusCaptura(),
          EntryTicket.getRequisicionesEntrada(),
          EntryTicket.getUnidades(),
        ]);

        res.status(500).render('entry-ticket/oficialia/create', {
          title: 'Nuevo Vale de Entrada - Oficialía',
          user: req.session.user,
          tiposCompra,
          partidas,
          estatusCaptura,
          requisiciones,
          unidades,
          currentPage: 'entry-ticket-oficialia',
          sistema: 'OFICIALIA',
          esAlmacenGeneral: false,
          error: 'Error al crear el vale de entrada',
          formData: req.body
        });
      } catch (innerError) {
        res.status(500).render('error', {
          title: 'Error al Crear Vale',
          message: 'Error al crear el vale de entrada de oficialía'
        });
      }
    }
  }

  // Mostrar página de éxito 
  static showSuccess(req, res) {
    const { id } = req.params;
    res.render('entry-ticket/oficialia/success', {
      title: 'Vale de Entrada Creado - Oficialía',
      user: req.session.user,
      valeId: id,
      currentPage: 'entry-ticket-oficialia',
      sistema: 'OFICIALIA'
    });
  }

  // Mostrar historial de vales de entrada 
  static async showHistory(req, res) {
    try {
      res.render('entry-ticket/oficialia/history', {
        title: 'Historial de Vales de Entrada - Oficialía',
        user: req.session.user,
        currentPage: 'entry-ticket-oficialia-history',
        sistema: 'OFICIALIA'
      });
    } catch (error) {
      console.error('Error al mostrar historial de vales de entrada (oficialía):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de oficialía'
      });
    }
  }
}

module.exports = EntryTicketOficialiaController;