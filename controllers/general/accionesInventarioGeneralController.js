// ========================================
// CONTROLLERS/GENERAL/ACCIONESINVENTARIOCONTROLLER.JS - ACCIONES DE INVENTARIO PARA JEFE DE ALMACÉN
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

      // Forzar sistema GENERAL para este flujo
      const sistema = 'GENERAL';

      // Obtener estadísticas básicas del inventario de oficialía
      const estadisticasInventario = await AccionesInventarioController.getEstadisticasInventario(sistema);

      res.render('inventory/general/acciones', {
        title: 'Acciones de Inventario - General',
        user: req.session.user,
        sistema: sistema,
        estadisticas: estadisticasInventario,
        currentPage: 'acciones-inventario-general'
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

  // Obtener estadísticas del inventario
  static async getEstadisticasInventario(sistema = 'GENERAL') {
    try {
      const campoExistencia = sistema === 'GENERAL' 
        ? 'pg.existencia' 
        : 'pg.existencia';

      const query = `
        SELECT 
          COUNT(*) as total_productos,
          COUNT(CASE WHEN ${campoExistencia} = 0 THEN 1 END) as productos_sin_stock,
          COUNT(CASE WHEN ${campoExistencia} < 0 THEN 1 END) as productos_negativos,
          COUNT(CASE WHEN pg.stock_sugerido > 0 AND ${campoExistencia} <= (pg.stock_sugerido * 0.24) THEN 1 END) as productos_criticos,
          COUNT(CASE WHEN pg.stock_sugerido > 0 AND ${campoExistencia} <= (pg.stock_sugerido * 0.49) THEN 1 END) as productos_bajos,
          SUM(${campoExistencia}) as total_existencias,
          COUNT(CASE WHEN pg.stock_sugerido = 0 THEN 1 END) as productos_sin_stock_sugerido,
          AVG(CASE 
            WHEN pg.stock_sugerido > 0 THEN 
              (${campoExistencia}::decimal / pg.stock_sugerido) * 100
            ELSE 0
          END) as promedio_nivel_stock
        FROM productos_genericos pg
        WHERE pg.esta_borrado = false
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      return {
        total_productos: parseInt(stats.total_productos) || 0,
        productos_sin_stock: parseInt(stats.productos_sin_stock) || 0,
        productos_negativos: parseInt(stats.productos_negativos) || 0,
        productos_criticos: parseInt(stats.productos_criticos) || 0,
        productos_bajos: parseInt(stats.productos_bajos) || 0,
        total_existencias: parseInt(stats.total_existencias) || 0,
        productos_sin_stock_sugerido: parseInt(stats.productos_sin_stock_sugerido) || 0,
        promedio_nivel_stock: Math.round(parseFloat(stats.promedio_nivel_stock) || 0),
        sistema: sistema
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de inventario:', error);
      return {
        total_productos: 0,
        productos_sin_stock: 0,
        productos_negativos: 0,
        productos_criticos: 0,
        productos_bajos: 0,
        total_existencias: 0,
        productos_sin_stock_sugerido: 0,
        promedio_nivel_stock: 0,
        sistema: sistema
      };
    }
  }

  // Mostrar productos con stock crítico
  static async showProductosCriticos(req, res) {
    try {
      const sistema = 'GENERAL';
      const limite = 20;
      const pagina = parseInt(req.query.pagina) || 1;
      const offset = (pagina - 1) * limite;

      const campoExistencia = sistema === 'GENERAL' 
        ? 'pg.existencia' 
        : 'pg.existencia';

      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          pg.existencia as existencia_almacen_general,
          pg.existencia_oficialia,
          ${campoExistencia} as existencia,
          pg.stock_min,
          pg.stock_sugerido,
          p.partida,
          p.clave_objeto_del_gasto,
          CASE 
            WHEN ${campoExistencia} < 0 THEN 'negative'
            WHEN pg.stock_sugerido = 0 THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND ${campoExistencia} <= (pg.stock_sugerido * 0.24) THEN 'critical'
            ELSE 'normal'
          END as stock_status,
          CASE 
            WHEN pg.stock_sugerido > 0 THEN 
              ROUND((${campoExistencia}::decimal / pg.stock_sugerido) * 100, 2)
            ELSE 0
          END as stock_percentage
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        WHERE pg.esta_borrado = false 
        AND (
          ${campoExistencia} < 0 
          OR pg.stock_sugerido = 0 
          OR (pg.stock_sugerido > 0 AND ${campoExistencia} <= (pg.stock_sugerido * 0.24))
        )
        ORDER BY 
          CASE 
            WHEN ${campoExistencia} < 0 THEN 1
            WHEN pg.stock_sugerido = 0 THEN 2
            ELSE 3
          END,
          pg.producto_generico ASC
        LIMIT $1 OFFSET $2
      `;

      const result = await pool.query(query, [limite, offset]);

      // Obtener total para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM productos_genericos pg
        WHERE pg.esta_borrado = false 
        AND (
          ${campoExistencia} < 0 
          OR pg.stock_sugerido = 0 
          OR (pg.stock_sugerido > 0 AND ${campoExistencia} <= (pg.stock_sugerido * 0.24))
        )
      `;

      const countResult = await pool.query(countQuery);
      const total = parseInt(countResult.rows[0].total);

      res.render('inventory/oficialia/productos-criticos', {
        title: 'Productos con Stock Crítico - General',
        user: req.session.user,
        products: result.rows,
        pagination: {
          paginaActual: pagina,
          totalPaginas: Math.ceil(total / limite),
          total: total
        },
        sistema: sistema,
        currentPage: 'productos-criticos-general'
      });
    } catch (error) {
      console.error('Error al mostrar productos críticos:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar productos con stock crítico',
        user: req.session.user
      });
    }
  }

  // API para obtener estadísticas en tiempo real
  static async getEstadisticasAPI(req, res) {
    try {
      const sistema = req.query.sistema || 'GENERAL';
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