// ========================================
// MODELS/EXITTICKET.JS - SISTEMA AUTOMÁTICO POR SESIÓN
// ========================================

const pool = require('../config/database');

class ExitTicket {
  // Obtener áreas
  static async getAreas() {
    try {
      console.log('📋 [MODEL] Obteniendo áreas...');
      
      const query = `
        SELECT 
          a.id_area,
          a.descripcion,
          ea.clave_unidad_responsable,
          ea.clave_uro,
          a.clave_area,
          a.clave_subarea,
          a.clave_ocupacion,
          CONCAT(
            LPAD(ea.clave_unidad_responsable, 2, '0'), ' ', 
            LPAD(ea.clave_uro, 3, '0'), ' ', 
            LPAD(a.clave_area, 2, '0'), ' ', 
            LPAD(a.clave_subarea, 2, '0'), ' ', 
            a.clave_ocupacion, ' - ', 
            a.descripcion
          ) as area_display
        FROM areas a
        INNER JOIN estructuras_administrativas ea ON a.id_estructura_administrativa = ea.id_estructura_administrativa
        WHERE a.esta_borrado = false AND ea.esta_borrado = false
        ORDER BY 
          CAST(ea.clave_unidad_responsable AS INTEGER),
          CAST(ea.clave_uro AS INTEGER),
          CAST(a.clave_area AS INTEGER),
          CAST(a.clave_subarea AS INTEGER),
          CAST(a.clave_ocupacion AS INTEGER)
      `;
      
      const result = await pool.query(query);
      
      console.log(`✅ [MODEL] ${result.rows.length} áreas obtenidas`);
      
      // DEBUG: Mostrar TODAS las áreas
      console.log('DEBUG AREAS - TODAS:');
      result.rows.forEach(area => {
        console.log(`${area.id_area}: "${area.area_display}"`);
      });
      
      // DEBUG adicional: Ver si hay problemas en el JOIN
      console.log('\n🔍 DEBUG JOIN - Verificando datos:');
      const debugQuery = `
        SELECT 
          a.id_area,
          a.id_estructura_administrativa as area_id_estructura,
          ea.id_estructura_administrativa as estructura_id,
          ea.clave_unidad_responsable,
          ea.clave_uro,
          a.descripcion,
          a.esta_borrado as area_borrado,
          ea.esta_borrado as estructura_borrado
        FROM areas a
        LEFT JOIN estructuras_administrativas ea ON a.id_estructura_administrativa = ea.id_estructura_administrativa
        WHERE a.id_area <= 5
        ORDER BY a.id_area
      `;
      
      const debugResult = await pool.query(debugQuery);
      debugResult.rows.forEach(row => {
        console.log(`Area ID: ${row.id_area}, Area_estructura_id: ${row.area_id_estructura}, Estructura_id: ${row.estructura_id}, Descripcion: ${row.descripcion}`);
      });
      
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al obtener áreas:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  // Obtener estatus de captura (solo los 3 primeros)
  static async getEstatusCaptura() {
    try {
      console.log('📋 [MODEL] Obteniendo estatus de captura...');
      
      const query = `
        SELECT id_estatus_de_captura, estatus_de_captura
        FROM estatus_de_captura 
        WHERE esta_borrado = false AND id_estatus_de_captura <= 3
        ORDER BY id_estatus_de_captura ASC
      `;
      const result = await pool.query(query);
      console.log(`✅ [MODEL] ${result.rows.length} estatus obtenidos`);
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al obtener estatus de captura:', error);
      throw error;
    }
  }

  // Buscar productos por nombre - MOSTRANDO STOCK SEGÚN SISTEMA ACTIVO
  static async searchProductos(nombre, sistemaActivo = null) {
    try {
      console.log(`🔍 [MODEL] Buscando productos con: "${nombre}" (Sistema: ${sistemaActivo})`);
      
      const esOficialia = sistemaActivo === 'OFICIALIA';
      console.log(`📝 [MODEL] Buscando en ${esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'}`);
      
      let query, queryParams;
      
      if (esOficialia) {
        // Consulta para OFICIALÍA
        query = `
          SELECT 
            p.id_producto,
            p.id_unidad,
            p.codigo,
            p.cantidad_secundaria,
            pg.id_producto_generico,
            pg.producto_generico,
            pg.existencia as existencia_almacen_general,
            pg.existencia_oficialia,
            pg.existencia_oficialia as stock_disponible,
            u1.id_unidad as unidad_principal_id,
            u1.unidad as unidad_principal,
            u1.abreviatura as unidad_principal_abrev,
            u2.id_unidad as unidad_secundaria_id,
            u2.unidad as unidad_secundaria,
            u2.abreviatura as unidad_secundaria_abrev,
            
            CASE 
              WHEN p.cantidad_secundaria IS NOT NULL THEN 
                FLOOR(pg.existencia_oficialia / p.cantidad_secundaria)
              ELSE pg.existencia_oficialia
            END as disponible_presentacion,
            
            CASE 
              WHEN p.cantidad_secundaria IS NOT NULL THEN 
                CONCAT(pg.producto_generico, ' (', p.codigo, ' - ', u1.abreviatura, 
                      ' = ', p.cantidad_secundaria, ' ', u2.abreviatura, ') - Stock OF: ', 
                      pg.existencia_oficialia)
              ELSE CONCAT(pg.producto_generico, ' (', p.codigo, ' - ', u1.abreviatura, ') - Stock OF: ', 
                         pg.existencia_oficialia)
            END as producto_display
            
          FROM productos p
          INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
          INNER JOIN unidades u1 ON p.id_unidad = u1.id_unidad
          LEFT JOIN unidades u2 ON p.id_unidad_secundaria = u2.id_unidad
          WHERE p.esta_borrado = false 
            AND pg.esta_borrado = false 
            AND (
              pg.producto_generico ILIKE $1 
              OR p.codigo ILIKE $1
            )
            AND pg.existencia_oficialia > 0
          ORDER BY pg.producto_generico ASC, p.codigo ASC
          LIMIT 15
        `;
      } else {
        // Consulta para ALMACÉN GENERAL
        query = `
          SELECT 
            p.id_producto,
            p.id_unidad,
            p.codigo,
            p.cantidad_secundaria,
            pg.id_producto_generico,
            pg.producto_generico,
            pg.existencia as existencia_almacen_general,
            pg.existencia_oficialia,
            pg.existencia as stock_disponible,
            u1.id_unidad as unidad_principal_id,
            u1.unidad as unidad_principal,
            u1.abreviatura as unidad_principal_abrev,
            u2.id_unidad as unidad_secundaria_id,
            u2.unidad as unidad_secundaria,
            u2.abreviatura as unidad_secundaria_abrev,
            
            CASE 
              WHEN p.cantidad_secundaria IS NOT NULL THEN 
                FLOOR(pg.existencia / p.cantidad_secundaria)
              ELSE pg.existencia
            END as disponible_presentacion,
            
            CASE 
              WHEN p.cantidad_secundaria IS NOT NULL THEN 
                CONCAT(pg.producto_generico, ' (', p.codigo, ' - ', u1.abreviatura, 
                      ' = ', p.cantidad_secundaria, ' ', u2.abreviatura, ') - Stock AG: ', 
                      pg.existencia)
              ELSE CONCAT(pg.producto_generico, ' (', p.codigo, ' - ', u1.abreviatura, ') - Stock AG: ', 
                         pg.existencia)
            END as producto_display
            
          FROM productos p
          INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
          INNER JOIN unidades u1 ON p.id_unidad = u1.id_unidad
          LEFT JOIN unidades u2 ON p.id_unidad_secundaria = u2.id_unidad
          WHERE p.esta_borrado = false 
            AND pg.esta_borrado = false 
            AND (
              pg.producto_generico ILIKE $1 
              OR p.codigo ILIKE $1
            )
            AND pg.existencia > 0
          ORDER BY pg.producto_generico ASC, p.codigo ASC
          LIMIT 15
        `;
      }
      
      queryParams = [`%${nombre}%`];
      
      const result = await pool.query(query, queryParams);
      
      console.log(`📊 [MODEL] Resultados encontrados: ${result.rows.length}`);
      
      if (result.rows.length > 0) {
        console.log(`📦 [MODEL] Primer producto:`, {
          id: result.rows[0].id_producto,
          nombre: result.rows[0].producto_generico,
          stock_disponible: result.rows[0].stock_disponible,
          disponible_presentacion: result.rows[0].disponible_presentacion,
          sistema: esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'
        });
      } else {
        console.log(`⚠️ [MODEL] No se encontraron productos con stock en ${esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'} para: "${nombre}"`);
      }
      
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al buscar productos:', error);
      console.error('Stack trace:', error.stack);
      throw error;
    }
  }

  // Obtener requisiciones de salida
  static async getRequisicionesSalida() {
    try {
      console.log('📋 [MODEL] Obteniendo requisiciones de salida...');
      
      const query = `
        SELECT DISTINCT requisicion_de_salida
        FROM requisiciones_de_salida 
        WHERE esta_borrado = false
        ORDER BY requisicion_de_salida DESC
        LIMIT 20
      `;
      const result = await pool.query(query);
      console.log(`✅ [MODEL] ${result.rows.length} requisiciones obtenidas`);
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al obtener requisiciones de salida:', error);
      throw error;
    }
  }

  // Buscar requisiciones por texto
  static async searchRequisiciones(texto) {
    try {
      if (!texto || texto.length < 2) {
        return [];
      }

      const query = `
        SELECT requisicion_de_salida
        FROM requisiciones_de_salida 
        WHERE esta_borrado = false 
          AND requisicion_de_salida ILIKE $1
        GROUP BY requisicion_de_salida
        ORDER BY MAX(id_requisicion_de_salida) DESC
        LIMIT 5
      `;
      
      const result = await pool.query(query, [`%${texto}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error al buscar requisiciones:', error);
      throw error;
    }
  }

  // Obtener empleados de almacén
  static async getEmpleadosAlmacen() {
    try {
      console.log('👥 [MODEL] Obteniendo empleados de almacén...');
      
      const query = `
        SELECT 
          u.id_usuario,
          u.nombres,
          u.apellidos,
          u.id_empleado,
          r.rol,
          CONCAT(u.nombres, ' ', u.apellidos) as nombre_completo
        FROM usuarios u
        INNER JOIN roles r ON u.id_rol = r.id_rol
        WHERE u.esta_borrado = false 
          AND r.esta_borrado = false
          AND r.rol IN ('Jefe_almacen', 'almacen')
        ORDER BY u.nombres ASC, u.apellidos ASC
      `;
      const result = await pool.query(query);
      console.log(`✅ [MODEL] ${result.rows.length} empleados de almacén obtenidos`);
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al obtener empleados de almacén:', error);
      throw error;
    }
  }

  // Obtener todos los empleados
  static async getAllEmpleados() {
    try {
      console.log('👥 [MODEL] Obteniendo todos los empleados...');
      
      const query = `
        SELECT 
          e.id_empleado,
          e.nombres,
          e.apellido1,
          e.apellido2,
          c.cargo,
          CONCAT(e.nombres, ' ', e.apellido1, ' ', COALESCE(e.apellido2, '')) as nombre_completo
        FROM empleados e
        LEFT JOIN cargos c ON e.id_cargo = c.id_cargo
        WHERE e.esta_borrado = false
        ORDER BY e.nombres ASC, e.apellido1 ASC
      `;
      const result = await pool.query(query);
      console.log(`✅ [MODEL] ${result.rows.length} empleados obtenidos`);
      
      if (result.rows.length === 0) {
        console.warn('⚠️ [MODEL] No se encontraron empleados en la base de datos');
      }
      
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al obtener empleados:', error);
      throw error;
    }
  }
  static async searchProveedores(nombre) {
    try {
      console.log(`🔍 [MODEL] Buscando proveedores: "${nombre}"`);
      
      const query = `
        SELECT 
          id_proveedor,
          proveedor,
          rfc,
          domicilio,
          telefono
        FROM proveedores 
        WHERE esta_borrado = false 
          AND proveedor ILIKE $1
        ORDER BY proveedor ASC
        LIMIT 10
      `;
      
      const result = await pool.query(query, [`%${nombre}%`]);
      console.log(`✅ [MODEL] ${result.rows.length} proveedores encontrados`);
      
      return result.rows;
    } catch (error) {
      console.error('❌ [MODEL] Error al buscar proveedores:', error);
      throw error;
    }
  }

  // Crear vale de salida - SIMPLIFICADO SOLO CON SISTEMA DE SESIÓN
  static async createValeSalida(valeData, sistemaActivo) {
    const client = await pool.connect();
    
    try {
      console.log('🚀 [MODEL] Iniciando creación de vale de salida...');
      console.log('📦 [MODEL] Datos recibidos:', JSON.stringify(valeData, null, 2));
      console.log('🏢 [MODEL] Sistema activo:', sistemaActivo);
      
      await client.query('BEGIN');

      let idRequisicionSalida = null;

      // MANEJO DE REQUISICIÓN DE SALIDA
      if (valeData.requisicion_de_salida && valeData.requisicion_de_salida.trim()) {
        const textoRequisicion = valeData.requisicion_de_salida.trim();
        console.log(`📋 [MODEL] Procesando requisición: "${textoRequisicion}"`);
        
        // Buscar si ya existe
        const buscarRequisicion = `
          SELECT id_requisicion_de_salida 
          FROM requisiciones_de_salida 
          WHERE requisicion_de_salida = $1 AND esta_borrado = false
        `;
        
        const requisicionExistente = await client.query(buscarRequisicion, [textoRequisicion]);
        
        if (requisicionExistente.rows.length > 0) {
          idRequisicionSalida = requisicionExistente.rows[0].id_requisicion_de_salida;
          console.log(`✅ [MODEL] Usando requisición existente ID: ${idRequisicionSalida}`);
        } else {
          // Crear nueva
          const crearRequisicion = `
            INSERT INTO requisiciones_de_salida (requisicion_de_salida)
            VALUES ($1)
            RETURNING id_requisicion_de_salida
          `;
          
          const nuevaRequisicion = await client.query(crearRequisicion, [textoRequisicion]);
          idRequisicionSalida = nuevaRequisicion.rows[0].id_requisicion_de_salida;
          console.log(`✅ [MODEL] Nueva requisición creada ID: ${idRequisicionSalida}`);
        }
      } else {
        // Crear requisición automática
        const fechaActual = new Date();
        const año = fechaActual.getFullYear();
        const mes = String(fechaActual.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaActual.getDate()).padStart(2, '0');
        const timestamp = Date.now();
        
        const requisicionAuto = `SIN-REQ-SAL/${año}${mes}${dia}/${timestamp}`;
        console.log(`📋 [MODEL] Creando requisición automática: "${requisicionAuto}"`);
        
        const crearRequisicionAuto = `
          INSERT INTO requisiciones_de_salida (requisicion_de_salida)
          VALUES ($1)
          RETURNING id_requisicion_de_salida
        `;
        
        const requisicionAutoResult = await client.query(crearRequisicionAuto, [requisicionAuto]);
        idRequisicionSalida = requisicionAutoResult.rows[0].id_requisicion_de_salida;
        console.log(`✅ [MODEL] Requisición automática creada ID: ${idRequisicionSalida}`);
      }

      // DETERMINAR OFICIALÍA AUTOMÁTICAMENTE DESDE SISTEMA DE SESIÓN
      const esOficialia = sistemaActivo === 'OFICIALIA';
      console.log(`📋 [MODEL] Vale será de: ${esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'} (automático por sesión)`);

      // Insertar vale de salida
      console.log('📝 [MODEL] Insertando vale de salida...');
      
      const valeQuery = `
        INSERT INTO vales_de_salida (
          id_requisicion_de_salida, numero_de_factura, id_proveedor, fecha_de_salida, id_area, id_empleado_entrega,
          id_empleado_recibe, observaciones, id_estatus_de_captura, es_oficialia
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id_vale_de_salida
      `;

      const valeParams = [
        idRequisicionSalida,
        valeData.numero_de_factura || null,  
        valeData.id_proveedor || null,  
        valeData.fecha_de_salida,
        valeData.id_area || null,
        valeData.id_empleado_entrega,
        valeData.id_empleado_recibe || null,
        valeData.observaciones || null,
        valeData.id_estatus_de_captura || null,
        esOficialia // AUTOMÁTICO DESDE SESIÓN
      ];
      console.log('📝 [MODEL] Parámetros del vale:', valeParams);

      const valeResult = await client.query(valeQuery, valeParams);
      const idValeSalida = valeResult.rows[0].id_vale_de_salida;
      
      console.log(`✅ [MODEL] Vale de salida creado con ID: ${idValeSalida}`);

      // PROCESAR PRODUCTOS - DESCUENTO AUTOMÁTICO SEGÚN SESIÓN
      if (valeData.productos && valeData.productos.length > 0) {
        console.log(`📦 [MODEL] Procesando ${valeData.productos.length} productos...`);
        
        for (let i = 0; i < valeData.productos.length; i++) {
          const producto = valeData.productos[i];
          console.log(`📦 [MODEL] Procesando producto ${i + 1}:`, producto);
          
          // Validar datos del producto
          if (!producto.id_producto || !producto.cantidad || !producto.id_unidad) {
            throw new Error(`Producto ${i + 1} tiene datos incompletos`);
          }

          // Insertar detalle
          const detalleQuery = `
            INSERT INTO vales_de_salida_detalle (
              id_vale_de_salida, id_producto, cantidad, id_unidad, es_merma, nota
            ) VALUES ($1, $2, $3, $4, $5, $6)
          `;

          await client.query(detalleQuery, [
            idValeSalida,
            producto.id_producto,
            producto.cantidad,
            producto.id_unidad,
            producto.es_merma || false,
            producto.nota || null
          ]);

          console.log(`✅ [MODEL] Detalle insertado para producto ${producto.id_producto}`);

          // OBTENER INFORMACIÓN Y VALIDAR STOCK SEGÚN SISTEMA ACTIVO
          const getProductInfoQuery = `
            SELECT 
              p.cantidad_secundaria, 
              p.id_producto_generico,
              pg.producto_generico,
              pg.existencia as stock_almacen_general,
              pg.existencia_oficialia as stock_oficialia
            FROM productos p
            INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
            WHERE p.id_producto = $1
          `;
          
          const productInfo = await client.query(getProductInfoQuery, [producto.id_producto]);
          
          if (productInfo.rows.length === 0) {
            throw new Error(`No se encontró información del producto con ID: ${producto.id_producto}`);
          }

          const { 
            cantidad_secundaria, 
            id_producto_generico, 
            producto_generico,
            stock_almacen_general,
            stock_oficialia
          } = productInfo.rows[0];
          
          // Calcular cantidad a descontar
          const multiplicador = cantidad_secundaria || 1;
          const cantidadADescontar = parseFloat(producto.cantidad) * multiplicador;
          
          console.log(`📊 [MODEL] ${producto_generico}:`);
          console.log(`   - Cantidad solicitada: ${producto.cantidad}`);
          console.log(`   - Multiplicador: ${multiplicador}`);
          console.log(`   - A descontar: ${cantidadADescontar} unidades base`);

          // DETERMINAR DE QUÉ ALMACÉN DESCONTAR Y VALIDAR STOCK
          let updateExistenciaQuery;
          let stockDisponible;
          let tipoAlmacen;

          if (esOficialia) {
            // DESCONTAR DE OFICIALÍA
            stockDisponible = stock_oficialia;
            tipoAlmacen = 'OFICIALÍA';
            updateExistenciaQuery = `
              UPDATE productos_genericos 
              SET existencia_oficialia = existencia_oficialia - $1
              WHERE id_producto_generico = $2
            `;
          } else {
            // DESCONTAR DE ALMACÉN GENERAL
            stockDisponible = stock_almacen_general;
            tipoAlmacen = 'ALMACÉN GENERAL';
            updateExistenciaQuery = `
              UPDATE productos_genericos 
              SET existencia = existencia - $1
              WHERE id_producto_generico = $2
            `;
          }

          console.log(`   - Stock disponible en ${tipoAlmacen}: ${stockDisponible}`);

          // Verificar stock suficiente
          if (stockDisponible < cantidadADescontar) {
            throw new Error(`Stock insuficiente en ${tipoAlmacen} para "${producto_generico}". Disponible: ${stockDisponible}, Solicitado: ${cantidadADescontar}`);
          }

          // Actualizar existencia
          await client.query(updateExistenciaQuery, [cantidadADescontar, id_producto_generico]);
          
          console.log(`✅ [MODEL] Descontado ${cantidadADescontar} unidades de ${tipoAlmacen} para producto genérico ${id_producto_generico}`);
        }
      }

      await client.query('COMMIT');
      console.log(`🎉 [MODEL] Vale de salida ${idValeSalida} creado exitosamente desde ${esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'}`);
      
      return { id_vale_de_salida: idValeSalida, valeId: idValeSalida, success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ [MODEL] Error al crear vale de salida:', error);
      throw error;
    } finally {
      client.release();
    }
  }

}

module.exports = ExitTicket;