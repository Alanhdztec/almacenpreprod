// ========================================
// CONTROLLERS/EXITTICKETHISTORYOFICIALIACONTROLLER.JS - HISTORIAL VALES DE SALIDA OFICIALÍA
// ========================================

const ExitTicketHistory = require('../../models/exitTicketHistory');

class ExitTicketHistoryOficialiaController {
  
  // Mostrar historial de vales de salida - SOLO ALMACÉN OFICIALÍA
  static async showHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // 10 vales por página

      // Obtener filtros de la query string
      const filtros = {
        fecha_desde: req.query.fecha_inicio || req.query.fecha_desde || null,
        fecha_hasta: req.query.fecha_fin || req.query.fecha_hasta || null,
        area: req.query.id_area || req.query.area || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        empleado_entrega: req.query.id_empleado_entrega || req.query.empleado_entrega || null,
        empleado_recibe: req.query.id_empleado_recibe || req.query.empleado_recibe || null
      };

      // Obtener datos para los filtros y el historial
      const [valesData, areas, estatusCaptura, empleados] = await Promise.all([
        ExitTicketHistory.getExitTicketsHistory(filtros, page, limit, 'OFICIALIA'),
        ExitTicketHistory.getAreas('OFICIALIA'),
        ExitTicketHistory.getEstatusCaptura('OFICIALIA'),
        ExitTicketHistory.getEmpleados('OFICIALIA'),
      ]);

      
      res.render('exit-ticket/oficialia/history', {
        title: 'Historial de Vales de Salida - Oficialía Mayor',
        user: req.session.user,
        vales: valesData.vales,
        pagination: valesData.pagination,
        filtros: {
          fecha_inicio: filtros.fecha_desde || '',
          fecha_fin: filtros.fecha_hasta || '',
          id_area: filtros.area || '',
          numero_factura: filtros.numero_factura || '',
          id_estatus: filtros.estatus || '',
          id_empleado_entrega: filtros.empleado_entrega || '',
          id_empleado_recibe: filtros.empleado_recibe || ''
        },
        areas,
        estatusCaptura,
        empleados,
        currentPage: 'exit-ticket-oficialia-history',
        sistema: 'OFICIALIA'
      });

    } catch (error) {
      console.error('Error al mostrar historial de vales de salida (oficialía):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de vales de salida'
      });
    }
  }

  // API para obtener historial con filtros (AJAX)
  static async getHistoryData(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const filtros = {
        fecha_desde: req.query.fecha_inicio || req.query.fecha_desde || null,
        fecha_hasta: req.query.fecha_fin || req.query.fecha_hasta || null,
        area: req.query.id_area || req.query.area || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        empleado_entrega: req.query.id_empleado_entrega || req.query.empleado_entrega || null,
        empleado_recibe: req.query.id_empleado_recibe || req.query.empleado_recibe || null
      };

      const valesData = await ExitTicketHistory.getExitTicketsHistory(filtros, page, limit, 'OFICIALIA');

      res.json({
        success: true,
        data: {
          vales: valesData.vales,
          pagination: {
            currentPage: valesData.pagination.currentPage,
            totalPages: valesData.pagination.totalPages,
            totalRecords: valesData.pagination.totalItems,
            limit: valesData.pagination.limit,
            hasNextPage: valesData.pagination.hasMore,
            hasPreviousPage: page > 1
          }
        }
      });

    } catch (error) {
      console.error('Error al obtener datos del historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los datos del historial'
      });
    }
  }

  // Ver detalle de un vale específico
  static async showValeDetail(req, res) {
    try {
      const { id } = req.params;
      
      const valeCompleto = await ExitTicketHistory.getExitTicketDetails(id, 'OFICIALIA');
      
      if (!valeCompleto) {
        return res.status(404).render('error', {
          title: 'Vale no encontrado',
          message: 'No es posible encontrar el vale solicitado'
        });
      }

      // Verificar que el vale sea de oficialía
      if (!valeCompleto.es_oficialia) {
        return res.status(403).render('error', {
          title: 'Acceso denegado',
          message: 'Este vale pertenece al almacén general, no a oficialía mayor'
        });
      }

      res.render('exit-ticket/oficialia/detail', {
        title: `Vale de Salida #${id} - Oficialía Mayor`,
        user: req.session.user,
        vale: valeCompleto,
        detalle: valeCompleto.productos,
        currentPage: 'exit-ticket-oficialia-history',
        sistema: 'OFICIALIA'
      });

    } catch (error) {
      console.error('Error al mostrar detalle del vale:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el detalle del vale'
      });
    }
  }

  // API para exportar historial a CSV
  static async exportHistoryCSV(req, res) {
    try {
      const filtros = {
        fecha_desde: req.query.fecha_inicio || req.query.fecha_desde || null,
        fecha_hasta: req.query.fecha_fin || req.query.fecha_hasta || null,
        area: req.query.id_area || req.query.area || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        empleado_entrega: req.query.id_empleado_entrega || req.query.empleado_entrega || null,
        empleado_recibe: req.query.id_empleado_recibe || req.query.empleado_recibe || null
      };

      // Obtener todos los registros para export (sin paginación)
      const valesData = await ExitTicketHistory.getExitTicketsHistory(filtros, 1, 10000, 'OFICIALIA');

      // Configurar headers para descarga CSV
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="historial_vales_salida_oficialia.csv"');

      // Escribir BOM para UTF-8
      res.write('\uFEFF');

      // Headers del CSV
      const headers = [
        'ID Vale',
        'Fecha Salida',
        'Número Factura',
        'Requisición',
        'Área',
        'Empleado Entrega',
        'Empleado Recibe',
        'Estatus',
        'Total Productos',
        'Observaciones'
      ];

      res.write(headers.join(',') + '\n');

      // Datos del CSV
      valesData.vales.forEach(vale => {
        const row = [
          vale.id_vale_de_salida,
          vale.fecha_de_salida ? new Date(vale.fecha_de_salida).toLocaleDateString('es-MX') : '',
          `"${vale.numero_de_factura || ''}"`,
          `"${vale.requisicion_de_salida || ''}"`,
          `"${vale.area_descripcion || ''}"`,
          `"${vale.empleado_entrega_completo || ''}"`,
          `"${vale.empleado_recibe_completo || ''}"`,
          `"${vale.estatus_de_captura || ''}"`,
          vale.total_productos || 0,
          `"${(vale.observaciones || '').replace(/"/g, '""')}"` // Escapar comillas dobles
        ];
        res.write(row.join(',') + '\n');
      });

      res.end();

    } catch (error) {
      console.error('Error al exportar historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar el historial'
      });
    }
  }

  // Obtener estadísticas del historial
  static async getStatistics(req, res) {
    try {
      const filtros = {
        fecha_desde: req.query.fecha_inicio || req.query.fecha_desde || null,
        fecha_hasta: req.query.fecha_fin || req.query.fecha_hasta || null,
        area: req.query.id_area || req.query.area || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        empleado_entrega: req.query.id_empleado_entrega || req.query.empleado_entrega || null,
        empleado_recibe: req.query.id_empleado_recibe || req.query.empleado_recibe || null
      };

      const estadisticas = await ExitTicketHistory.getStatistics(filtros, 'OFICIALIA');

      // Calcular áreas únicas (aproximación basada en los datos filtrados)
      const valesData = await ExitTicketHistory.getExitTicketsHistory(filtros, 1, 10000, 'OFICIALIA');
      const areasUnicas = new Set(valesData.vales.filter(v => v.area_descripcion).map(v => v.area_descripcion)).size;

      res.json({
        success: true,
        estadisticas: {
          total_vales: parseInt(estadisticas.total_vales) || 0,
          total_areas: areasUnicas || 0,
          vales_concluidos: parseInt(estadisticas.vales_concluidos) || 0,
          vales_pendientes: parseInt(estadisticas.vales_pendientes) || 0
        }
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener las estadísticas'
      });
    }
  }

}

module.exports = ExitTicketHistoryOficialiaController;