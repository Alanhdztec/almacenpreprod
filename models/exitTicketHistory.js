// ========================================
// MODELS/EXITTICKETHISTORY.JS - MODELO PARA HISTORIAL DE VALES DE SALIDA
// ========================================

const pool = require('../config/database');

class ExitTicketHistory {
  
  // Obtener historial de vales de salida con filtros y paginación
  static async getExitTicketsHistory(filters = {}, page = 1, limit = 10, sistema = null) {
    try {
      const offset = (page - 1) * limit;
      let whereConditions = ['vs.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // 🔧 FILTRO POR SISTEMA
      if (sistema === 'OFICIALIA') {
        whereConditions.push(`vs.es_oficialia = $${paramIndex}`);
        queryParams.push(true);
        paramIndex++;
      } else if (sistema === 'GENERAL') {
        whereConditions.push(`vs.es_oficialia = $${paramIndex}`);
        queryParams.push(false);
        paramIndex++;
      }

      // Filtro por fecha desde
      if (filters.fecha_desde) {
        whereConditions.push(`DATE(vs.fecha_de_salida) >= $${paramIndex}`);
        queryParams.push(filters.fecha_desde);
        paramIndex++;
      }

      // Filtro por fecha hasta
      if (filters.fecha_hasta) {
        whereConditions.push(`DATE(vs.fecha_de_salida) <= $${paramIndex}`);
        queryParams.push(filters.fecha_hasta);
        paramIndex++;
      }

      // Filtro por área
      if (filters.area && filters.area !== '') {
        whereConditions.push(`vs.id_area = $${paramIndex}`);
        queryParams.push(parseInt(filters.area));
        paramIndex++;
      }

      // Filtro por estatus
      if (filters.estatus && filters.estatus !== '') {
        whereConditions.push(`vs.id_estatus_de_captura = $${paramIndex}`);
        queryParams.push(parseInt(filters.estatus));
        paramIndex++;
      }

      // Filtro por número de factura
      if (filters.numero_factura && filters.numero_factura.trim() !== '') {
        whereConditions.push(`vs.numero_de_factura ILIKE $${paramIndex}`);
        queryParams.push(`%${filters.numero_factura.trim()}%`);
        paramIndex++;
      }

      // Filtro por empleado que entrega
      if (filters.empleado_entrega && filters.empleado_entrega !== '') {
        whereConditions.push(`vs.id_empleado_entrega = $${paramIndex}`);
        queryParams.push(parseInt(filters.empleado_entrega));
        paramIndex++;
      }

      // Filtro por empleado que recibe
      if (filters.empleado_recibe && filters.empleado_recibe !== '') {
        whereConditions.push(`vs.id_empleado_recibe = $${paramIndex}`);
        queryParams.push(parseInt(filters.empleado_recibe));
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          vs.id_vale_de_salida,
          vs.fecha_de_salida,
          vs.numero_de_factura,
          vs.es_oficialia,
          vs.observaciones,
          vs.esta_concluida,
          req.requisicion_de_salida,
          a.descripcion as area_descripcion,
          a.clave_area,
          a.clave_subarea,
          emp_entrega.nombres as empleado_entrega_nombres,
          emp_entrega.apellido1 as empleado_entrega_apellido1,
          emp_entrega.apellido2 as empleado_entrega_apellido2,
          emp_recibe.nombres as empleado_recibe_nombres,
          emp_recibe.apellido1 as empleado_recibe_apellido1,
          emp_recibe.apellido2 as empleado_recibe_apellido2,
          est.estatus_de_captura,
          
          -- Contar productos del vale
          (SELECT COUNT(*) FROM vales_de_salida_detalle vsd 
           WHERE vsd.id_vale_de_salida = vs.id_vale_de_salida 
           AND vsd.esta_borrado = false) as total_productos
           
        FROM vales_de_salida vs
        LEFT JOIN requisiciones_de_salida req ON vs.id_requisicion_de_salida = req.id_requisicion_de_salida
        LEFT JOIN areas a ON vs.id_area = a.id_area
        LEFT JOIN empleados emp_entrega ON vs.id_empleado_entrega = emp_entrega.id_empleado
        LEFT JOIN empleados emp_recibe ON vs.id_empleado_recibe = emp_recibe.id_empleado
        LEFT JOIN estatus_de_captura est ON vs.id_estatus_de_captura = est.id_estatus_de_captura
        ${whereClause}
        ORDER BY vs.fecha_de_salida DESC, vs.id_vale_de_salida DESC
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
        FROM vales_de_salida vs
        LEFT JOIN areas a ON vs.id_area = a.id_area
        LEFT JOIN empleados emp_entrega ON vs.id_empleado_entrega = emp_entrega.id_empleado
        LEFT JOIN empleados emp_recibe ON vs.id_empleado_recibe = emp_recibe.id_empleado
        ${whereClause}
      `;
      
      const countParams = queryParams.slice(0, -2); // Remover limit y offset
      const countResult = await pool.query(countQuery, countParams);
      const total = parseInt(countResult.rows[0].total);
      
      return {
        vales: result.rows.map(row => ({
          ...row,
          empleado_entrega_completo: `${row.empleado_entrega_nombres || ''} ${row.empleado_entrega_apellido1 || ''} ${row.empleado_entrega_apellido2 || ''}`.trim(),
          empleado_recibe_completo: `${row.empleado_recibe_nombres || ''} ${row.empleado_recibe_apellido1 || ''} ${row.empleado_recibe_apellido2 || ''}`.trim(),
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
      console.error('❌ Error al obtener historial de vales de salida:', error);
      throw error;
    }
  }

  // Obtener detalles completos de un vale de salida
  static async getExitTicketDetails(idValeSalida, sistema = null) {
    try {
      let whereConditions = ['vs.id_vale_de_salida = $1', 'vs.esta_borrado = false'];
      let queryParams = [idValeSalida];

      // 🔧 FILTRO POR SISTEMA
      if (sistema === 'OFICIALIA') {
        whereConditions.push('vs.es_oficialia = $2');
        queryParams.push(true);
      } else if (sistema === 'GENERAL') {
        whereConditions.push('vs.es_oficialia = $2');
        queryParams.push(false);
      }

      const whereClause = `WHERE ${whereConditions.join(' AND ')}`;

      // Información principal del vale
      const valeQuery = `
        SELECT 
          vs.*,
          req.requisicion_de_salida,
          a.descripcion as area_descripcion,
          a.clave_area,
          a.clave_subarea,
          emp_entrega.nombres as empleado_entrega_nombres,
          emp_entrega.apellido1 as empleado_entrega_apellido1,
          emp_entrega.apellido2 as empleado_entrega_apellido2,
          emp_entrega.correo as empleado_entrega_correo,
          emp_entrega.telefonos as empleado_entrega_telefono,
          emp_recibe.nombres as empleado_recibe_nombres,
          emp_recibe.apellido1 as empleado_recibe_apellido1,
          emp_recibe.apellido2 as empleado_recibe_apellido2,
          emp_recibe.correo as empleado_recibe_correo,
          emp_recibe.telefonos as empleado_recibe_telefono,
          est.estatus_de_captura,
          ea.descripcion as estructura_administrativa
        FROM vales_de_salida vs
        LEFT JOIN requisiciones_de_salida req ON vs.id_requisicion_de_salida = req.id_requisicion_de_salida
        LEFT JOIN areas a ON vs.id_area = a.id_area
        LEFT JOIN estructuras_administrativas ea ON a.id_estructura_administrativa = ea.id_estructura_administrativa
        LEFT JOIN empleados emp_entrega ON vs.id_empleado_entrega = emp_entrega.id_empleado
        LEFT JOIN empleados emp_recibe ON vs.id_empleado_recibe = emp_recibe.id_empleado
        LEFT JOIN estatus_de_captura est ON vs.id_estatus_de_captura = est.id_estatus_de_captura
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
          vsd.*,
          p.codigo,
          p.cantidad_secundaria,
          pg.producto_generico,
          u1.unidad as unidad_principal,
          u1.abreviatura as abreviatura
        FROM vales_de_salida_detalle vsd
        INNER JOIN productos p ON vsd.id_producto = p.id_producto
        INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
        INNER JOIN unidades u1 ON vsd.id_unidad = u1.id_unidad
        WHERE vsd.id_vale_de_salida = $1 AND vsd.esta_borrado = false
        ORDER BY vsd.id_vale_de_salida_detalle ASC
      `;

      const productosResult = await pool.query(productosQuery, [idValeSalida]);

      return {
        ...vale,
        empleado_entrega_completo: `${vale.empleado_entrega_nombres || ''} ${vale.empleado_entrega_apellido1 || ''} ${vale.empleado_entrega_apellido2 || ''}`.trim(),
        empleado_recibe_completo: `${vale.empleado_recibe_nombres || ''} ${vale.empleado_recibe_apellido1 || ''} ${vale.empleado_recibe_apellido2 || ''}`.trim(),
        tipo_almacen: vale.es_oficialia ? 'Oficialía Mayor' : 'Almacén General',
        productos: productosResult.rows
      };
    } catch (error) {
      console.error('❌ Error al obtener detalles del vale de salida:', error);
      throw error;
    }
  }

  // Obtener áreas para filtros
  static async getAreas(sistema = null) {
    try {
      const query = `
        SELECT id_area, descripcion, clave_area, clave_subarea
        FROM areas 
        WHERE esta_borrado = false 
        ORDER BY descripcion ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('❌ Error al obtener áreas:', error);
      throw error;
    }
  }

  // Obtener empleados para filtros
  static async getEmpleados(sistema = null) {
    try {
      const query = `
        SELECT id_empleado, nombres, apellido1, apellido2
        FROM empleados 
        WHERE esta_borrado = false 
        ORDER BY nombres ASC, apellido1 ASC
      `;
      const result = await pool.query(query);
      return result.rows.map(emp => ({
        ...emp,
        nombre_completo: `${emp.nombres || ''} ${emp.apellido1 || ''} ${emp.apellido2 || ''}`.trim()
      }));
    } catch (error) {
      console.error('❌ Error al obtener empleados:', error);
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
      let whereConditions = ['vs.esta_borrado = false'];
      let queryParams = [];
      let paramIndex = 1;

      // 🔧 FILTRO POR SISTEMA
      if (sistema === 'OFICIALIA') {
        whereConditions.push(`vs.es_oficialia = $${paramIndex}`);
        queryParams.push(true);
        paramIndex++;
      } else if (sistema === 'GENERAL') {
        whereConditions.push(`vs.es_oficialia = $${paramIndex}`);
        queryParams.push(false);
        paramIndex++;
      }

      // Aplicar mismos filtros que en el historial
      if (filters.fecha_desde) {
        whereConditions.push(`DATE(vs.fecha_de_salida) >= $${paramIndex}`);
        queryParams.push(filters.fecha_desde);
        paramIndex++;
      }

      if (filters.fecha_hasta) {
        whereConditions.push(`DATE(vs.fecha_de_salida) <= $${paramIndex}`);
        queryParams.push(filters.fecha_hasta);
        paramIndex++;
      }

      if (filters.area && filters.area !== '') {
        whereConditions.push(`vs.id_area = $${paramIndex}`);
        queryParams.push(parseInt(filters.area));
        paramIndex++;
      }

      if (filters.estatus && filters.estatus !== '') {
        whereConditions.push(`vs.id_estatus_de_captura = $${paramIndex}`);
        queryParams.push(parseInt(filters.estatus));
        paramIndex++;
      }

      if (filters.empleado_entrega && filters.empleado_entrega !== '') {
        whereConditions.push(`vs.id_empleado_entrega = $${paramIndex}`);
        queryParams.push(parseInt(filters.empleado_entrega));
        paramIndex++;
      }

      if (filters.empleado_recibe && filters.empleado_recibe !== '') {
        whereConditions.push(`vs.id_empleado_recibe = $${paramIndex}`);
        queryParams.push(parseInt(filters.empleado_recibe));
        paramIndex++;
      }

      const whereClause = whereConditions.length > 0 ? 
        `WHERE ${whereConditions.join(' AND ')}` : '';

      const query = `
        SELECT 
          COUNT(*) as total_vales,
          COUNT(CASE WHEN vs.esta_concluida = true THEN 1 END) as vales_concluidos,
          COUNT(CASE WHEN vs.esta_concluida = false THEN 1 END) as vales_pendientes,
          COUNT(CASE WHEN vs.es_oficialia = true THEN 1 END) as vales_oficialia,
          COUNT(CASE WHEN vs.es_oficialia = false THEN 1 END) as vales_almacen,
          COUNT(DISTINCT vs.id_area) as areas_distintas
        FROM vales_de_salida vs
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

module.exports = ExitTicketHistory;