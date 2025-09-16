// ========================================
// CONTROLLERS/INVENTARIOCONTROLLER.JS - CORREGIDO CON FILTROS
// ========================================

const Inventory = require('../../models/Inventario'); // Ajusta según el nombre real de tu archivo

class InventoryController {
  // Mostrar página principal de inventario - CORREGIDO
  static async showInventory(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = 20;
      const offset = (pagina - 1) * limite;
      const { search, partida } = req.query; // AGREGADO: partida
      
      // Obtener el sistema activo de la sesión
      const sistema = req.cookies.sistema_activo || 'GENERAL';
      
      // Obtener productos y partidas para el filtro
      let inventoryData;
      const partidas = await Inventory.getPartidas();
      
      // CORREGIDO: Si hay filtros adicionales, usar getProductsWithFilters
      if ((search && search.trim()) || (partida && partida.trim())) {
        inventoryData = await Inventory.getProductsWithFilters(
          { nombre: search, partida: partida }, 
          limite, 
          offset, 
          sistema
        );
      } else {
        // Si solo hay búsqueda básica o ningún filtro
        inventoryData = await Inventory.getProductsGeneric(limite, offset, search, sistema);
      }

      res.render('inventory/index', {
        title: 'Inventario - Sistema de Almacén',
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
          partida: partida || '' // CORREGIDO: usar la partida del query
        },
        search: search || '',
        sistema: sistema,
        currentPage: 'inventory'
      });
    } catch (error) {
      console.error('Error en inventario:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el inventario'
      });
    }
  }

  // API para cargar más productos (scroll infinito) - CORREGIDO
  static async loadMoreProducts(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = 20;
      const offset = (pagina - 1) * limite;
      const { search, partida } = req.query; // AGREGADO: partida
      
      // Obtener el sistema activo de la sesión
      const sistema = req.cookies.sistema_activo || 'GENERAL';

      let inventoryData;
      
      // CORREGIDO: Si hay filtros adicionales, usar getProductsWithFilters
      if ((search && search.trim()) || (partida && partida.trim())) {
        inventoryData = await Inventory.getProductsWithFilters(
          { nombre: search, partida: partida }, 
          limite, 
          offset, 
          sistema
        );
      } else {
        // Si solo hay búsqueda básica o ningún filtro
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
      console.error('Error al cargar más productos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cargar productos'
      });
    }
  }

  // Mostrar detalles completos de un producto específico - SIN CAMBIOS
  static async showProductDetails(req, res) {
    try {
      const idProductoGenerico = parseInt(req.params.id);
      
      if (isNaN(idProductoGenerico)) {
        return res.status(400).render('error', {
          title: 'ID Inválido',
          message: 'El ID del producto no es válido'
        });
      }

      // Obtener el sistema activo de la sesión
      const sistema = req.cookies.sistema_activo || 'GENERAL';

      // Obtener detalles del producto y estadísticas en paralelo
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

      res.render('inventory/details', {
        title: `${product.producto_generico} - Detalles del Producto`,
        user: req.session.user,
        product: product,
        statistics: statistics,
        sistema: sistema,
        currentPage: 'inventory'
      });
    } catch (error) {
      console.error('Error al mostrar detalles del producto:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar los detalles del producto'
      });
    }
  }

  // API para obtener estadísticas de un producto - SIN CAMBIOS
  static async getProductStatistics(req, res) {
    try {
      const idProductoGenerico = parseInt(req.params.id);
      
      if (isNaN(idProductoGenerico)) {
        return res.status(400).json({
          success: false,
          message: 'ID de producto inválido'
        });
      }

      // Obtener el sistema activo de la sesión
      const sistema = req.cookies.sistema_activo || 'GENERAL';

      const statistics = await Inventory.getProductStatistics(idProductoGenerico, sistema);

      res.json({
        success: true,
        statistics: statistics
      });
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del producto'
      });
    }
  }

  // Método para búsqueda con filtros - ACTUALIZADO
  static async searchInventory(req, res) {
    try {
      const pagina = parseInt(req.query.pagina) || 1;
      const limite = 20;
      const offset = (pagina - 1) * limite;
      const { nombre, partida } = req.query;
      
      // Obtener el sistema activo de la sesión
      const sistema = req.cookies.sistema_activo || 'GENERAL';

      // Usar el método correcto del modelo
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
      console.error('Error en búsqueda de inventario:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar en el inventario'
      });
    }
  }
}

module.exports = InventoryController;