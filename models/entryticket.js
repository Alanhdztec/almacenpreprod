// ========================================
// MODELS/ENTRYTICKET.JS
// ========================================

const pool = require('../config/database');

class EntryTicket {
  // Obtener tipos de compra
  static async getTiposCompra() {
    try {
      const query = `
        SELECT id_tipo_de_compra, tipo_de_compra
        FROM tipos_de_compra 
        WHERE esta_borrado = false 
        ORDER BY tipo_de_compra ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener tipos de compra:', error);
      throw error;
    }
  }

  // Obtener partidas
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

  // Obtener estatus de captura (solo los 3 primeros)
  static async getEstatusCaptura() {
    try {
      const query = `
        SELECT id_estatus_de_captura, estatus_de_captura
        FROM estatus_de_captura 
        WHERE esta_borrado = false AND id_estatus_de_captura <= 3
        ORDER BY id_estatus_de_captura ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener estatus de captura:', error);
      throw error;
    }
  }

  // Buscar proveedores por nombre
  static async searchProveedores(nombre) {
    try {
      const query = `
        SELECT id_proveedor, proveedor, rfc, domicilio, telefono
        FROM proveedores 
        WHERE esta_borrado = false AND proveedor ILIKE $1
        ORDER BY proveedor ASC
        LIMIT 10
      `;
      const result = await pool.query(query, [`%${nombre}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error al buscar proveedores:', error);
      throw error;
    }
  }

  // Buscar requisiciones por texto (CORREGIDO - SQL sin DISTINCT problemático)
  static async searchRequisiciones(texto) {
    try {
      if (!texto || texto.length < 2) {
        return [];
      }

      const query = `
        SELECT requisicion_de_entrada
        FROM requisiciones_de_entrada 
        WHERE esta_borrado = false 
          AND requisicion_de_entrada ILIKE $1
        GROUP BY requisicion_de_entrada
        ORDER BY MAX(id_requisicion_de_entrada) DESC
        LIMIT 5
      `;
      
      const result = await pool.query(query, [`%${texto}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error al buscar requisiciones:', error);
      throw error;
    }
  }

  // Obtener repartidores por proveedor
  static async getRepartidoresByProveedor(idProveedor) {
    try {
      const query = `
        SELECT r.id_repartidor, r.repartidor, r.id_proveedor
        FROM repartidores r
        WHERE r.id_proveedor = $1 AND r.esta_borrado = false
        ORDER BY r.repartidor ASC
      `;
      const result = await pool.query(query, [idProveedor]);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener repartidores:', error);
      throw error;
    }
  }


  // Mantener el método original para el datalist inicial
  static async getRequisicionesEntrada() {
    try {
      const query = `
        SELECT DISTINCT requisicion_de_entrada
        FROM requisiciones_de_entrada 
        WHERE esta_borrado = false
        ORDER BY requisicion_de_entrada DESC
        LIMIT 20
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener requisiciones:', error);
      throw error;
    }
  }

  // Buscar productos por nombre
  static async searchProductos(nombre) {
    try {
      const query = `
        SELECT 
          p.id_producto,
          p.id_unidad,
          p.codigo,
          p.cantidad_secundaria,
          pg.producto_generico,
          u1.id_unidad as unidad_principal_id,
          u1.abreviatura as unidad_principal_abrev,
          u2.id_unidad as unidad_secundaria_id,
          u2.abreviatura as unidad_secundaria_abrev,
          CASE 
            WHEN p.cantidad_secundaria IS NOT NULL THEN 
              CONCAT(pg.producto_generico, ' (', p.codigo, ' - ', u1.abreviatura, 
                    ' = ', p.cantidad_secundaria, ' ', u2.abreviatura, ')')
            ELSE CONCAT(pg.producto_generico, ' (', p.codigo, ' - ', u1.abreviatura, ')')
          END as producto_display
        FROM productos p
        INNER JOIN productos_genericos pg ON p.id_producto_generico = pg.id_producto_generico
        INNER JOIN unidades u1 ON p.id_unidad = u1.id_unidad
        LEFT JOIN unidades u2 ON p.id_unidad_secundaria = u2.id_unidad
        WHERE p.esta_borrado = false 
          AND pg.esta_borrado = false 
          AND pg.producto_generico ILIKE $1
        ORDER BY pg.producto_generico ASC, p.codigo ASC
        LIMIT 15
      `;
      const result = await pool.query(query, [`%${nombre}%`]);
      return result.rows;
    } catch (error) {
      console.error('Error al buscar productos:', error);
      throw error;
    }
  }


  // Crear nuevo proveedor
  static async createProveedor(proveedorData) {
    try {
      const { proveedor, rfc, domicilio, telefono } = proveedorData;
      const query = `
        INSERT INTO proveedores (proveedor, rfc, domicilio, telefono)
        VALUES ($1, $2, $3, $4)
        RETURNING id_proveedor, proveedor, rfc, domicilio, telefono
      `;
      const result = await pool.query(query, [proveedor, rfc, domicilio, telefono]);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  }

  // Crear nuevo repartidor
  static async createRepartidor(repartidorData) {
    try {
      const { repartidor, id_proveedor } = repartidorData;
      const query = `
        INSERT INTO repartidores (repartidor, id_proveedor)
        VALUES ($1, $2)
        RETURNING id_repartidor, repartidor, id_proveedor
      `;
      const result = await pool.query(query, [repartidor, id_proveedor]);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear repartidor:', error);
      throw error;
    }
  }

  // Crear nuevo producto genérico con validación de duplicados
  static async createProductoGenerico(productoData) {
    try {
      const { id_partida, producto_generico, stock_min, stock_sugerido } = productoData;
      
      // PASO 1: Verificar si existe
      const checkQuery = `
        SELECT id_producto_generico, producto_generico
        FROM productos_genericos 
        WHERE LOWER(producto_generico) = LOWER($1) AND esta_borrado = false
      `;
      
      const checkResult = await pool.query(checkQuery, [producto_generico]);
      
      // PASO 2: Si existe, lanzar error inmediatamente
      if (checkResult.rows.length > 0) {
        throw new Error(`Ya existe un producto genérico con el nombre "${checkResult.rows[0].producto_generico}"`);
      }
      
      // PASO 3: Si no existe, proceder con el INSERT
      const insertQuery = `
        INSERT INTO productos_genericos (id_partida, producto_generico, stock_min, stock_sugerido)
        VALUES ($1, $2, $3, $4)
        RETURNING id_producto_generico, producto_generico, stock_min, stock_sugerido
      `;
      
      const result = await pool.query(insertQuery, [
        id_partida, 
        producto_generico, 
        stock_min || 0, 
        stock_sugerido || 0
      ]);
      
      return result.rows[0];
      
    } catch (error) {
      console.error('Error al crear producto genérico:', error);
      throw error;
    }
  }

  // Crear nueva presentación de producto
  static async createProducto(productoData) {
    try {
      const { id_producto_generico, codigo, id_unidad, cantidad_secundaria, id_unidad_secundaria } = productoData;
      const query = `
        INSERT INTO productos (id_producto_generico, codigo, id_unidad, cantidad_secundaria, id_unidad_secundaria)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id_producto, codigo, id_unidad, cantidad_secundaria, id_unidad_secundaria
      `;
      const result = await pool.query(query, [
        id_producto_generico, 
        codigo, 
        id_unidad, 
        cantidad_secundaria || null, 
        id_unidad_secundaria || null
      ]);
      return result.rows[0];
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  }

  // Obtener unidades
  static async getUnidades() {
    try {
      const query = `
        SELECT id_unidad, unidad, abreviatura
        FROM unidades 
        WHERE esta_borrado = false 
        ORDER BY unidad ASC
      `;
      const result = await pool.query(query);
      return result.rows;
    } catch (error) {
      console.error('Error al obtener unidades:', error);
      throw error;
    }
  }

  // Crear vale de entrada
  static async createValeEntrada(valeData) {
    const client = await pool.connect();
    const total = (parseFloat(valeData.subtotal) || 0) + (parseFloat(valeData.iva) || 0);
    
    try {
      await client.query('BEGIN');

      let idRequisicionEntrada = null;

      if (valeData.requisicion_de_entrada && valeData.requisicion_de_entrada.trim()) {
        const textoRequisicion = valeData.requisicion_de_entrada.trim();
                
        // 1. Buscar si ya existe esta requisición
        const buscarRequisicion = `
          SELECT id_requisicion_de_entrada 
          FROM requisiciones_de_entrada 
          WHERE requisicion_de_entrada = $1 AND esta_borrado = false
        `;
        
        const requisicionExistente = await client.query(buscarRequisicion, [textoRequisicion]);
        
        if (requisicionExistente.rows.length > 0) {
          // 2. Si existe, usar el ID existente
          idRequisicionEntrada = requisicionExistente.rows[0].id_requisicion_de_entrada;
          console.log(`✅ Usando requisición existente ID: ${idRequisicionEntrada}`);
        } else {
          // 3. Si NO existe, crear nueva entrada en requisiciones_entrada
          const crearRequisicion = `
            INSERT INTO requisiciones_de_entrada (requisicion_de_entrada)
            VALUES ($1)
            RETURNING id_requisicion_de_entrada
          `;
          
          const nuevaRequisicion = await client.query(crearRequisicion, [textoRequisicion]);
          idRequisicionEntrada = nuevaRequisicion.rows[0].id_requisicion_de_entrada;
          console.log(`✅ Nueva requisición creada ID: ${idRequisicionEntrada}`);
        }
      } else {
        // 🚫 SI NO SE PROPORCIONA REQUISICIÓN, LANZAR ERROR
        throw new Error('La requisición de entrada es obligatoria. Por favor ingrese una requisición.');
      }

      // DETERMINAR SI ES OFICIALÍA
      const esOficialia = valeData.es_oficialia === 'on' || valeData.es_oficialia === true || valeData.es_oficialia === 'true';
      console.log(`📋 Vale será de: ${esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'}`);

      // Insertar vale de entrada
      const valeQuery = `
        INSERT INTO vales_de_entrada (
          id_requisicion_de_entrada, fecha_de_entrada, fecha_de_emision_factura, numero_de_factura,
          id_tipo_de_compra, id_proveedor, id_partida, es_oficialia, subtotal, iva, total,
          observaciones, id_repartidor, id_empleado, id_estatus_de_captura
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING id_vale_de_entrada
      `;

      const valeResult = await client.query(valeQuery, [
        idRequisicionEntrada,
        valeData.fecha_de_entrada,
        valeData.fecha_de_emision_factura || null,
        valeData.numero_de_factura,
        valeData.id_tipo_de_compra || null, 
        valeData.id_proveedor || null,
        valeData.id_partida || null,
        esOficialia,
        valeData.subtotal,
        valeData.iva,
        total,
        valeData.observaciones || null,
        valeData.id_repartidor || null,
        valeData.id_empleado,
        valeData.id_estatus_de_captura || null
      ]);

      const idValeEntrada = valeResult.rows[0].id_vale_de_entrada;

      // INSERTAR DETALLES Y ACTUALIZAR EXISTENCIAS
      if (valeData.productos && valeData.productos.length > 0) {
        for (const producto of valeData.productos) {
          // Insertar detalle del vale
          const detalleQuery = `
            INSERT INTO vales_de_entrada_detalle (
              id_vale_de_entrada, id_producto, cantidad, id_unidad, precio_unitario,
              importe, nota, fecha_de_caducidad
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          `;

          await client.query(detalleQuery, [
            idValeEntrada,
            producto.id_producto,
            producto.cantidad,
            producto.id_unidad,
            producto.precio_unitario,
            producto.importe,
            producto.nota && producto.nota.trim() !== '' ? producto.nota.trim() : null,
            producto.fecha_de_caducidad && typeof producto.fecha_de_caducidad === 'string' && producto.fecha_de_caducidad.trim() !== '' ? producto.fecha_de_caducidad : null
          ]);

          // ACTUALIZAR EXISTENCIAS SEGÚN EL TIPO DE ALMACÉN
          const getProductInfoQuery = `
            SELECT cantidad_secundaria, id_producto_generico
            FROM productos p
            WHERE p.id_producto = $1
          `;
          
          const productInfo = await client.query(getProductInfoQuery, [producto.id_producto]);
          
          if (productInfo.rows.length > 0) {
            const { cantidad_secundaria, id_producto_generico } = productInfo.rows[0];
            const multiplicador = cantidad_secundaria || 1;
            const cantidadEnUnidadBase = parseFloat(producto.cantidad) * multiplicador;

            console.log(`📦 Producto ${producto.id_producto}: ${producto.cantidad} × ${multiplicador} = ${cantidadEnUnidadBase} unidades base`);

            let updateExistenciaQuery;
            let campoActualizado;

            if (esOficialia) {
              // Actualizar existencia de oficialía
              updateExistenciaQuery = `
                UPDATE productos_genericos 
                SET existencia_oficialia = existencia_oficialia + $1
                WHERE id_producto_generico = $2
              `;
              campoActualizado = 'existencia_oficialia';
            } else {
              // Actualizar existencia de almacén general (campo 'existencia')
              updateExistenciaQuery = `
                UPDATE productos_genericos 
                SET existencia = existencia + $1
                WHERE id_producto_generico = $2
              `;
              campoActualizado = 'existencia (almacén general)';
            }

            await client.query(updateExistenciaQuery, [cantidadEnUnidadBase, id_producto_generico]);
            
            console.log(`✅ Actualizado ${campoActualizado} +${cantidadEnUnidadBase} para producto genérico ${id_producto_generico}`);
          } else {
            throw new Error(`No se encontró información del producto con ID: ${producto.id_producto}`);
          }
        }
      }

      await client.query('COMMIT');
      console.log(`✅ Vale de entrada ${idValeEntrada} creado exitosamente (${esOficialia ? 'OFICIALÍA' : 'ALMACÉN GENERAL'})`);
      
      return { id_vale_de_entrada: idValeEntrada, success: true };

    } catch (error) {
      await client.query('ROLLBACK');
      console.error('❌ Error al crear vale de entrada:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Buscar productos genéricos similares por nombre (para validación de duplicados)
  static async searchSimilarProductosGenericos(nombre) {
    try {
      const searchQuery = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          p.partida,
          p.clave_objeto_del_gasto,
          pg.stock_min,
          pg.stock_sugerido,
          pg.existencia
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        WHERE pg.esta_borrado = false 
          AND pg.producto_generico ILIKE $1
        ORDER BY 
          CASE 
            WHEN LOWER(pg.producto_generico) = LOWER($2) THEN 1
            ELSE 2
          END,
          pg.producto_generico ASC
        LIMIT 10
      `;
      
      const result = await pool.query(searchQuery, [`%${nombre}%`, nombre]);
      
      return result.rows.map(row => ({
        id_producto_generico: row.id_producto_generico,
        producto_generico: row.producto_generico,
        partida: row.partida,
        clave_objeto_del_gasto: row.clave_objeto_del_gasto,
        stock_min: row.stock_min,
        stock_sugerido: row.stock_sugerido,
        existencia: row.existencia,
        es_exacto: row.producto_generico.toLowerCase() === nombre.toLowerCase()
      }));
    } catch (error) {
      console.error('Error al buscar productos genéricos similares:', error);
      throw error;
    }
  }

  // Buscar productos genéricos (para crear presentaciones)
  static async searchProductosGenericos(query) {
    try {
      const searchQuery = `
        SELECT 
          pg.id_producto_generico,
          pg.producto_generico,
          p.partida,
          p.clave_objeto_del_gasto
        FROM productos_genericos pg
        INNER JOIN partidas p ON pg.id_partida = p.id_partida
        WHERE pg.esta_borrado = false 
          AND pg.producto_generico ILIKE $1
        ORDER BY pg.producto_generico ASC
        LIMIT 20
      `;
      
      const result = await pool.query(searchQuery, [`%${query}%`]);
      
      return result.rows.map(row => ({
        id_producto_generico: row.id_producto_generico,
        producto_generico: row.producto_generico,
        display_text: `${row.producto_generico} (${row.clave_objeto_del_gasto})`,
        partida: row.partida,
        clave_objeto_del_gasto: row.clave_objeto_del_gasto
      }));
    } catch (error) {
      console.error('Error al buscar productos genéricos:', error);
      throw error;
    }
  }

  // Obtener empleados con roles de almacén (Jefe_almacen y almacen)
  /*static async getEmpleadosAlmacen() {
    try {
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
      return result.rows;
    } catch (error) {
      console.error('Error al obtener empleados de almacén:', error);
      throw error;
    }
  }*/

}

module.exports = EntryTicket;