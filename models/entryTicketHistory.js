// ========================================
// MODELS/ENTRYTICKETHISTORY.JS - CORREGIDO PARA TU BASE DE DATOS
// ========================================

const pool = require('../config/database');

class EntryTicketHistory {
  
  // Obtener historial de vales de entrada con filtros y paginación
  static async getEntryTicketsHistory(filters = {}, page = 1, limit = 10, sistema = null) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = ['ve.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // 🔧 FILTRO POR SISTEMA
      if (sistema === 'OFICIALIA') {
        whereConditions.push(`ve.es_oficialia = $${paramIndex}`);
        queryParams.push(true);
        paramIndex++;
      } else if (sistema === 'GENERAL') {
        whereConditions.push(`ve.es_oficialia = $${paramIndex}`);
        queryParams.push(false);
        paramIndex++;
      }

      // Filtro por fecha desde
      if (filters.fecha_desde) {
        whereConditions.push(`DATE(ve.fecha_de_entrada) >= $${paramIndex}`);
        queryParams.push(filters.fecha_desde);
        paramIndex++;
      }

      // Filtro por fecha hasta
      if (filters.fecha_hasta) {
        whereConditions.push(`DATE(ve.fecha_de_entrada) <= $${paramIndex}`);
        queryParams.push(filters.fecha_hasta);
        paramIndex++;
      }

      // Filtro por proveedor
      if (filters.proveedor && filters.proveedor !== '') {
        whereConditions.push(`ve.id_proveedor = $${paramIndex}`);
        queryParams.push(parseInt(filters.proveedor));
        paramIndex++;
      }

      // Filtro por partida
      if (filters.partida && filters.partida !== '') {
        whereConditions.push(`ve.id_partida = $${paramIndex}`);
        queryParams.push(parseInt(filters.partida));
        paramIndex++;
      }

      // Filtro por tipo de almacén
      if (filters.tipo_almacen && filters.tipo_almacen !== '') {
        const esOficialia = filters.tipo_almacen === 'oficialia';
        whereConditions.push(`ve.es_oficialia = $${paramIndex}`);
        queryParams.push(esOficialia);
        paramIndex++;
      }

      // Filtro por estatus
      if (filters.estatus && filters.estatus !== '') {
        whereConditions.push(`ve.id_estatus_de_captura = $${paramIndex}`);
        queryParams.push(parseInt(filters.estatus));
        paramIndex++;
      }

      // Filtro por número de factura
      if (filters.numero_factura && filters.numero_factura.trim() !== '') {
        whereConditions.push(`ve.numero_de_factura ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.numero_factura.trim()}%`);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          ve.id_vale_de_entrada,
          ve.fecha_de_entrada,
          ve.fecha_de_emision_factura,
          ve.numero_de_factura,
          ve.es_oficialia,
          ve.subtotal,
          ve.iva,
          ve.total,
          ve.observaciones,
          ve.esta_concluida,
          req.requisicion_de_entrada,
          prov.proveedor,
          prov.rfc as proveedor_rfc,
          part.partida,
          part.clave_objeto_del_gasto,
          tc.tipo_de_compra,
          rep.repartidor,
          emp.nombres as empleado_nombres,
          emp.apellido1 as empleado_apellido1,
          emp.apellido2 as empleado_apellido2,
          est.estatus_de_captura,
          
          -- Contar productos del vale
          (SELECT COUNT(*) FROM vales_de_entrada_detalle ved 
           WHERE ved.id_vale_de_entrada = ve.id_vale_de_entrada 
           AND ved.esta_borrado = false) as total_productos
           
        FROM vales_de_entrada ve
        LEFT JOIN requisiciones_de_entrada req ON ve.id_requisicion_de_entrada = req.id_requisicion_de_entrada
        LEFT JOIN proveedores prov ON ve.id_proveedor = prov.id_proveedor
        LEFT JOIN partidas part ON ve.id_partida = part.id_partida
        LEFT JOIN tipos_de_compra tc ON ve.id_tipo_de_compra = tc.id_tipo_de_compra
        LEFT JOIN repartidores rep ON ve.id_repartidor = rep.id_repartidor
        LEFT JOIN empleados emp ON ve.id_empleado = emp.id_empleado
        LEFT JOIN estatus_de_captura est ON ve.id_estatus_de_captura = est.id_estatus_de_captura
        ${whereClause}
        ORDER BY ve.fecha_de_entrada DESC, ve.id_vale_de_entrada DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      queryParams.push(limit, offset);
      
      console.log('🔍 Query ejecutada:', query);
      console.log('🔍 Parámetros:', queryParams);
      
      const result = await pool.query(query, queryParams);
      
      console.log(`✅ Vales encontrados: ${result.rows.length}`);
      
      // Obtener total de registros para paginación
      const countQuery = `
        SELECT COUNT(*) as total
        FROM vales_de_entrada ve
        LEFT JOIN proveedores prov ON ve.id_proveedor = prov.id_proveedor
        LEFT JOIN partidas part ON ve.id_partida = part.id_partida
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remover limit y offset
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      return {
        vales: result.rows.map(row => ({
          ...row,
          empleado_completo: `${row.empleado_nombres || ''} ${row.empleado_apellido1 || ''} ${row.empleado_apellido2 || ''}`.trim(),
          tipo_almacen: row.es_oficialia ? 'Oficialía Mayor' : 'Almacén General',
          tipo_almacen_short: row.es_oficialia ? 'oficialia' : 'almacen'
        })),
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          hasMore: page < Math.ceil(total / limit),
          limit: limit
        }
      };
    } catch (error) {
      console.error('❌ Error al obtener historial de vales de entrada:', error);
      throw error;
    }
  }

  // Obtener detalles completos de un vale de entrada
  static async getEntryTicketDetails(idValeEntrada, sistema = null) {
    try {
      let whereConditions = ['ve.id_vale_de_entrada = $1', 've.esta_borrado = false'];
      let queryParams = [idValeEntrada];

      // 🔧 FILTRO POR SISTEMA
      if (sistema === 'OFICIALIA') {
        whereConditions.push('ve.es_oficialia = $2');
        queryParams.push(true);
      } else if (sistema === 'GENERAL') {
        whereConditions.push('ve.es_oficialia = $2');
        queryParams.push(false);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Información principal del vale
      const valeQuery = `
        SELECT 
          ve.*,
          req.requisicion_de_entrada,
          prov.proveedor,
          prov.rfc as proveedor_rfc,
          prov.domicilio as proveedor_domicilio,
          prov.telefono as proveedor_telefono,
          part.partida,
          part.clave_objeto_del_gasto,
          tc.tipo_de_compra,
          rep.repartidor,
          emp.nombres as empleado_nombres,
          emp.apellido1 as empleado_apellido1,
          emp.apellido2 as empleado_apellido2,
          est.estatus_de_captura
        FROM vales_de_entrada ve
        LEFT JOIN requisiciones_de_entrada req ON ve.id_requisicion_de_entrada = req.id_requisicion_de_entrada
        LEFT JOIN proveedores prov ON ve.id_proveedor = prov.id_proveedor
        LEFT JOIN partidas part ON ve.id_partida = part.id_partida
        LEFT JOIN tipos_de_compra tc ON ve.id_tipo_de_compra = tc.id_tipo_de_compra
        LEFT JOIN repartidores rep ON ve.id_repartidor = rep.id_repartidor
        LEFT JOIN empleados emp ON ve.id_empleado = emp.id_empleado
        LEFT JOIN estatus_de_captura est ON ve.id_estatus_de_captura = est.id_estatus_de_captura
        ${whereClause}
      `;

      const valeResult = await pool.query(valeQuery, queryParams);
      
      if (valeResult.rows.length === 0) {
        return null;
      }

      const vale = valeResult.rows[0];

      // Obtener detalles de productos
      const productosQuery = `
        SELECT 
          ved.*,
          p.codigo,
          p.cantidad_secundaria,
          pg.producto_generico,
          u1.unidad as unidad_principal,
          u1.abreviatura as abreviatura
        FROM vales_de_entrada_detalle ved
        INNER JOIN productos p ON ved.id_producto = p.id_producto
        INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
        INNER JOIN unidades u1 ON ved.id_unidad = u1.id_unidad
        WHERE ved.id_vale_de_entrada = $1 AND ved.esta_borrado = false
        ORDER BY ved.id_vale_de_entrada_detalle ASC
      `;

      const productosResult = await pool.query(productosQuery, [idValeEntrada]);

      // Obtener archivos adjuntos
      const archivosQuery = `
        SELECT * FROM vales_de_entrada_archivos 
        WHERE id_vale_de_entrada = $1
        ORDER BY id_vale_de_entrada_archivos ASC
      `;

      const archivosResult = await pool.query(archivosQuery, [idValeEntrada]);

      return {
        ...vale,
        empleado_completo: `${vale.empleado_nombres || ''} ${vale.empleado_apellido1 || ''} ${vale.empleado_apellido2 || ''}`.trim(),
        tipo_almacen: vale.es_oficialia ? 'Oficialía Mayor' : 'Almacén General',
        productos: productosResult.rows,
        archivos: archivosResult.rows
      };
    } catch (error) {
      console.error('❌ Error al obtener detalles del vale de entrada:', error);
      throw error;
    }
  }

  // Obtener proveedores para filtros
  static async getProveedores(sistema = null) {
    try {
      const query = `
        SELECT id_proveedor, proveedor
        FROM proveedores 
        WHERE esta_borrado = false 
        ORDER BY proveedor ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Error al obtener proveedores:', error);
      throw error;
    }
  }

