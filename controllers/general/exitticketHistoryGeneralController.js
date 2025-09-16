// ========================================
// CONTROLLERS/EXITTICKETHISTORYGENERALCONTROLLER.JS - HISTORIAL VALES DE SALIDA ALMACÉN GENERAL
// ========================================

const ExitTicketHistory = require('../../models/exitTicketHistory');

class ExitTicketHistoryGeneralController {
  
  // Mostrar historial de vales de salida - SOLO ALMACÉN GENERAL
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
        ExitTicketHistory.getExitTicketsHistory(filtros, page, limit, 'GENERAL'),
        ExitTicketHistory.getAreas('GENERAL'),
        ExitTicketHistory.getEstatusCaptura('GENERAL'),
        ExitTicketHistory.getEmpleados('GENERAL'),
      ]);

      
      res.render('exit-ticket/general/history', {
        title: 'Historial de Vales de Salida - Almacén General',
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
        currentPage: 'exit-ticket-general-history',
        sistema: 'GENERAL'
      });

    } catch (error) {
      console.error('Error al mostrar historial de vales de salida (general):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de vales de salida'
      });
    }
  }

  // Ver detalle de un vale específico
  static async showValeDetail(req, res) {
    try {
      const { id } = req.params;
      
      const valeCompleto = await ExitTicketHistory.getExitTicketDetails(id, 'GENERAL');
      
      if (!valeCompleto) {
        return res.status(404).render('error', {
          title: 'Vale no encontrado',
          message: 'No es posible encontrar el vale solicitado'
        });
      }

      // Verificar que el vale sea del almacén general
      if (valeCompleto.es_oficialia) {
        return res.status(403).render('error', {
          title: 'Acceso denegado',
          message: 'Este vale pertenece a la oficialía mayor, no al almacén general'
        });
      }

      res.render('exit-ticket/general/detail', {
        title: `Vale de Salida #${id} - Almacén General`,
        user: req.session.user,
        vale: valeCompleto,
        detalle: valeCompleto.productos,
        currentPage: 'exit-ticket-general-history',
        sistema: 'GENERAL'
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
      const valesData = await ExitTicketHistory.getExitTicketsHistory(filtros, 1, 10000, 'GENERAL');

      // Configurar headers para descarga CSV
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="historial_vales_salida_almacen_general.csv"');

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

}

module.exports = ExitTicketHistoryGeneralController;