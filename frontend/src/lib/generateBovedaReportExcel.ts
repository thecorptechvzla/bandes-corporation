import ExcelJS from 'exceljs';
import { formatWeight, formatNumber } from '@/lib/format';
import type { BovedaReportData, BovedaReportType } from './generateBovedaReportPDF';

interface GenerateBovedaReportExcelParams {
  data: BovedaReportData;
  reportId: string;
  generatedAt: string;
  reportType: BovedaReportType;
}

export async function generateBovedaReportExcel(params: GenerateBovedaReportExcelParams) {
  const { data, reportId, generatedAt, reportType } = params;

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'BANDES - Sistema de Custodia';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Inventario Bóveda', {
    properties: { defaultColWidth: 18 },
  });

  const green = '139169';
  const greenLight = 'EAF4F0';
  const greenARGB = `FF${green}`;
  const greenLightARGB = `FF${greenLight}`;

  const fillGreen = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: greenARGB } };
  const fillGreenLight = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: greenLightARGB } };
  const borderGreen = {
    top: { style: 'thin' as const, color: { argb: greenARGB } },
    bottom: { style: 'thin' as const, color: { argb: greenARGB } },
    left: { style: 'thin' as const, color: { argb: greenARGB } },
    right: { style: 'thin' as const, color: { argb: greenARGB } },
  };

  const titleSuffix = reportType === 'RESUMEN' ? 'RESUMEN' : 'DETALLADO';

  // Title
  sheet.mergeCells('A1:G1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = `REPORTE DE INVENTARIO - ORO EN BÓVEDA (${titleSuffix})`;
  titleCell.font = { bold: true, size: 14, color: { argb: greenARGB } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  titleCell.fill = fillGreenLight;
  sheet.getRow(1).height = 30;

  // Subtitle
  sheet.mergeCells('A2:G2');
  const subCell = sheet.getCell('A2');
  subCell.value = 'Banco de Desarrollo Económico y Social de Venezuela — R.I.F. G-20001643-0';
  subCell.font = { size: 10, color: { argb: 'FF666666' } };
  subCell.alignment = { horizontal: 'center' };

  // Filter info
  sheet.mergeCells('A3:G3');
  const filterCell = sheet.getCell('A3');
  filterCell.value = `ID: ${reportId} | Generado: ${generatedAt}`;
  filterCell.font = { size: 9, color: { argb: 'FF888888' } };
  filterCell.alignment = { horizontal: 'center' };

  sheet.getRow(4).height = 8;

  if (reportType === 'RESUMEN') {
    // Build provider summaries
    const summaryMap = new Map<string, {
      name: string; refundidasCount: number; sinRefundirCount: number;
      brutoRefundido: number; brutoSinRefundir: number; brutoTotal: number;
    }>();
    const ensure = (name: string) => {
      if (!summaryMap.has(name)) {
        summaryMap.set(name, { name, refundidasCount: 0, sinRefundirCount: 0, brutoRefundido: 0, brutoSinRefundir: 0, brutoTotal: 0 });
      }
      return summaryMap.get(name)!;
    };
    for (const lot of data.lots) {
      const s = ensure(lot.clientName || 'DESCONOCIDO');
      s.refundidasCount++;
      s.brutoRefundido += Number(lot.recovered ?? 0);
    }
    for (const bar of data.bars) {
      const s = ensure(bar.clientName || 'DESCONOCIDO');
      s.sinRefundirCount++;
      s.brutoSinRefundir += bar.grossWeight;
    }
    for (const s of summaryMap.values()) {
      s.brutoTotal = s.brutoRefundido + s.brutoSinRefundir;
    }
    const summaries = Array.from(summaryMap.values()).sort((a, b) => b.brutoTotal - a.brutoTotal);

    const headers = ['PROVEEDOR', 'CANT. BARRAS', 'REFUNDIDAS', 'SIN REF.', 'BRUTO REF. (g)', 'BRUTO S/R (g)', 'BRUTO TOTAL (g)'];
    const headerRow = sheet.getRow(6);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = fillGreen;
      const isRight = h.includes('g)') || h === 'CANT. BARRAS' || h === 'REFUNDIDAS' || h === 'SIN REF.';
      cell.alignment = { horizontal: isRight ? 'right' : 'left', vertical: 'middle' };
      cell.border = borderGreen;
    });
    headerRow.height = 20;

    summaries.forEach((s, idx) => {
      const r = sheet.getRow(7 + idx);
      const cantBarras = s.refundidasCount + s.sinRefundirCount;
      r.getCell(1).value = s.name;
      r.getCell(1).font = { bold: true, size: 10, color: { argb: greenARGB } };
      r.getCell(2).value = cantBarras;
      r.getCell(2).font = { size: 10 };
      r.getCell(2).alignment = { horizontal: 'right' };
      r.getCell(3).value = s.refundidasCount;
      r.getCell(3).font = { size: 10 };
      r.getCell(3).alignment = { horizontal: 'right' };
      r.getCell(4).value = s.sinRefundirCount;
      r.getCell(4).font = { size: 10 };
      r.getCell(4).alignment = { horizontal: 'right' };
      r.getCell(5).value = s.brutoRefundido;
      r.getCell(5).font = { size: 10 };
      r.getCell(5).numFmt = '#,##0.00';
      r.getCell(5).alignment = { horizontal: 'right' };
      r.getCell(6).value = s.brutoSinRefundir;
      r.getCell(6).font = { size: 10 };
      r.getCell(6).numFmt = '#,##0.00';
      r.getCell(6).alignment = { horizontal: 'right' };
      r.getCell(7).value = s.brutoTotal;
      r.getCell(7).font = { bold: true, size: 10, color: { argb: greenARGB } };
      r.getCell(7).numFmt = '#,##0.00';
      r.getCell(7).alignment = { horizontal: 'right' };

      if (idx % 2 === 1) {
        for (let c = 1; c <= 7; c++) {
          r.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
        }
      }
    });

    // Totals row
    const totalRowIdx = 7 + summaries.length;
    const tr = sheet.getRow(totalRowIdx);
    const totalCantBarras = summaries.reduce((a, s) => a + s.refundidasCount + s.sinRefundirCount, 0);
    const totalRefundidas = summaries.reduce((a, s) => a + s.refundidasCount, 0);
    const totalSinRefundir = summaries.reduce((a, s) => a + s.sinRefundirCount, 0);
    tr.getCell(1).value = 'TOTALES GENERALES';
    tr.getCell(1).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(2).value = totalCantBarras;
    tr.getCell(2).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(2).alignment = { horizontal: 'right' };
    tr.getCell(3).value = totalRefundidas;
    tr.getCell(3).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(3).alignment = { horizontal: 'right' };
    tr.getCell(4).value = totalSinRefundir;
    tr.getCell(4).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(4).alignment = { horizontal: 'right' };
    tr.getCell(5).value = summaries.reduce((a, s) => a + s.brutoRefundido, 0);
    tr.getCell(5).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(5).numFmt = '#,##0.00';
    tr.getCell(5).alignment = { horizontal: 'right' };
    tr.getCell(6).value = summaries.reduce((a, s) => a + s.brutoSinRefundir, 0);
    tr.getCell(6).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(6).numFmt = '#,##0.00';
    tr.getCell(6).alignment = { horizontal: 'right' };
    tr.getCell(7).value = summaries.reduce((a, s) => a + s.brutoTotal, 0);
    tr.getCell(7).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(7).numFmt = '#,##0.00';
    tr.getCell(7).alignment = { horizontal: 'right' };

    for (let c = 1; c <= 7; c++) {
      tr.getCell(c).fill = fillGreenLight;
      tr.getCell(c).border = {
        top: { style: 'medium', color: { argb: greenARGB } },
        bottom: { style: 'medium', color: { argb: greenARGB } },
        left: { style: 'thin', color: { argb: greenARGB } },
        right: { style: 'thin', color: { argb: greenARGB } },
      };
    }
  } else {
    // DETALLADO — lote con desglose de barras hijas + barras sueltas
    interface DetailRow {
      proveedor: string;
      codigo: string;
      tipo: string;
      origen: string;
      ley: number;
      pesoBruto: number;
      level: 0 | 1;
    }

    const rows: DetailRow[] = [];
    for (const lot of data.lots) {
      const proveedor = lot.clientName || 'DESCONOCIDO';
      rows.push({ proveedor, codigo: lot.name, tipo: 'Refundido', origen: lot.processName || '—', ley: Number(lot.purity ?? 0), pesoBruto: Number(lot.recovered ?? 0), level: 0 });
      for (const b of lot.bars ?? []) {
        rows.push({ proveedor: b.clientName || '', codigo: b.barNumber, tipo: '', origen: '', ley: Number(b.purity ?? 0), pesoBruto: Number(b.grossWeight ?? 0), level: 1 });
      }
    }
    for (const bar of data.bars) {
      rows.push({ proveedor: bar.clientName || 'DESCONOCIDO', codigo: bar.barNumber, tipo: 'Sin refundir', origen: 'Ingreso directo', ley: Number(bar.purity ?? 0), pesoBruto: bar.grossWeight, level: 0 });
    }

    const headers = ['PROVEEDOR', 'CÓDIGO', 'TIPO', 'ORIGEN', 'LEY (‰)', 'PESO BRUTO (g)'];
    const headerRow = sheet.getRow(6);
    headers.forEach((h, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.value = h;
      cell.font = { bold: true, size: 10, color: { argb: 'FFFFFFFF' } };
      cell.fill = fillGreen;
      const isRight = h.includes('g)') || h === 'TIPO' || h.includes('‰');
      cell.alignment = { horizontal: isRight ? 'right' : 'left', vertical: 'middle' };
      cell.border = borderGreen;
    });
    headerRow.height = 20;

    rows.forEach((r, idx) => {
      const row = sheet.getRow(7 + idx);
      const isChild = r.level === 1;
      row.getCell(1).value = r.proveedor;
      row.getCell(1).font = { size: 10 };
      row.getCell(2).value = isChild ? `   - ${r.codigo}` : r.codigo;
      row.getCell(2).font = { bold: true, size: isChild ? 9 : 10, color: { argb: isChild ? 'FF78A091' : greenARGB } };
      row.getCell(2).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      row.getCell(3).value = r.tipo;
      row.getCell(3).font = { size: isChild ? 9 : 10, color: { argb: greenARGB } };
      row.getCell(3).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(4).value = r.origen;
      row.getCell(4).font = { size: isChild ? 9 : 10 };
      row.getCell(4).alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
      row.getCell(5).value = r.ley;
      row.getCell(5).font = { size: isChild ? 9 : 10, color: { argb: isChild ? 'FF78A091' : greenARGB } };
      row.getCell(5).numFmt = '#,##0.00';
      row.getCell(5).alignment = { horizontal: 'right', vertical: 'middle' };
      row.getCell(6).value = r.pesoBruto;
      row.getCell(6).font = { bold: true, size: isChild ? 9 : 10, color: { argb: isChild ? 'FF78A091' : greenARGB } };
      row.getCell(6).numFmt = '#,##0.00';
      row.getCell(6).alignment = { horizontal: 'right', vertical: 'middle' };

      if (isChild) {
        for (let c = 1; c <= 6; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F7F4' } };
        }
      } else if (idx % 2 === 1) {
        for (let c = 1; c <= 6; c++) {
          row.getCell(c).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFBFDFC' } };
        }
      }
    });

    // Totals row (sums only main rows)
    const mainRows = rows.filter((r) => r.level === 0);
    const totalRowIdx = 7 + rows.length;
    const tr = sheet.getRow(totalRowIdx);
    const totalPeso = mainRows.reduce((a, r) => a + r.pesoBruto, 0);
    tr.getCell(1).value = `TOTALES GENERALES — ${mainRows.length} registro(s)`;
    tr.getCell(1).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(6).value = totalPeso;
    tr.getCell(6).font = { bold: true, size: 10, color: { argb: greenARGB } };
    tr.getCell(6).numFmt = '#,##0.00';
    tr.getCell(6).alignment = { horizontal: 'right' };

    for (let c = 1; c <= 6; c++) {
      tr.getCell(c).fill = fillGreenLight;
      tr.getCell(c).border = {
        top: { style: 'medium', color: { argb: greenARGB } },
        bottom: { style: 'medium', color: { argb: greenARGB } },
        left: { style: 'thin', color: { argb: greenARGB } },
        right: { style: 'thin', color: { argb: greenARGB } },
      };
    }
  }

  // Column widths
  const widthMap =
    reportType === 'DETALLADO'
      ? // Proveedor | Código | TIPO | Origen | Ley | Peso Bruto
        [26, 26, 14, 50, 12, 16]
      : // Proveedor | Cant. | Ref. | S/R | Bruto Ref. | Bruto S/R | Bruto Total
        [30, 12, 12, 12, 16, 16, 16];
  sheet.columns.forEach((col, i) => {
    if (col) col.width = widthMap[i] ?? 16;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Inventario_Boeda_${reportType}_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
