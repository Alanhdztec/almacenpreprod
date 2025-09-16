// ========================================
// CONTROLLERS/ENTRYTICKETHISTORYGENERALCONTROLLER.JS - HISTORIAL ALMACÉN GENERAL
// ========================================

const EntryTicketHistory = require('../../models/entryTicketHistory');
// ✅ IMPORTAR MODELO DE ARCHIVOS
const ArchivosValeEntrada = require('../../models/archivosValeEntrada');

class EntryTicketHistoryGeneralController {
  
  // Mostrar historial de vales de entrada - SOLO ALMACÉN GENERAL
  static async showHistory(req, res) {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = 10; // 10 vales por página

      // Obtener filtros de la query string
      const filtros = {
        fecha_desde: req.query.fecha_inicio || req.query.fecha_desde || null,
        fecha_hasta: req.query.fecha_fin || req.query.fecha_hasta || null,
        proveedor: req.query.id_proveedor || req.query.proveedor || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        partida: req.query.partida || null
      };

      // Obtener datos para los filtros y el historial
      const [valesData, proveedores, estatusCaptura, partidas] = await Promise.all([
        EntryTicketHistory.getEntryTicketsHistory(filtros, page, limit, 'GENERAL'),
        EntryTicketHistory.getProveedores('GENERAL'),
        EntryTicketHistory.getEstatusCaptura('GENERAL'),
        EntryTicketHistory.getPartidas('GENERAL'),
      ]);

      
      res.render('entry-ticket/general/history', {
        title: 'Historial de Vales de Entrada - Almacén General',
        user: req.session.user,
        vales: valesData.vales,
        pagination: valesData.pagination,
        filtros: {
          fecha_inicio: filtros.fecha_desde || '',
          fecha_fin: filtros.fecha_hasta || '',
          id_proveedor: filtros.proveedor || '',
          numero_factura: filtros.numero_factura || '',
          id_estatus: filtros.estatus || '',
          partida: filtros.partida || ''
        },
       
        proveedores,
        estatusCaptura,
        partidas,
        currentPage: 'entry-ticket-general-history',
        sistema: 'GENERAL'
      });

    } catch (error) {
      console.error('Error al mostrar historial de vales de entrada (general):', error);
      res.status(500).render('error', {
        title: 'Error del Servidor',
        message: 'Error al cargar el historial de vales de entrada'
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
        proveedor: req.query.id_proveedor || req.query.proveedor || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        partida: req.query.partida || null
      };

      const valesData = await EntryTicketHistory.getEntryTicketsHistory(filtros, page, limit, 'GENERAL');

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
      
      const valeCompleto = await EntryTicketHistory.getEntryTicketDetails(id, 'GENERAL');
      
      if (!valeCompleto) {
        return res.status(404).render('error', {
          title: 'Vale no encontrado',
          message: 'El vale de entrada solicitado no existe o no pertenece al almacén general'
        });
      }

      // Verificar que el vale sea del almacén general
      if (valeCompleto.es_oficialia) {
        return res.status(403).render('error', {
          title: 'Acceso denegado',
          message: 'Este vale pertenece a oficialía, no al almacén general'
        });
      }

      // ✅ OBTENER INFORMACIÓN DE ARCHIVOS
      try {
        const archivos = await ArchivosValeEntrada.obtenerArchivosPorVale(id);
        const tieneArchivos = await ArchivosValeEntrada.tieneArchivos(id);
        const totalArchivos = await ArchivosValeEntrada.contarArchivos(id);
        
        valeCompleto.archivos_info = {
          archivos: archivos,
          tiene_archivos: tieneArchivos,
          total_archivos: totalArchivos
        };
      } catch (archivoError) {
        console.error('Error al obtener archivos del vale:', archivoError);
        // Continuar sin archivos si hay error
        valeCompleto.archivos_info = {
          archivos: [],
          tiene_archivos: false,
          total_archivos: 0
        };
      }

      res.render('entry-ticket/general/detail', {
        title: `Vale de Entrada #${id} - Almacén General`,
        user: req.session.user,
        vale: valeCompleto,
        detalle: valeCompleto.productos,
        archivos: valeCompleto.archivos, // Mantenemos para compatibilidad
        archivos_info: valeCompleto.archivos_info, // Nueva info de archivos
        currentPage: 'entry-ticket-general-history',
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
        proveedor: req.query.id_proveedor || req.query.proveedor || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        partida: req.query.partida || null
      };

      // Obtener todos los registros para export (sin paginación)
      const valesData = await EntryTicketHistory.getEntryTicketsHistory(filtros, 1, 10000, 'GENERAL');

      // Configurar headers para descarga CSV
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="historial_vales_entrada_general.csv"');

      // Escribir BOM para UTF-8
      res.write('\uFEFF');

      // Headers del CSV
      const headers = [
        'ID Vale',
        'Fecha Entrada',
        'Número Factura',
        'Requisición',
        'Proveedor',
        'Tipo Compra',
        'Partida',
        'Subtotal',
        'IVA',
        'Total',
        'Estatus',
        'Empleado',
        'Total Productos',
        'Observaciones'
      ];

      res.write(headers.join(',') + '\n');

      // Datos del CSV
      valesData.vales.forEach(vale => {
        const row = [
          vale.id_vale_de_entrada,
          vale.fecha_de_entrada ? new Date(vale.fecha_de_entrada).toLocaleDateString('es-MX') : '',
          `"${vale.numero_de_factura || ''}"`,
          `"${vale.requisicion_de_entrada || ''}"`,
          `"${vale.proveedor || ''}"`,
          `"${vale.tipo_de_compra || ''}"`,
          `"${vale.partida || ''}"`,
          vale.subtotal || 0,
          vale.iva || 0,
          vale.total || 0,
          `"${vale.estatus_de_captura || ''}"`,
          `"${vale.empleado_completo || ''}"`,
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
        proveedor: req.query.id_proveedor || req.query.proveedor || null,
        numero_factura: req.query.numero_factura || null,
        estatus: req.query.id_estatus || req.query.estatus || null,
        partida: req.query.partida || null
      };

      const estadisticas = await EntryTicketHistory.getStatistics(filtros, 'GENERAL');

      // Calcular proveedores únicos (aproximación basada en los datos filtrados)
      const valesData = await EntryTicketHistory.getEntryTicketsHistory(filtros, 1, 10000, 'GENERAL');
      const proveedoresUnicos = new Set(valesData.vales.filter(v => v.proveedor).map(v => v.proveedor)).size;

      res.json({
        success: true,
        estadisticas: {
          total_vales: parseInt(estadisticas.total_vales) || 0,
          total_monto: parseFloat(estadisticas.total_monetario) || 0,
          promedio_monto: parseFloat(estadisticas.promedio_vale) || 0,
          total_proveedores: proveedoresUnicos || 0,
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

module.exports = EntryTicketHistoryGeneralController;