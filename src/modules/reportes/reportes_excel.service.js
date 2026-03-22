const ExcelJS = require('exceljs');
const { connectDB } = require('../../config/db');
const cuentasPagarRepo = require('../../repositories/cuentas_pagar.repository');
const reportesModel = require('./reportes.model');

class ReportesExcelService {

    async generarExcelCuentasPagar(empresa_id) {
        const pool = await connectDB();
        const cuentas = await cuentasPagarRepo.getAll(pool, empresa_id);

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'StockPro ERP';
        workbook.created = new Date();

        const worksheet = workbook.addWorksheet('Cuentas por Pagar', {
            views: [{ showGridLines: false }]
        });

        // Título del reporte
        worksheet.mergeCells('A1:G2');
        const titleCell = worksheet.getCell('A1');
        titleCell.value = 'Reporte de Cuentas por Pagar Activadas';
        titleCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
        titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
        titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } }; // Slate 800

        // Encabezados
        worksheet.getRow(4).values = ['ID', 'Proveedor', 'F. Emisión', 'F. Vencimiento', 'Adeudado', 'Pagado', 'Saldo', 'Estado'];
        const headerRow = worksheet.getRow(4);
        headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF3B82F6' } }; // Blue 500
        headerRow.alignment = { horizontal: 'center' };

        // Configurar Ancho de Columnas
        worksheet.columns = [
            { key: 'id', width: 10 },
            { key: 'proveedor', width: 35 },
            { key: 'fecha_emision', width: 15 },
            { key: 'fecha_vencimiento', width: 15 },
            { key: 'adeudado', width: 15, style: { numFmt: '"$"#,##0.00' } },
            { key: 'pagado', width: 15, style: { numFmt: '"$"#,##0.00' } },
            { key: 'saldo', width: 15, style: { numFmt: '"$"#,##0.00' }, font: { bold: true, color: { argb: 'FFDC2626' } } },
            { key: 'estado', width: 15 }
        ];

        // Añadir Data
        let rowIndex = 5;
        let totalDeuda = 0;
        let totalSaldo = 0;

        for (const c of cuentas) {
            worksheet.addRow({
                id: c.id,
                proveedor: c.proveedor_nombre,
                fecha_emision: new Date(c.fecha_emision).toLocaleDateString(),
                fecha_vencimiento: new Date(c.fecha_vencimiento).toLocaleDateString(),
                adeudado: Number(c.monto_adeudado),
                pagado: Number(c.monto_pagado),
                saldo: Number(c.saldo),
                estado: c.estado
            });

            // Bordes ligeros
            worksheet.getRow(rowIndex).eachCell((cell) => {
                cell.border = {
                    top: {style:'thin', color: {argb:'FFE2E8F0'}},
                    bottom: {style:'thin', color: {argb:'FFE2E8F0'}},
                };
            });

            totalDeuda += Number(c.monto_adeudado);
            totalSaldo += Number(c.saldo);
            rowIndex++;
        }

        // Fila de Totales
        worksheet.addRow([]);
        const totalsRow = worksheet.addRow({
            proveedor: 'TOTALES CONSOLIDADOS',
            adeudado: totalDeuda,
            saldo: totalSaldo
        });
        totalsRow.font = { bold: true, size: 12 };
        totalsRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };

        return await workbook.xlsx.writeBuffer();
    }

    async generarExcelVentas(fechaInicio, fechaFin, empresa_id) {
        const ventas = await reportesModel.obtenerVentasPorProducto(fechaInicio, fechaFin, empresa_id);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Resumen de Ventas');

        worksheet.mergeCells('A1:D2');
        worksheet.getCell('A1').value = `Ventas por Producto (${fechaInicio} al ${fechaFin})`;
        worksheet.getCell('A1').font = { size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
        worksheet.getCell('A1').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF10B981' } }; // Emerald 500
        worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

        worksheet.getRow(4).values = ['Código SKU', 'Producto', 'Unidades Vendidas', 'Ingreso Bruto'];
        worksheet.getRow(4).font = { bold: true };
        
        worksheet.columns = [
            { key: 'id', width: 15 },
            { key: 'nombre', width: 40 },
            { key: 'cantidad', width: 20 },
            { key: 'ingreso', width: 20, style: { numFmt: '"$"#,##0.00' } }
        ];

        let totalCant = 0;
        let totalIng = 0;

        ventas.forEach(v => {
            worksheet.addRow({
                id: v.id,
                nombre: v.nombre,
                cantidad: v.cantidad_vendida,
                ingreso: v.total_ventas
            });
            totalCant += v.cantidad_vendida;
            totalIng += v.total_ventas;
        });

        worksheet.addRow([]);
        const rowTotals = worksheet.addRow({ nombre: 'TOTAL ACUMULADO', cantidad: totalCant, ingreso: totalIng });
        rowTotals.font = { bold: true };

        return await workbook.xlsx.writeBuffer();
    }
}

module.exports = new ReportesExcelService();