  // Obtener partidas para filtros
  static async getPartidas(sistema = null) {
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
      console.error('❌ Error al obtener partidas:', error);
      throw error;
    }
  }

  // Obtener estatus de captura para filtros
  static async getEstatusCaptura(sistema = null) {
    try {
      const query = `
        SELECT id_estatus_de_captura, estatus_de_captura
        FROM estatus_de_captura 
        WHERE esta_borrado = false 
        ORDER BY id_estatus_de_captura ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Error al obtener estatus de captura:', error);
      throw error;
    }
  }

  // Obtener estadísticas generales
  static async getStatistics(filters = {}, sistema = null) {
    try {
      let whereConditions = ['ve.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // 🔧 FILTRO POR SISTEMA
      if (sistema === 'OFICIALIA') {
        whereConditions.push(`ve.es_oficialia = $${paramIndex}`);
        queryParams.push(true);
        paramIndex++;
      } else if (sistema === 'GENERAL') {
        whereConditions.push(`ve.es_oficialia = $${paramIndex}`);
        queryParams.push(false);
        paramIndex++;
      }

      // Aplicar mismos filtros que en el historial
      if (filters.fecha_desde) {
        whereConditions.push(`DATE(ve.fecha_de_entrada) >= $${paramIndex}`);
        queryParams.push(filters.fecha_desde);
        paramIndex++;
      }

      if (filters.fecha_hasta) {
        whereConditions.push(`DATE(ve.fecha_de_entrada) <= $${paramIndex}`);
        queryParams.push(filters.fecha_hasta);
        paramIndex++;
      }

      if (filters.proveedor && filters.proveedor !== '') {
        whereConditions.push(`ve.id_proveedor = $${paramIndex}`);
        queryParams.push(parseInt(filters.proveedor));
        paramIndex++;
      }

      if (filters.partida && filters.partida !== '') {
        whereConditions.push(`ve.id_partida = $${paramIndex}`);
        queryParams.push(parseInt(filters.partida));
        paramIndex++;
      }

      if (filters.tipo_almacen && filters.tipo_almacen !== '') {
        const esOficialia = filters.tipo_almacen === 'oficialia';
        whereConditions.push(`ve.es_oficialia = $${paramIndex}`);
        queryParams.push(esOficialia);
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          COUNT(*) as total_vales,
          COUNT(CASE WHEN ve.esta_concluida = true THEN 1 END) as vales_concluidos,
          COUNT(CASE WHEN ve.esta_concluida = false THEN 1 END) as vales_pendientes,
          COUNT(CASE WHEN ve.es_oficialia = true THEN 1 END) as vales_oficialia,
          COUNT(CASE WHEN ve.es_oficialia = false THEN 1 END) as vales_almacen,
          COALESCE(SUM(ve.total), 0) as total_monetario,
          COALESCE(AVG(ve.total), 0) as promedio_vale
        FROM vales_de_entrada ve
        ${whereClause}
      `;

      const result = await pool.query(query, queryParams);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error al obtener estadísticas:', error);
      throw error;
    }
  }
}

module.exports = EntryTicketHistory;