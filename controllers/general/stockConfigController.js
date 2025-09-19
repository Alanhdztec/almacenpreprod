// ========================================
// CONTROLLERS/GENERAL/STOCKCONFIGCONTROLLER.JS - CONFIGURACIÓN DE STOCK MÍNIMO Y SUGERIDO
// ========================================

const pool = require('../../config/database');
const Inventory = require('../../models/Inventario');

class StockConfigController {
  // Mostrar página de configuración de stock
  static async showStockConfig(req, res) {
    try {
      // Verificar que es un jefe de almacén
      if (req.session.user.rol !== 'Jefe_almacen') {
        return res.status(403).render('error', {
          title: 'Acceso Denegado',
          message: 'No tienes permisos para acceder a esta sección.',
          user: req.session.user
        });
      }

      const sistema = 'GENERAL';
      const limite = 15;
      const pagina = parseInt(req.query.pagina) || 1;
      const offset = (pagina - 1) * limite;
      const search = req.query.search || '';
      const filtro = req.query.filtro || 'todos'; // todos, sin_configurar, configurados

      let whereConditions = ['pg.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // Filtro de búsqueda por nombre
      if (search && search.trim() !== '') {
        whereConditions.push(`pg.producto_generico ILIKE $${paramIndex}`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      // Filtro por estado de configuración
      if (filtro === 'sin_configurar') {
        whereConditions.push('(pg.stock_min = 0 OR pg.stock_sugerido = 0)');
      } else if (filtro === 'configurados') {
        whereConditions.push('(pg.stock_min > 0 AND pg.stock_sugerido > 0)');
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          pg.stock_min,
          pg.stock_sugerido,
          p.partida,
          p.clave_objeto_del_gasto,
          CASE 
            WHEN pg.stock_min = 0 AND pg.stock_sugerido = 0 THEN 'sin_configurar'
            WHEN pg.stock_min > 0 AND pg.stock_sugerido = 0 THEN 'parcial'
            WHEN pg.stock_min = 0 AND pg.stock_sugerido > 0 THEN 'parcial'
            WHEN pg.stock_min > 0 AND pg.stock_sugerido > 0 THEN 'configurado'
            ELSE 'sin_configurar'
          END as estado_configuracion
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        ${whereClause}
        ORDER BY 
          CASE 
            WHEN pg.stock_min = 0 AND pg.stock_sugerido = 0 THEN 1
            WHEN pg.stock_min > 0 AND pg.stock_sugerido = 0 THEN 2
            WHEN pg.stock_min = 0 AND pg.stock_sugerido > 0 THEN 2
            ELSE 3
          END,
          pg.producto_generico ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limite, offset);
      const result = await pool.query(query, queryParams);

      // Obtener total para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2);
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);

      // Obtener estadísticas
      const estadisticas = await StockConfigController.getEstadisticasStock();

      res.render('inventory/general/stock-config', {
        title: 'Configuración de Stock - General',
        user: req.session.user,
        products: result.rows,
        pagination: {
          paginaActual: pagina,
          totalPaginas: Math.ceil(total / limite),
          total: total
        },
        sistema: sistema,
        estadisticas: estadisticas,
        filtros: {
          search: search,
          filtro: filtro
        },
        currentPage: 'stock-config-general'
      });
    } catch (error) {
      console.error('Error al mostrar configuración de stock:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar configuración de stock',
        user: req.session.user
      });
    }
  }

  // Actualizar configuración de stock de un producto
  static async updateStock(req, res) {
    try {
      const { id_producto_generico, stock_min, stock_sugerido } = req.body;

      // Validaciones
      if (!id_producto_generico || stock_min === undefined || stock_sugerido === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Faltan datos requeridos'
        });
      }

      const stockMinNum = parseInt(stock_min);
      const stockSugeridoNum = parseInt(stock_sugerido);

      if (stockMinNum < 0 || stockSugeridoNum < 0) {
        return res.status(400).json({
          success: false,
          message: 'Los valores de stock no pueden ser negativos'
        });
      }

      if (stockMinNum > stockSugeridoNum && stockSugeridoNum > 0) {
        return res.status(400).json({
          success: false,
          message: 'El stock mínimo no puede ser mayor al stock sugerido'
        });
      }

      // Verificar que el producto existe
      const checkQuery = `
        SELECT producto_generico 
        FROM productos_genericos 
        WHERE id_producto_generico = $1 AND esta_borrado = false
      `;
      const checkResult = await pool.query(checkQuery, [id_producto_generico]);

      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      // Actualizar stock
      const updateQuery = `
        UPDATE productos_genericos 
        SET stock_min = $1, stock_sugerido = $2
        WHERE id_producto_generico = $3
        RETURNING producto_generico, stock_min, stock_sugerido
      `;

      const updateResult = await pool.query(updateQuery, [
        stockMinNum, 
        stockSugeridoNum, 
        id_producto_generico
      ]);

      res.json({
        success: true,
        message: 'Stock actualizado correctamente',
        data: updateResult.rows[0]
      });

    } catch (error) {
      console.error('Error al actualizar stock:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }

  // Actualización masiva de stock
  static async updateMassiveStock(req, res) {
    try {
      const { productos } = req.body;

      if (!productos || !Array.isArray(productos) || productos.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No se proporcionaron productos para actualizar'
        });
      }

      const client = await pool.connect();
      let actualizados = 0;
      let errores = [];

      try {
        await client.query('BEGIN');

        for (const producto of productos) {
          const { id_producto_generico, stock_min, stock_sugerido } = producto;
          
          // Validar cada producto
          if (!id_producto_generico || stock_min === undefined || stock_sugerido === undefined) {
            errores.push(`Producto ID ${id_producto_generico}: datos incompletos`);
            continue;
          }

          const stockMinNum = parseInt(stock_min);
          const stockSugeridoNum = parseInt(stock_sugerido);

          if (stockMinNum < 0 || stockSugeridoNum < 0) {
            errores.push(`Producto ID ${id_producto_generico}: valores negativos no permitidos`);
            continue;
          }

          if (stockMinNum > stockSugeridoNum && stockSugeridoNum > 0) {
            errores.push(`Producto ID ${id_producto_generico}: stock mínimo mayor al sugerido`);
            continue;
          }

          // Actualizar producto
          const updateQuery = `
            UPDATE productos_genericos 
            SET stock_min = $1, stock_sugerido = $2
            WHERE id_producto_generico = $3 AND esta_borrado = false
          `;

          const result = await client.query(updateQuery, [
            stockMinNum, 
            stockSugeridoNum, 
            id_producto_generico
          ]);

          if (result.rowCount > 0) {
            actualizados++;
          } else {
            errores.push(`Producto ID ${id_producto_generico}: no encontrado`);
          }
        }

        await client.query('COMMIT');

        res.json({
          success: true,
          message: `Actualización masiva completada: ${actualizados} productos actualizados`,
          actualizados: actualizados,
          errores: errores
        });

      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    } catch (error) {
      console.error('Error en actualización masiva:', error);
      res.status(500).json({
        success: false,
        message: 'Error en la actualización masiva'
      });
    } finally {
      if (client) {
        client.release();
      }
    }
  }

  // Obtener estadísticas de configuración de stock
  static async getEstadisticasStock() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_productos,
          COUNT(CASE WHEN stock_min = 0 AND stock_sugerido = 0 THEN 1 END) as sin_configurar,
          COUNT(CASE WHEN stock_min > 0 AND stock_sugerido > 0 THEN 1 END) as configurados,
          COUNT(CASE 
            WHEN (stock_min > 0 AND stock_sugerido = 0) 
            OR (stock_min = 0 AND stock_sugerido > 0) THEN 1 
          END) as parcialmente_configurados,
          COUNT(CASE 
            WHEN stock_sugerido > 0 AND existencia <= (stock_sugerido * 0.24) THEN 1 
          END) as productos_criticos,
          ROUND(AVG(CASE 
            WHEN stock_sugerido > 0 THEN (existencia::decimal / stock_sugerido) * 100
            ELSE 0
          END), 1) as promedio_nivel_stock
        FROM productos_genericos 
        WHERE esta_borrado = false
      `;

      const result = await pool.query(query);
      const stats = result.rows[0];

      return {
        total_productos: parseInt(stats.total_productos) || 0,
        sin_configurar: parseInt(stats.sin_configurar) || 0,
        configurados: parseInt(stats.configurados) || 0,
        parcialmente_configurados: parseInt(stats.parcialmente_configurados) || 0,
        productos_criticos: parseInt(stats.productos_criticos) || 0,
        promedio_nivel_stock: parseFloat(stats.promedio_nivel_stock) || 0,
        porcentaje_configurados: Math.round(
          (parseInt(stats.configurados) / parseInt(stats.total_productos)) * 100
        ) || 0
      };
    } catch (error) {
      console.error('Error al obtener estadísticas de stock:', error);
      return {
        total_productos: 0,
        sin_configurar: 0,
        configurados: 0,
        parcialmente_configurados: 0,
        productos_criticos: 0,
        promedio_nivel_stock: 0,
        porcentaje_configurados: 0
      };
    }
  }

  // API para obtener producto específico
  static async getProducto(req, res) {
    try {
      const { id } = req.params;

      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          pg.stock_min,
          pg.stock_sugerido,
          p.partida,
          p.clave_objeto_del_gasto
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        WHERE pg.id_producto_generico = $1 AND pg.esta_borrado = false
      `;

      const result = await pool.query(query, [id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Producto no encontrado'
        });
      }

      res.json({
        success: true,
        producto: result.rows[0]
      });
    } catch (error) {
      console.error('Error al obtener producto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener producto'
      });
    }
  }
}

module.exports = StockConfigController;