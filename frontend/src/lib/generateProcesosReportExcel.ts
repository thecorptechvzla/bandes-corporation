import ExcelJS from 'exceljs';
import type { ProcesosReportData, ProcesoReportType } from '@/components/reportes/procesos/mockData';
import { MOCK_PROCESOS_DETAILED } from '@/components/reportes/procesos/mockData';

interface GenerateProcesosReportExcelParams {
  data: ProcesosReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  proveedorName: string;
  reportType: ProcesoReportType;
}

export async function generateProcesosReportExcel(params: GenerateProcesosReportExcelParams) {
  const { data, reportId, generatedAt, dateFrom, dateTo, proveedorName, reportType } = params;
  const { summary, records } = data;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BANDES - Sistema de Custodia';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Reporte Procesos', {
    properties: { defaultColWidth: 18 },
  });

  const green = '139169';
  const greenLight = 'EAF4F0';
  const greenBorder = 'C2E5D9';

  // Title
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'REPORTE DE PROCESOS RECIBIDOS Y PROCESADOS';
  titleCell.font = { bold: true, size: 14, color: { argb: `FF${green}` } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
  sheet.getRow(1).height = 30;

  // Subtitle
  sheet.mergeCells('A2:G2');
  const subCell = sheet.getCell('A2');
  subCell.value = `Banco de Desarrollo Económico y Social de Venezuela — R.I.F. G-20001643-0`;
  subCell.font = { size: 10, color: { argb: 'FF666666' } };
  subCell.alignment = { horizontal: 'center' };

  // Filter info
  sheet.mergeCells('A3:G3');
  const filterCell = sheet.getCell('A3');
  filterCell.value = `Proveedor: ${proveedorName} | Período: ${dateFrom} al ${dateTo} | Tipo: ${reportType === 'detallado' ? 'Detallado' : 'Resumido'} | ID: ${reportId} | Generado: ${generatedAt}`;
  filterCell.font = { size: 9, color: { argb: 'FF888888' } };
  filterCell.alignment = { horizontal: 'center' };

  // Empty row
  sheet.getRow(4).height = 8;

  // KPIs
  const kpiRow = 5;
  sheet.getCell(`A${kpiRow}`).value = 'TOTAL PROCESOS';
  sheet.getCell(`A${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
  sheet.getCell(`B${kpiRow}`).value = summary.totalProcesos;
  sheet.getCell(`B${kpiRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };

  sheet.getCell(`C${kpiRow}`).value = 'TOTAL BARRAS';
  sheet.getCell(`C${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
  sheet.getCell(`D${kpiRow}`).value = summary.totalBarras;
  sheet.getCell(`D${kpiRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };

  sheet.getCell(`E${kpiRow}`).value = 'PESO RESULTANTE';
  sheet.getCell(`E${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
  sheet.getCell(`F${kpiRow}`).value = summary.pesoResultanteTotal;
  sheet.getCell(`F${kpiRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
  sheet.getCell(`F${kpiRow}`).numFmt = '#,##0.00';

  sheet.getCell(`G${kpiRow}`).value = `Rend: ${summary.rendimientoProm}%`;
  sheet.getCell(`G${kpiRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };

  sheet.getRow(kpiRow).height = 22;

  // Empty row
  sheet.getRow(6).height = 8;

  if (reportType === 'resumido') {
    // Summary table headers — 7 columns (sin Resultado, con ¿Mixto?)
    const headers = ['N° Proceso', 'Tipo', 'Proveedor(es)', '¿Mixto?', 'Barras', 'Peso Bruto (gr)', 'Peso Bruto de Salida (gr)', 'Estatus'];
    const headerRow = sheet.getRow(7);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
      cell.alignment = { horizontal: i < 4 ? 'left' : i < 7 ? 'right' : 'center', vertical: 'middle', wrapText: i === 2 };
      cell.border = {
        top: { style: 'thin', color: { argb: `FF${green}` } },
        bottom: { style: 'thin', color: { argb: `FF${green}` } },
        left: { style: 'thin', color: { argb: `FF${green}` } },
        right: { style: 'thin', color: { argb: `FF${green}` } },
      };
    });
    headerRow.height = 20;

    // Data rows
    records.forEach((row, idx) => {
      const r = sheet.getRow(8 + idx);
      r.getCell(1).value = row.id;
      r.getCell(1).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
      r.getCell(2).value = row.tipo;
      r.getCell(2).font = { size: 10 };
      r.getCell(3).value = row.proveedores.join('\n');
      r.getCell(3).font = { size: 10 };
      r.getCell(3).alignment = { wrapText: true, vertical: 'middle' };
      r.getCell(4).value = row.esMixto ? 'Sí' : 'No';
      r.getCell(4).font = { bold: true, size: 10, color: { argb: row.esMixto ? 'FF0284C7' : 'FF6B7280' } };
      r.getCell(4).alignment = { horizontal: 'center' };
      r.getCell(5).value = row.barras;
      r.getCell(5).font = { size: 10 };
      r.getCell(5).alignment = { horizontal: 'center' };
      r.getCell(6).value = row.pesoInicial;
      r.getCell(6).font = { size: 10 };
      r.getCell(6).numFmt = '#,##0.00';
      r.getCell(6).alignment = { horizontal: 'right' };
      r.getCell(7).value = row.pesoObtenido;
      r.getCell(7).font = { size: 10 };
      r.getCell(7).numFmt = '#,##0.00';
      r.getCell(7).alignment = { horizontal: 'right' };
      r.getCell(8).value = row.estatus;
      r.getCell(8).font = { bold: true, size: 10, color: { argb: row.estatus === 'Completado' ? `FF${green}` : 'FF0EA5E9' } };
      r.getCell(8).alignment = { horizontal: 'center' };

      if (idx % 2 === 1) {
        for (let c = 1; c <= 8; c++) {
          r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
        }
      }
    });

    // Totals row
    const totalRowIdx = 8 + records.length;
    const tr = sheet.getRow(totalRowIdx);
    tr.getCell(1).value = `TOTALES (${summary.totalProcesos} Procesos)`;
    tr.getCell(1).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(5).value = summary.totalBarras;
    tr.getCell(5).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(5).alignment = { horizontal: 'center' };
    tr.getCell(6).value = records.reduce((a, r) => a + r.pesoInicial, 0);
    tr.getCell(6).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(6).numFmt = '#,##0.00';
    tr.getCell(6).alignment = { horizontal: 'right' };
    tr.getCell(7).value = summary.pesoResultanteTotal;
    tr.getCell(7).font = { bold: true, size: 10, color: { argb: `FF${green}` } };
    tr.getCell(7).numFmt = '#,##0.00';
    tr.getCell(7).alignment = { horizontal: 'right' };
    tr.getCell(8).value = `Rendimiento: ${summary.rendimientoProm}%`;
    tr.getCell(8).font = { bold: true, size: 10, color: { argb: `FF${green}` } };

    for (let c = 1; c <= 8; c++) {
      tr.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
      tr.getCell(c).border = {
        top: { style: 'medium', color: { argb: `FF${green}` } },
        bottom: { style: 'medium', color: { argb: `FF${green}` } },
      };
    }
  } else {
    // Detailed mode
    let currentRow = 7;

    MOCK_PROCESOS_DETAILED.forEach((proceso) => {
      // Process banner
      sheet.mergeCells(`A${currentRow}:H${currentRow}`);
      const bannerCell = sheet.getCell(`A${currentRow}`);
      bannerCell.value = `PROCESO: ${proceso.id} | MIXTO: ${proceso.esMixto ? 'SÍ' : 'NO'} | ESTATUS: ${proceso.estatus.toUpperCase()}`;
      bannerCell.font = { bold: true, size: 10, color: { argb: `FF${green}` } };
      bannerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
      bannerCell.alignment = { vertical: 'middle' };
      sheet.getRow(currentRow).height = 22;
      currentRow++;

      // Bar headers
      const barHeaders = ['Lote / Barra', 'Packing', 'Proveedor', 'Peso Bruto de Entrada', 'Estatus Barra', 'Peso Bruto de Salida'];
      const bhr = sheet.getRow(currentRow);
      barHeaders.forEach((h, i) => {
        const cell = bhr.getCell(i + 1);
        cell.value = h;
        cell.font = { bold: true, size: 9, color: { argb: 'FFFFFFFF' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
        cell.alignment = { horizontal: i < 3 ? 'left' : i === 3 || i === 5 ? 'right' : 'center' };
      });
      currentRow++;

      // Bar data
      proceso.bars.forEach((bar, barIdx) => {
        const br = sheet.getRow(currentRow);
        br.getCell(1).value = `${bar.lote} / ${bar.barId}`;
        br.getCell(1).font = { size: 9 };
        br.getCell(2).value = bar.packingOrigen;
        br.getCell(2).font = { size: 9 };
        br.getCell(3).value = bar.proveedorOrigen;
        br.getCell(3).font = { size: 9 };
        br.getCell(4).value = bar.pesoInicial;
        br.getCell(4).font = { size: 9 };
        br.getCell(4).numFmt = '#,##0.00';
        br.getCell(4).alignment = { horizontal: 'right' };
        br.getCell(5).value = bar.estatusBarra;
        br.getCell(5).font = { bold: true, size: 9, color: { argb: bar.estatusBarra === 'Procesada' ? `FF${green}` : bar.estatusBarra === 'Fundida' ? 'FFA16207' : 'FF0EA5E9' } };
        br.getCell(5).alignment = { horizontal: 'center' };
        br.getCell(6).value = bar.pesoResultante;
        br.getCell(6).font = { size: 9 };
        br.getCell(6).numFmt = '#,##0.00';
        br.getCell(6).alignment = { horizontal: 'right' };

        if (barIdx % 2 === 1) {
          for (let c = 1; c <= 6; c++) {
            br.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
          }
        }
        currentRow++;
      });

      // Subtotal
      const stRow = sheet.getRow(currentRow);
      stRow.getCell(1).value = `Subtotal — ${proceso.barras} Barras`;
      stRow.getCell(1).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(4).value = proceso.pesoInicial;
      stRow.getCell(4).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(4).numFmt = '#,##0.00';
      stRow.getCell(4).alignment = { horizontal: 'right' };
      stRow.getCell(6).value = proceso.pesoObtenido;
      stRow.getCell(6).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
      stRow.getCell(6).numFmt = '#,##0.00';
      stRow.getCell(6).alignment = { horizontal: 'right' };
      for (let c = 1; c <= 6; c++) {
        stRow.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${greenLight}` } };
        stRow.getCell(c).border = { top: { style: 'medium', color: { argb: `FF${green}` } } };
      }
      currentRow += 2;
    });

    // General totals
    sheet.mergeCells(`A${currentRow}:H${currentRow}`);
    const gtCell = sheet.getCell(`A${currentRow}`);
    gtCell.value = `TOTALES GENERALES — ${summary.totalProcesos} Procesos`;
    gtCell.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
    gtCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: `FF${green}` } };
    gtCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(currentRow).height = 24;
    currentRow++;

    sheet.getCell(`A${currentRow}`).value = 'Total Barras';
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`B${currentRow}`).value = summary.totalBarras;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };

    sheet.getCell(`C${currentRow}`).value = 'Peso Bruto Resultante';
    sheet.getCell(`C${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).value = summary.pesoResultanteTotal;
    sheet.getCell(`D${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
    sheet.getCell(`D${currentRow}`).numFmt = '#,##0.00';

    sheet.getCell(`E${currentRow}`).value = 'Rendimiento Prom.';
    sheet.getCell(`E${currentRow}`).font = { bold: true, size: 9, color: { argb: `FF${green}` } };
    sheet.getCell(`F${currentRow}`).value = `${summary.rendimientoProm}%`;
    sheet.getCell(`F${currentRow}`).font = { bold: true, size: 12, color: { argb: `FF${green}` } };
  }

  // Column widths
  sheet.columns.forEach((col) => {
    if (col) col.width = col.width && col.width < 14 ? 14 : col.width;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Reporte_Procesos_BANDES_${params.reportId.replace('#', '')}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
