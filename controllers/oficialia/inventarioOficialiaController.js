// ========================================
// CONTROLLERS/INVENTARIOOFICIALIACONTROLLER.JS - SOLO OFICIALÍA
// ========================================

const Inventory = require('../../models/Inventario');

class InventoryOficialiaController {
  // Mostrar inventario solo de oficialía
  static async showOficialiaInventory(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = 20;
      const offset = (pagina - 1) * limite;
      const { search, partida } = req.query;
      
      // FORZAR sistema OFICIALIA
      const sistema = 'OFICIALIA';
      
      // Obtener productos y partidas para el filtro
      let inventoryData;
      const partidas = await Inventory.getPartidas();
      
      if ((search && search.trim()) || (partida && partida.trim())) {
        inventoryData = await Inventory.getProductsWithFilters(
          { nombre: search, partida: partida }, 
          limite, 
          offset, 
          sistema
        );
      } else {
        inventoryData = await Inventory.getProductsGeneric(limite, offset, search, sistema);
      }

      res.render('inventory/oficialia/index', {
        title: 'Inventario Oficialía - Sistema de Almacén',
        user: req.session.user,
        products: inventoryData.products,
        pagination: {
          paginaActual: pagina,
          totalPaginas: Math.ceil(inventoryData.total / limite),
          total: inventoryData.total
        },
        partidas: partidas,
        filters: {
          nombre: search || '',
          partida: partida || ''
        },
        search: search || '',
        sistema: sistema,
        currentPage: 'inventory-oficialia'
      });
    } catch (error) {
      console.error('Error en inventario oficialía:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el inventario de oficialía'
      });
    }
  }

  // API para cargar más productos de oficialía
  static async loadMoreOficialiaProducts(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = 20;
      const offset = (pagina - 1) * limite;
      const { search, partida } = req.query;
      
      // FORZAR sistema OFICIALIA
      const sistema = 'OFICIALIA';

      let inventoryData;
      
      if ((search && search.trim()) || (partida && partida.trim())) {
        inventoryData = await Inventory.getProductsWithFilters(
          { nombre: search, partida: partida }, 
          limite, 
          offset, 
          sistema
        );
      } else {
        inventoryData = await Inventory.getProductsGeneric(limite, offset, search, sistema);
      }

      res.json({
        success: true,
        products: inventoryData.products,
        pagination: {
          paginaActual: pagina,
          totalPaginas: Math.ceil(inventoryData.total / limite),
          hasMore: pagina < Math.ceil(inventoryData.total / limite)
        }
      });
    } catch (error) {
      console.error('Error al cargar más productos de oficialía:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cargar productos de oficialía'
      });
    }
  }

  // Mostrar detalles de producto en oficialía
  static async showOficialiaProductDetails(req, res) {
    try {
      const idProductoGenerico = parseInt(req.params.id);
      
      if (isNaN(idProductoGenerico)) {
        return res.status(400).render('error', {
          title: 'ID Inválido',
          message: 'El ID del producto no es válido'
        });
      }

      // FORZAR sistema OFICIALIA
      const sistema = 'OFICIALIA';

      const [product, statistics] = await Promise.all([
        Inventory.getProductDetails(idProductoGenerico, sistema),
        Inventory.getProductStatistics(idProductoGenerico, sistema)
      ]);

      if (!product) {
        return res.status(404).render('error', {
          title: 'Producto no encontrado',
          message: 'El producto solicitado no existe'
        });
      }

      res.render('inventory/oficialia/details', {
        title: `${product.producto_generico} - Detalles (Oficialía)`,
        user: req.session.user,
        product: product,
        statistics: statistics,
        sistema: sistema,
        currentPage: 'inventory-oficialia'
      });
    } catch (error) {
      console.error('Error al mostrar detalles del producto (oficialía):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar los detalles del producto'
      });
    }
  }

  // API para búsqueda con filtros en oficialía
  static async searchOficialiaInventory(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = 20;
      const offset = (pagina - 1) * limite;
      const { nombre, partida } = req.query;
      
      // FORZAR sistema OFICIALIA
      const sistema = 'OFICIALIA';

      const inventoryData = await Inventory.getProductsWithFilters(
        { nombre, partida }, 
        limite, 
        offset, 
        sistema
      );

      res.json({
        success: true,
        products: inventoryData.products,
        pagination: {
          paginaActual: pagina,
          totalPaginas: Math.ceil(inventoryData.total / limite),
          total: inventoryData.total
        }
      });
    } catch (error) {
      console.error('Error en búsqueda de inventario oficialía:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar en el inventario de oficialía'
      });
    }
  }

  // API para obtener estadísticas de un producto en oficialía
  static async getOficialiaProductStatistics(req, res) {
    try {
      const idProductoGenerico = parseInt(req.params.id);
      
      if (isNaN(idProductoGenerico)) {
        return res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
      }

      // FORZAR sistema OFICIALIA
      const sistema = 'OFICIALIA';

      const statistics = await Inventory.getProductStatistics(idProductoGenerico, sistema);

      res.json({
        success: true,
        statistics: statistics
      });
    } catch (error) {
      console.error('Error al obtener estadísticas de oficialía:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del producto'
      });
    }
  }
}

module.exports = InventoryOficialiaController;