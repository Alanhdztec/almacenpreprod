// ========================================
// MODELS/INVENTARIO.JS - CORREGIDO CON FILTROS FUNCIONALES
// ========================================

const pool = require('../config/database');

class Inventory {
  // Obtener productos genéricos con paginación y filtros - CORREGIDO
  static async getProductsGeneric(limite = 20, offset = 0, search = '', sistema = 'GENERAL') {
    try {
      // Determinar qué campo de existencia usar según el sistema
      const campoExistencia = sistema === 'OFICIALIA' 
        ? 'pg.existencia_oficialia as existencia' 
        : 'pg.existencia as existencia';
      
      // Determinar el campo para el estado del stock según el sistema
      const campoStockStatus = sistema === 'OFICIALIA' 
        ? `CASE 
            WHEN pg.existencia_oficialia < 0 THEN 'negative'
            WHEN pg.stock_sugerido = 0 THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia_oficialia <= (pg.stock_sugerido * 0.24) THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia_oficialia <= (pg.stock_sugerido * 0.49) THEN 'low'
            WHEN pg.stock_sugerido > 0 AND pg.existencia_oficialia <= (pg.stock_sugerido * 0.74) THEN 'medium'
            ELSE 'good'
          END as stock_status`
        : `CASE 
            WHEN pg.existencia < 0 THEN 'negative'
            WHEN pg.stock_sugerido = 0 THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia <= (pg.stock_sugerido * 0.24) THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia <= (pg.stock_sugerido * 0.49) THEN 'low'
            WHEN pg.stock_sugerido > 0 AND pg.existencia <= (pg.stock_sugerido * 0.74) THEN 'medium'
            ELSE 'good'
          END as stock_status`;
      
      // Determinar el campo para el porcentaje de stock según el sistema
      const campoStockPercentage = sistema === 'OFICIALIA' 
        ? `CASE 
            WHEN pg.stock_sugerido > 0 THEN 
              ROUND((pg.existencia_oficialia::decimal / pg.stock_sugerido) * 100, 2)
            ELSE 0
          END as stock_percentage`
        : `CASE 
            WHEN pg.stock_sugerido > 0 THEN 
              ROUND((pg.existencia::decimal / pg.stock_sugerido) * 100, 2)
            ELSE 0
          END as stock_percentage`;
      
      // Determinar la descripción del stock según el sistema
      const campoStockDescription = sistema === 'OFICIALIA' 
        ? `CASE 
            WHEN pg.stock_sugerido = 0 THEN 'Definir stock sugerido'
            WHEN pg.stock_sugerido > 0 THEN 
              CONCAT(
                ROUND((pg.existencia_oficialia::decimal / pg.stock_sugerido) * 100, 1), 
                '% del stock sugerido (oficialía)'
              )
            ELSE 'N/A'
          END as stock_description`
        : `CASE 
            WHEN pg.stock_sugerido = 0 THEN 'Definir stock sugerido'
            WHEN pg.stock_sugerido > 0 THEN 
              CONCAT(
                ROUND((pg.existencia::decimal / pg.stock_sugerido) * 100, 1), 
                '% del stock sugerido (almacén general)'
              )
            ELSE 'N/A'
          END as stock_description`;

      let whereConditions = ['pg.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // CORREGIDO: Aplicar filtro de búsqueda si existe
      if (search && search.trim() !== '') {
        whereConditions.push(`pg.producto_generico ILIKE $${paramIndex}`);
        queryParams.push(`%${search.trim()}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          -- Mostrar ambas existencias pero usar la correspondiente al sistema como principal
          pg.existencia as existencia_almacen_general,
          pg.existencia_oficialia,
          (pg.existencia + pg.existencia_oficialia) as existencia_total,
          ${campoExistencia},
          pg.stock_min,
          pg.stock_sugerido,
          p.partida,
          p.clave_objeto_del_gasto,
          ${campoStockStatus},
          ${campoStockPercentage},
          ${campoStockDescription}
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        ${whereClause}
        ORDER BY pg.producto_generico ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limite, offset);
      
      const result = await pool.query(query, queryParams);
      
      // Obtener total de registros para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remover limit y offset
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      return {
        products: result.rows,
        total: total
      };
    } catch (error) {
      console.error('Error al obtener productos genéricos:', error);
      throw error;
    }
  }

  // NUEVO: Método mejorado para filtros avanzados (búsqueda por nombre y partida)
  static async getProductsWithFilters(filters = {}, limite = 20, offset = 0, sistema = 'GENERAL') {
    try {
      const { nombre, partida } = filters;
      
      // Determinar qué campo de existencia usar según el sistema
      const campoExistencia = sistema === 'OFICIALIA' 
        ? 'pg.existencia_oficialia as existencia' 
        : 'pg.existencia as existencia';
      
      // Determinar el campo para el estado del stock según el sistema
      const campoStockStatus = sistema === 'OFICIALIA' 
        ? `CASE 
            WHEN pg.existencia_oficialia < 0 THEN 'negative'
            WHEN pg.stock_sugerido = 0 THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia_oficialia <= (pg.stock_sugerido * 0.24) THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia_oficialia <= (pg.stock_sugerido * 0.49) THEN 'low'
            WHEN pg.stock_sugerido > 0 AND pg.existencia_oficialia <= (pg.stock_sugerido * 0.74) THEN 'medium'
            ELSE 'good'
          END as stock_status`
        : `CASE 
            WHEN pg.existencia < 0 THEN 'negative'
            WHEN pg.stock_sugerido = 0 THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia <= (pg.stock_sugerido * 0.24) THEN 'critical'
            WHEN pg.stock_sugerido > 0 AND pg.existencia <= (pg.stock_sugerido * 0.49) THEN 'low'
            WHEN pg.stock_sugerido > 0 AND pg.existencia <= (pg.stock_sugerido * 0.74) THEN 'medium'
            ELSE 'good'
          END as stock_status`;
      
      // Determinar el campo para el porcentaje de stock según el sistema
      const campoStockPercentage = sistema === 'OFICIALIA' 
        ? `CASE 
            WHEN pg.stock_sugerido > 0 THEN 
              ROUND((pg.existencia_oficialia::decimal / pg.stock_sugerido) * 100, 2)
            ELSE 0
          END as stock_percentage`
        : `CASE 
            WHEN pg.stock_sugerido > 0 THEN 
              ROUND((pg.existencia::decimal / pg.stock_sugerido) * 100, 2)
            ELSE 0
          END as stock_percentage`;
      
      // Determinar la descripción del stock según el sistema
      const campoStockDescription = sistema === 'OFICIALIA' 
        ? `CASE 
            WHEN pg.stock_sugerido = 0 THEN 'Definir stock sugerido'
            WHEN pg.stock_sugerido > 0 THEN 
              CONCAT(
                ROUND((pg.existencia_oficialia::decimal / pg.stock_sugerido) * 100, 1), 
                '% del stock sugerido (oficialía)'
              )
            ELSE 'N/A'
          END as stock_description`
        : `CASE 
            WHEN pg.stock_sugerido = 0 THEN 'Definir stock sugerido'
            WHEN pg.stock_sugerido > 0 THEN 
              CONCAT(
                ROUND((pg.existencia::decimal / pg.stock_sugerido) * 100, 1), 
                '% del stock sugerido (almacén general)'
              )
            ELSE 'N/A'
          END as stock_description`;

      let whereConditions = ['pg.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // Filtro por nombre de producto
      if (nombre && nombre.trim() !== '') {
        whereConditions.push(`pg.producto_generico ILIKE $${paramIndex}`);
        queryParams.push(`%${nombre.trim()}%`);
        paramIndex++;
      }

      // Filtro por partida
      if (partida && partida.trim() !== '') {
        whereConditions.push(`p.id_partida = $${paramIndex}`);
        queryParams.push(partida.trim());
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          -- Mostrar ambas existencias pero usar la correspondiente al sistema como principal
          pg.existencia as existencia_almacen_general,
          pg.existencia_oficialia,
          (pg.existencia + pg.existencia_oficialia) as existencia_total,
          ${campoExistencia},
          pg.stock_min,
          pg.stock_sugerido,
          p.partida,
          p.clave_objeto_del_gasto,
          ${campoStockStatus},
          ${campoStockPercentage},
          ${campoStockDescription}
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        ${whereClause}
        ORDER BY pg.producto_generico ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limite, offset);
      
      const result = await pool.query(query, queryParams);
      
      // Obtener total de registros para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remover limit y offset
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      return {
        products: result.rows,
        total: total
      };
    } catch (error) {
      console.error('Error al obtener productos con filtros:', error);
      throw error;
    }
  }

  // Obtener detalles completos de un producto específico - SIN CAMBIOS
  static async getProductDetails(idProductoGenerico, sistema = 'GENERAL') {
    try {
      // Determinar qué existencia usar para cálculos según el sistema
      const campoExistenciaCalculo = sistema === 'OFICIALIA' 
        ? 'pg.existencia_oficialia' 
        : 'pg.existencia';
      
      const query = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          -- Mostrar ambas existencias
          pg.existencia as existencia_almacen_general,
          pg.existencia_oficialia,
          (pg.existencia + pg.existencia_oficialia) as existencia_total,
          pg.stock_min,
          pg.stock_sugerido,
          p.partida,
          p.clave_objeto_del_gasto,
          
          -- Información de presentaciones
          COALESCE(
            JSON_AGG(
              CASE 
                WHEN pr.id_producto IS NOT NULL THEN
                  JSON_BUILD_OBJECT(
                    'id_producto', pr.id_producto,
                    'codigo', pr.codigo,
                    'id_unidad_principal', u1.id_unidad,
                    'unidad_principal', u1.unidad,
                    'unidad_principal_abrev', u1.abreviatura,
                    'cantidad_secundaria', pr.cantidad_secundaria,
                    'id_unidad_secundaria', u2.id_unidad,
                    'unidad_secundaria', u2.unidad,
                    'unidad_secundaria_abrev', u2.abreviatura,
                    'es_presentacion_multiple', CASE WHEN pr.cantidad_secundaria IS NOT NULL THEN true ELSE false END,
                    'descripcion_conversion', 
                      CASE 
                        WHEN pr.cantidad_secundaria IS NOT NULL AND u2.unidad IS NOT NULL THEN
                          '1 ' || u1.abreviatura || ' = ' || pr.cantidad_secundaria || ' ' || u2.abreviatura
                        ELSE 
                          'Presentación individual'
                      END,
                    -- Stock calculado basado en el sistema activo
                    'stock_calculado_principal', 
                      CASE 
                        WHEN pr.cantidad_secundaria IS NOT NULL THEN
                          ROUND(${campoExistenciaCalculo}::decimal / pr.cantidad_secundaria, 2)
                        ELSE 
                          ${campoExistenciaCalculo}
                      END,
                    -- También mantener el total para referencia
                    'stock_calculado_total', 
                      CASE 
                        WHEN pr.cantidad_secundaria IS NOT NULL THEN
                          ROUND((pg.existencia + pg.existencia_oficialia)::decimal / pr.cantidad_secundaria, 2)
                        ELSE 
                          (pg.existencia + pg.existencia_oficialia)
                      END
                  )
                ELSE NULL
              END
              ORDER BY pr.id_producto ASC
            ) FILTER (WHERE pr.id_producto IS NOT NULL), 
            '[]'::json
          ) as presentaciones
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        LEFT JOIN productos pr ON pg.id_producto_generico = pr.id_producto_generico 
          AND pr.esta_borrado = false
        LEFT JOIN unidades u1 ON pr.id_unidad = u1.id_unidad
        LEFT JOIN unidades u2 ON pr.id_unidad_secundaria = u2.id_unidad
        WHERE pg.id_producto_generico = $1 AND pg.esta_borrado = false
        GROUP BY pg.id_producto_generico, pg.producto_generico, pg.existencia, pg.existencia_oficialia,
                pg.stock_min, pg.stock_sugerido, p.partida, p.clave_objeto_del_gasto
      `;
      
      const result = await pool.query(query, [idProductoGenerico]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const product = result.rows[0];
      
      // Calcular estado del stock basado en el sistema activo
      const existencia = sistema === 'OFICIALIA' 
        ? product.existencia_oficialia 
        : product.existencia_almacen_general;
      
      let stockStatus = 'good';
      let stockPercentage = 0;
      let stockDescription = 'N/A';
      const sistemaNombre = sistema === 'OFICIALIA' ? 'oficialía' : 'almacén general';
      
      if (existencia < 0) {
        stockStatus = 'negative';
        stockDescription = `Existencia negativa en ${sistemaNombre}`;
      } else if (product.stock_sugerido === 0) {
        stockStatus = 'critical';
        stockDescription = 'Definir stock sugerido';
      } else if (product.stock_sugerido > 0) {
        stockPercentage = Math.round((existencia / product.stock_sugerido) * 100);
        stockDescription = `${stockPercentage}% del stock sugerido (${sistemaNombre})`;
        
        if (stockPercentage <= 24) stockStatus = 'critical';
        else if (stockPercentage <= 49) stockStatus = 'low';
        else if (stockPercentage <= 74) stockStatus = 'medium';
        else stockStatus = 'good';
      }
      
      return {
        ...product,
        stock_status: stockStatus,
        stock_percentage: stockPercentage,
        stock_description: stockDescription,
        sistema: sistema
      };
    } catch (error) {
      console.error('Error al obtener detalles del producto:', error);
      throw error;
    }
  }

  // Obtener estadísticas detalladas de un producto - SIN CAMBIOS
  static async getProductStatistics(idProductoGenerico, sistema = 'GENERAL') {
    try {
      const query = `
        SELECT 
          COALESCE(SUM(CASE 
            WHEN ved.fecha_de_entrada >= CURRENT_DATE - INTERVAL '30 days' 
            THEN ved_det.cantidad 
            ELSE 0 
          END), 0) as entradas_30_dias,
          
          COALESCE(SUM(CASE 
            WHEN vsd.fecha_de_salida >= CURRENT_DATE - INTERVAL '30 days' 
            THEN vsd_det.cantidad 
            ELSE 0 
          END), 0) as salidas_30_dias,
          
          MAX(ved.fecha_de_entrada) as ultima_entrada,
          MAX(vsd.fecha_de_salida) as ultima_salida,
          
          COUNT(DISTINCT ved.id_vale_de_entrada) + COUNT(DISTINCT vsd.id_vale_de_salida) as total_movimientos
          
        FROM productos_genericos pg
        LEFT JOIN productos pr ON pg.id_producto_generico = pr.id_producto_generico
        LEFT JOIN vales_de_entrada_detalle ved_det ON pr.id_producto = ved_det.id_producto
        LEFT JOIN vales_de_entrada ved ON ved_det.id_vale_de_entrada = ved.id_vale_de_entrada
        LEFT JOIN vales_de_salida_detalle vsd_det ON pr.id_producto = vsd_det.id_producto
        LEFT JOIN vales_de_salida vsd ON vsd_det.id_vale_de_salida = vsd.id_vale_de_salida
        WHERE pg.id_producto_generico = $1
        GROUP BY pg.id_producto_generico
      `;
      
      const result = await pool.query(query, [idProductoGenerico]);
      
      const estadisticas = result.rows[0] || {
        entradas_30_dias: 0,
        salidas_30_dias: 0,
        ultima_entrada: null,
        ultima_salida: null,
        total_movimientos: 0
      };
      
      // Añadir información del sistema a las estadísticas
      return {
        ...estadisticas,
        sistema: sistema
      };
    } catch (error) {
      console.error('Error al obtener estadísticas del producto:', error);
      throw error;
    }
  }

  // Obtener todas las partidas para el filtro - SIN CAMBIOS
  static async getPartidas() {
    try {
      const query = `
        SELECT id_partida, partida, clave_objeto_del_gasto
        FROM partidas 
        WHERE esta_borrado = false 
        ORDER BY partida ASC
      `;
      
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener partidas:', error);
      throw error;
    }
  }
}

module.exports = Inventory;