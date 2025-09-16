// ========================================
// CONTROLLERS/EXITTICKETHISTORYCONTROLLER.JS
// ========================================

const ExitTicketHistory = require('../../models/exitTicketHistory');

class ExitTicketHistoryController {
  
  // Mostrar historial de vales de salida
  static async showHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      
      const filters = {
        fecha_desde: req.query.fecha_desde || '',
        fecha_hasta: req.query.fecha_hasta || '',
        area: req.query.area || '',
        empleado_entrega: req.query.empleado_entrega || '',
        empleado_recibe: req.query.empleado_recibe || '',
        tipo_almacen: req.query.tipo_almacen || '',
        estatus: req.query.estatus || ''
      };

      // Obtener datos en paralelo
      const [historialData, areas, empleados, estatusCaptura, estadisticas] = await Promise.all([
        ExitTicketHistory.getExitTicketsHistory(filters, page, limit),
        ExitTicketHistory.getAreas(),
        ExitTicketHistory.getEmpleados(),
        ExitTicketHistory.getEstatusCaptura(),
        ExitTicketHistory.getStatistics(filters)
      ]);

      res.render('exit-ticket/history', {
        title: 'Historial de Vales de Salida - Sistema de Almacén',
        user: req.session.user,
        vales: historialData.vales,
        pagination: historialData.pagination,
        areas,
        empleados,
        estatusCaptura,
        estadisticas,
        filters,
        currentPage: 'exit-ticket-history'
      });

    } catch (error) {
      console.error('Error al mostrar historial de vales de salida:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de vales de salida',
        user: req.session.user
      });
    }
  }

  // API para cargar más vales (scroll infinito)
  static async loadMoreVales(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      
      const filters = {
        fecha_desde: req.query.fecha_desde || '',
        fecha_hasta: req.query.fecha_hasta || '',
        area: req.query.area || '',
        empleado_entrega: req.query.empleado_entrega || '',
        empleado_recibe: req.query.empleado_recibe || '',
        tipo_almacen: req.query.tipo_almacen || '',
        estatus: req.query.estatus || ''
      };

      const historialData = await ExitTicketHistory.getExitTicketsHistory(filters, page, limit);

      res.json({
        success: true,
        vales: historialData.vales,
        pagination: historialData.pagination
      });

    } catch (error) {
      console.error('Error al cargar más vales:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cargar más vales'
      });
    }
  }

  // Mostrar detalles de un vale específico
  static async showValeDetails(req, res) {
    try {
      const idVale = parseInt(req.params.id);
      
      if (isNaN(idVale)) {
        return res.status(400).render('error', {
          title: 'ID Inválido',
          message: 'El ID del vale no es válido',
          user: req.session.user
        });
      }

      const valeDetails = await ExitTicketHistory.getExitTicketDetails(idVale);
      
      if (!valeDetails) {
        return res.status(404).render('error', {
          title: 'Vale no encontrado',
          message: 'El vale de salida solicitado no existe',
          user: req.session.user
        });
      }

      res.render('exit-ticket/details', {
        title: `Vale de Salida #${idVale} - Detalles`,
        user: req.session.user,
        vale: valeDetails,
        currentPage: 'exit-ticket-history'
      });

    } catch (error) {
      console.error('Error al mostrar detalles del vale:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar los detalles del vale',
        user: req.session.user
      });
    }
  }

  // API para exportar historial (futuro)
  static async exportHistory(req, res) {
    try {
      // TODO: Implementar exportación a Excel/PDF
      res.json({
        success: false,
        message: 'Funcionalidad de exportación en desarrollo'
      });
    } catch (error) {
      console.error('Error al exportar historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error al exportar historial'
      });
    }
  }

  // API para obtener estadísticas filtradas
  static async getStatistics(req, res) {
    try {
      const filters = {
        fecha_desde: req.query.fecha_desde || '',
        fecha_hasta: req.query.fecha_hasta || '',
        area: req.query.area || '',
        empleado_entrega: req.query.empleado_entrega || '',
        empleado_recibe: req.query.empleado_recibe || '',
        tipo_almacen: req.query.tipo_almacen || '',
        estatus: req.query.estatus || ''
      };

      const estadisticas = await ExitTicketHistory.getStatistics(filters);

      res.json({
        success: true,
        estadisticas
      });

    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas'
      });
    }
  }
}

module.exports = ExitTicketHistoryController;