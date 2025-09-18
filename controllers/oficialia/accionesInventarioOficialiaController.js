// ========================================
// CONTROLLERS/OFICIALIA/ACCIONESINVENTARIOCONTROLLER.JS - ACCIONES DE INVENTARIO PARA JEFE DE ALMACÉN
// ========================================

const Inventory = require('../../models/Inventario');
const pool = require('../../config/database');

class AccionesInventarioController {
  // Mostrar panel de acciones de inventario (solo para jefe de almacén)
  static async showAccionesInventario(req, res) {
    try {
      // Verificar que es un jefe de almacén (middleware ya lo verifica, pero doble validación)
      if (req.session.user.rol !== 'Jefe_almacen') {
        return res.status(403).render('error', {
          title: 'Acceso Denegado',
          message: 'No tienes permisos para acceder a esta sección.',
          user: req.session.user
        });
      }

      // Forzar sistema OFICIALIA para este flujo
      const sistema = 'OFICIALIA';

      // Obtener estadísticas básicas del inventario de oficialía
      const estadisticasInventario = await AccionesInventarioController.getEstadisticasInventario(sistema);

      res.render('inventory/oficialia/acciones', {
        title: 'Acciones de Inventario - Oficialía',
        user: req.session.user,
        sistema: sistema,
        estadisticas: estadisticasInventario,
        currentPage: 'acciones-inventario-oficialia'
      });
    } catch (error) {
      console.error('Error al mostrar acciones de inventario:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar las acciones de inventario',
        user: req.session.user
      });
    }
  }

  // Obtener estadísticas del inventario (simplificado para oficialía)
  static async getEstadisticasInventario(sistema = 'OFICIALIA') {
    try {
      const campoExistencia = sistema === 'OFICIALIA' 
        ? 'pg.existencia_oficialia' 
        : 'pg.existencia';

      const query = `
        SELECT 
          COUNT(*) as total_productos,
          COUNT(CASE WHEN ${campoExistencia} = 0 THEN 1 END) as productos_sin_stock,
          COUNT(CASE WHEN ${campoExistencia} < 0 THEN 1 END) as productos_negativos,
          SUM(${campoExistencia}) as total_existencias
        FROM productos_genericos pg
        WHERE pg.esta_borrado = false
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      return {
        total_productos: parseInt(stats.total_productos) || 0,
        productos_sin_stock: parseInt(stats.productos_sin_stock) || 0,
        productos_negativos: parseInt(stats.productos_negativos) || 0,
        total_existencias: parseInt(stats.total_existencias) || 0,
        sistema: sistema
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de inventario:', error);
      return {
        total_productos: 0,
        productos_sin_stock: 0,
        productos_negativos: 0,
        total_existencias: 0,
        sistema: sistema
      };
    }
  }

  // Mostrar productos con existencias negativas (simplificado para oficialía)
  static async showProductosCriticos(req, res) {
    try {
      const sistema = 'OFICIALIA';
      const limite = 20;
      const pagina = parseInt(req.query.pagina) || 1;
      const offset = (pagina - 1) * limite;

      const campoExistencia = sistema === 'OFICIALIA' 
        ? 'pg.existencia_oficialia' 
        : 'pg.existencia';

      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          pg.existencia as existencia_almacen_general,
          pg.existencia_oficialia,
          ${campoExistencia} as existencia,
          p.partida,
          p.clave_objeto_del_gasto
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        WHERE pg.esta_borrado = false 
        AND ${campoExistencia} < 0
        ORDER BY ${campoExistencia} ASC, pg.producto_generico ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limite, offset]);

      // Obtener total para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM productos_genericos pg
        WHERE pg.esta_borrado = false 
        AND ${campoExistencia} < 0
      `;

      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);

      res.render('inventory/oficialia/productos-criticos', {
        title: 'Productos con Existencias Negativas - Oficialía',
        user: req.session.user,
        products: result.rows,
        pagination: {
          paginaActual: pagina,
          totalPaginas: Math.ceil(total / limite),
          total: total
        },
        sistema: sistema,
        currentPage: 'productos-criticos-oficialia'
      });
    } catch (error) {
      console.error('Error al mostrar productos con existencias negativas:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar productos con existencias negativas',
        user: req.session.user
      });
    }
  }

  // API para obtener estadísticas en tiempo real
  static async getEstadisticasAPI(req, res) {
    try {
      const sistema = req.query.sistema || 'OFICIALIA';
      const estadisticas = await AccionesInventarioController.getEstadisticasInventario(sistema);

      res.json({
        success: true,
        estadisticas: estadisticas
      });
    } catch (error) {
      console.error('Error al obtener estadísticas API:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }
}

module.exports = AccionesInventarioController;