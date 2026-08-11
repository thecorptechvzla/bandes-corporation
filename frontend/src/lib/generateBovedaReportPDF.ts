import { jsPDF } from 'jspdf';
import { formatWeight, formatNumber } from '@/lib/format';

interface LotBar {
  barNumber: string;
  grossWeight: number;
  clientId?: string;
  clientName?: string;
}

export interface BovedaLotData {
  id: string;
  name: string;
  processName: string;
  clientName: string;
  recovered?: number;
  grossWeight?: number;
  bars?: LotBar[];
}

export interface BovedaBarData {
  barNumber: string;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  clientName: string;
}

export interface BovedaReportData {
  lots: BovedaLotData[];
  bars: BovedaBarData[];
  totalRecovered: number;
  totalGrossWeight: number;
  totalFineWeight: number;
  generatedAt?: string;
}

export type BovedaReportType = 'RESUMEN' | 'DETALLADO';

export function generateBovedaReportPDF(data: BovedaReportData, type: BovedaReportType) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 15;
  const cw = pw - m * 2;

  let y = 0;

  const checkPage = (needed: number) => {
    if (y + needed > ph - 20) { doc.addPage(); y = 20; }
  };

  // --- HEADER ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(19, 145, 105);
  doc.text('BANDES', m, 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(102, 102, 102);
  doc.text('Banco de Desarrollo Económico y Social de Venezuela', m, 20);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(68, 68, 68);
  doc.text('R.I.F.: G-20001643-0', pw - m, 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(102, 102, 102);
  doc.text('Gerencia General de Operaciones', pw - m, 19, { align: 'right' });
  doc.text('Caracas, Venezuela', pw - m, 24, { align: 'right' });

  y = 28;
  doc.setDrawColor(19, 145, 105);
  doc.setLineWidth(0.5);
  doc.line(m, y, pw - m, y);
  y += 6;

  // --- TITLE ---
  const titleSuffix = type === 'RESUMEN' ? ' (RESUMEN)' : ' (DETALLADO)';
  doc.setTextColor(19, 145, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`REPORTE DE INVENTARIO - ORO EN BÓVEDA${titleSuffix}`, pw / 2, y, { align: 'center' });
  y += 5;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const genDate = data.generatedAt ?? new Date().toLocaleString('es-ES');
  doc.text(`Generado: ${genDate}`, pw - m, y, { align: 'right' });
  y += 8;

  // ============================================================
  //  RESUMEN CONSOLIDADO POR PROVEEDOR
  // ============================================================
  if (type === 'RESUMEN') {
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

    // Section header
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN CONSOLIDADO POR PROVEEDOR', m + 2, y + 1);
    y += 10;

    // Column widths: Proveedor | Cant. Barras | Refundidas | Sin Ref. | Bruto Ref. (g) | Bruto S/R (g) | Bruto Total (g)
    const sColsW = [42, 22, 20, 22, 26, 26, cw - 158];
    const sX = (col: number) => {
      let x = m + 3;
      for (let i = 0; i < col; i++) x += sColsW[i];
      return x;
    };

    // Header row
    checkPage(14);
    doc.setFillColor(19, 145, 105);
    doc.rect(m, y - 3.5, cw, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('PROVEEDOR', sX(0), y);
    doc.text('CANT. BARRAS', sX(1), y, { align: 'right' });
    doc.text('REFUNDIDAS', sX(2), y, { align: 'right' });
    doc.text('SIN REF.', sX(3), y, { align: 'right' });
    doc.text('BRUTO REF. (g)', sX(4), y, { align: 'right' });
    doc.text('BRUTO S/R (g)', sX(5), y, { align: 'right' });
    doc.text('BRUTO TOTAL (g)', pw - m - 2, y, { align: 'right' });
    y += 6;

    // Data rows
    let rowIdx = 0;
    for (const s of summaries) {
      checkPage(8);
      if (rowIdx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(m, y - 3.5, cw, 6, 'F');
      }
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      doc.text(s.name, sX(0), y);
      const cantBarras = s.refundidasCount + s.sinRefundirCount;
      doc.text(String(cantBarras), sX(1), y, { align: 'right' });
      doc.text(String(s.refundidasCount), sX(2), y, { align: 'right' });
      doc.text(String(s.sinRefundirCount), sX(3), y, { align: 'right' });
      doc.text(formatWeight(s.brutoRefundido), sX(4), y, { align: 'right' });
      doc.text(formatWeight(s.brutoSinRefundir), sX(5), y, { align: 'right' });
      doc.setTextColor(19, 145, 105);
      doc.text(formatWeight(s.brutoTotal), pw - m - 2, y, { align: 'right' });
      y += 5;
      rowIdx++;
    }

    // Totals row
    if (summaries.length > 0) {
      checkPage(8);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALES GENERALES', sX(0), y);
      const totalCantBarras = summaries.reduce((a, s) => a + s.refundidasCount + s.sinRefundirCount, 0);
      const totalRefundidas = summaries.reduce((a, s) => a + s.refundidasCount, 0);
      const totalSinRefundir = summaries.reduce((a, s) => a + s.sinRefundirCount, 0);
      doc.text(String(totalCantBarras), sX(1), y, { align: 'right' });
      doc.text(String(totalRefundidas), sX(2), y, { align: 'right' });
      doc.text(String(totalSinRefundir), sX(3), y, { align: 'right' });
      doc.text(formatWeight(summaries.reduce((a, s) => a + s.brutoRefundido, 0)), sX(4), y, { align: 'right' });
      doc.text(formatWeight(summaries.reduce((a, s) => a + s.brutoSinRefundir, 0)), sX(5), y, { align: 'right' });
      doc.text(formatWeight(summaries.reduce((a, s) => a + s.brutoTotal, 0)), pw - m - 2, y, { align: 'right' });
      y += 8;
    }
  }

  // ============================================================
  //  DETALLADO — TABLA POR LOTE CON DESGLOSE DE BARRAS
  //  ============================================================
  if (type === 'DETALLADO') {
    // Build rows: main row per lot (refundido) with one sub-row per child bar,
    // plus one main row per standalone bar (sin refundir).
    interface DetailRow {
      proveedor: string;
      codigo: string;
      tipo: string;
      origen: string;
      pesoBruto: number;
      level: 0 | 1;
    }

    const rows: DetailRow[] = [];

    for (const lot of data.lots) {
      const proveedor = lot.clientName || 'DESCONOCIDO';
      rows.push({
        proveedor,
        codigo: lot.name,
        tipo: 'Refundido',
        origen: lot.processName || '—',
        pesoBruto: Number(lot.recovered ?? 0),
        level: 0,
      });
      for (const b of lot.bars ?? []) {
        rows.push({
          proveedor: b.clientName || '',
          codigo: b.barNumber,
          tipo: '',
          origen: '',
          pesoBruto: Number(b.grossWeight ?? 0),
          level: 1,
        });
      }
    }

    for (const bar of data.bars) {
      rows.push({
        proveedor: bar.clientName || 'DESCONOCIDO',
        codigo: bar.barNumber,
        tipo: 'Sin refundir',
        origen: 'Ingreso directo',
        pesoBruto: bar.grossWeight,
        level: 0,
      });
    }

    // Section header
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DETALLADO — ${data.lots.length} lote(s) · ${data.bars.length} barra(s) sin refundir`, m + 2, y + 1);
    y += 10;

    // Column widths: Proveedor | Código | TIPO | Origen | Peso Bruto (g)
    // Reserve ~28mm for the right-aligned weight column; Código and Origen get
    // generous widths and wrap onto multiple lines as needed.
    const dLeftW = cw - 28;
    const dColsW = [30, 42, 24, dLeftW - 96];
    const dX = (col: number) => {
      let x = m + 3;
      for (let i = 0; i < col; i++) x += dColsW[i];
      return x;
    };

    const wrapLines = (text: string, maxW: number): string[] => {
      const lines = doc.splitTextToSize(text, maxW);
      return Array.isArray(lines) ? lines : [lines];
    };

    const lineW = 5;

    // Header row
    checkPage(14);
    doc.setFillColor(19, 145, 105);
    doc.rect(m, y - 3.5, cw, 6, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'bold');
    doc.text('PROVEEDOR', dX(0), y);
    doc.text('CÓDIGO', dX(1), y);
    doc.text('TIPO', dX(2), y, { align: 'right' });
    doc.text('ORIGEN', dX(3), y);
    doc.text('PESO BRUTO (g)', pw - m - 2, y, { align: 'right' });
    y += 6;

    // Data rows
    let rowIdx = 0;
    for (const r of rows) {
      const maxW = (col: number) => dColsW[col] - 1;

      const isChild = r.level === 1;
      const codeText = isChild ? `  ↳ ${r.codigo}` : r.codigo;
      const provLines = wrapLines(r.proveedor, maxW(0));
      const codeLines = wrapLines(codeText, maxW(1));
      const origenLines = wrapLines(r.origen, maxW(3));
      const codeCols = Math.max(codeLines.length, Math.max(provLines.length, origenLines.length));
      const rowH = codeCols * lineW + 1;

      checkPage(rowH + 2);
      if (isChild) {
        // Subtle fill for child-bar rows
        doc.setFillColor(242, 247, 244);
        doc.rect(m, y - 3.5, cw, rowH, 'F');
      } else if (rowIdx % 2 === 0) {
        doc.setFillColor(248, 248, 248);
        doc.rect(m, y - 3.5, cw, rowH, 'F');
      }
      doc.setFontSize(isChild ? 7 : 7.5);
      doc.setFont('helvetica', isChild ? 'italic' : 'normal');
      doc.setTextColor(isChild ? 100 : 80, isChild ? 100 : 80, isChild ? 100 : 80);

      const drawLines = (lines: string[], x: number, opts?: { align?: 'right' }) => {
        (lines.length ? lines : ['']).forEach((ln, i) => {
          doc.text(ln, x, y + i * lineW, opts);
        });
      };

      drawLines(provLines, dX(0));
      // Código (green for main, gray for child bars)
      doc.setTextColor(isChild ? 100 : 19, isChild ? 100 : 145, isChild ? 100 : 105);
      drawLines(codeLines, dX(1));
      // Tipo
      doc.setTextColor(19, 145, 105);
      drawLines(wrapLines(r.tipo, maxW(2)), dX(2), { align: 'right' });
      // Origen
      doc.setTextColor(isChild ? 100 : 80, isChild ? 100 : 80, isChild ? 100 : 80);
      drawLines(origenLines, dX(3));
      // Peso bruto
      doc.setTextColor(isChild ? 100 : 19, isChild ? 100 : 145, isChild ? 100 : 105);
      doc.text(formatWeight(r.pesoBruto), pw - m - 2, y, { align: 'right' });
      y += rowH;
      rowIdx++;
    }

    // Totals row (sums only main rows, not child bars)
    const mainRows = rows.filter((r) => r.level === 0);
    if (mainRows.length > 0) {
      checkPage(8);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      const totalPeso = mainRows.reduce((a, r) => a + r.pesoBruto, 0);
      doc.text(`TOTALES GENERALES — ${mainRows.length} registro(s)`, m + 3, y);
      doc.text(formatWeight(totalPeso), pw - m - 2, y, { align: 'right' });
      y += 8;
    }
  }

  // --- FOOTER ---
  checkPage(30);
  y += 4;
  doc.setDrawColor(19, 145, 105);
  doc.setLineWidth(0.6);
  doc.line(m, y, pw - m, y);
  y += 8;

  doc.setTextColor(19, 145, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTALES', m, y);
  y += 7;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  const totalBarras = data.lots.length + data.bars.length;
  doc.text(`Barras en bóveda: ${totalBarras} (Refundidas: ${data.lots.length} · Sin refundir: ${data.bars.length})`, m, y); y += 5;
  doc.text(`Bruto Total Refundido:   ${formatWeight(data.totalRecovered)}`, m, y); y += 5;
  doc.text(`Bruto Total Sin Refundir: ${formatWeight(data.totalGrossWeight)}`, m, y); y += 5;

  const grandTotal = data.totalRecovered + data.totalGrossWeight;
  y += 2;
  doc.setFillColor(234, 244, 240);
  doc.rect(m, y - 4, cw, 7, 'F');
  doc.setTextColor(19, 145, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAN TOTAL EN BÓVEDA: ${formatWeight(grandTotal)}`, m + 2, y + 1);
  y += 10;

  // --- SIGNATURES ---
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, y, pw - m, y);
  y += 8;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('_________________________', m, y); y += 5;
  doc.text('PESO BRUTO', m, y);
  doc.text('_________________________', pw - m - 40, y - 5);
  doc.text('R', pw - m - 40, y);

  y += 12;
  doc.setFontSize(7);
  doc.setTextColor(140, 140, 140);
  doc.text('Elaborado por: Sistema de Trazabilidad Bandes', m, y); y += 4;
  doc.text(`Fecha generación: ${new Date().toLocaleString('es-ES')}`, m, y);

  const suffix = type === 'RESUMEN' ? 'Resumen' : 'Detallado';
  doc.save(`Boveda_Oro_${suffix}_${new Date().toISOString().slice(0, 10)}.pdf`);
}
