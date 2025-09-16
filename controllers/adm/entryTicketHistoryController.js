// ========================================
// CONTROLLERS/ENTRYTICKETHISTORYCONTROLLER.JS
// ========================================

const EntryTicketHistory = require('../../models/entryTicketHistory');

class EntryTicketHistoryController {
  
  // Mostrar historial de vales de entrada
  static async showHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 15;
      
      const filters = {
        fecha_desde: req.query.fecha_desde || '',
        fecha_hasta: req.query.fecha_hasta || '',
        proveedor: req.query.proveedor || '',
        partida: req.query.partida || '',
        tipo_almacen: req.query.tipo_almacen || '',
        estatus: req.query.estatus || '',
        numero_factura: req.query.numero_factura || ''
      };

      // Obtener datos en paralelo
      const [historialData, proveedores, partidas, estatusCaptura, estadisticas] = await Promise.all([
        EntryTicketHistory.getEntryTicketsHistory(filters, page, limit),
        EntryTicketHistory.getProveedores(),
        EntryTicketHistory.getPartidas(),
        EntryTicketHistory.getEstatusCaptura(),
        EntryTicketHistory.getStatistics(filters)
      ]);

      res.render('entry-ticket/history', {
        title: 'Historial de Vales de Entrada - Sistema de Almacén',
        user: req.session.user,
        vales: historialData.vales,
        pagination: historialData.pagination,
        proveedores,
        partidas,
        estatusCaptura,
        estadisticas,
        filters,
        currentPage: 'entry-ticket-history'
      });

    } catch (error) {
      console.error('Error al mostrar historial de vales de entrada:', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de vales de entrada',
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
        proveedor: req.query.proveedor || '',
        partida: req.query.partida || '',
        tipo_almacen: req.query.tipo_almacen || '',
        estatus: req.query.estatus || '',
        numero_factura: req.query.numero_factura || ''
      };

      const historialData = await EntryTicketHistory.getEntryTicketsHistory(filters, page, limit);

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

      const valeDetails = await EntryTicketHistory.getEntryTicketDetails(idVale);
      
      if (!valeDetails) {
        return res.status(404).render('error', {
          title: 'Vale no encontrado',
          message: 'El vale de entrada solicitado no existe',
          user: req.session.user
        });
      }

      res.render('entry-ticket/details', {
        title: `Vale de Entrada #${idVale} - Detalles`,
        user: req.session.user,
        vale: valeDetails,
        currentPage: 'entry-ticket-history'
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
        proveedor: req.query.proveedor || '',
        partida: req.query.partida || '',
        tipo_almacen: req.query.tipo_almacen || '',
        estatus: req.query.estatus || '',
        numero_factura: req.query.numero_factura || ''
      };

      const estadisticas = await EntryTicketHistory.getStatistics(filters);

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

module.exports = EntryTicketHistoryController;