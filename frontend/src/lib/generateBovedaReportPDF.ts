import { jsPDF } from 'jspdf';
import { formatWeight, formatLey, formatNumber } from '@/lib/format';

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
  operator?: string;
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

export function generateBovedaReportPDF(data: BovedaReportData) {
  const doc = new jsPDF({ unit: 'mm', format: 'letter' });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const m = 15;
  const cw = pw - m * 2;

  let y = 0;

  const checkPage = (needed: number) => {
    if (y + needed > ph - 20) { doc.addPage(); y = 20; }
  };

  const drawRow = (cols: { text: string; x: number; w: number; align?: 'left' | 'right' }[], options?: { bold?: boolean; fontSize?: number; textColor?: number[]; bgColor?: number[] }) => {
    const fontSize = options?.fontSize ?? 7;
    const tc = options?.textColor ?? [80, 80, 80];
    const bold = options?.bold ?? false;
    doc.setFontSize(fontSize);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(tc[0], tc[1], tc[2]);
    if (options?.bgColor) {
      const bg = options.bgColor;
      doc.setFillColor(bg[0], bg[1], bg[2]);
      doc.rect(m, y - 3.5, cw, 6, 'F');
    }
    for (const col of cols) {
      doc.text(col.text, col.x, y, { align: col.align ?? 'left' });
    }
    y += 5;
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

  // --- TÍTULO ---
  doc.setTextColor(19, 145, 105);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('REPORTE DE INVENTARIO — ORO EN BÓVEDA', pw / 2, y, { align: 'center' });
  y += 5;

  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  const genDate = data.generatedAt ?? new Date().toLocaleString('es-ES');
  doc.text(`Generado: ${genDate}`, pw - m, y, { align: 'right' });
  y += 8;

  // --- SECCIÓN 1: ORO REFUNDIDO ---
  if (data.lots.length > 0) {
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORO REFUNDIDO — ${data.lots.length} lote(s)`, m + 2, y + 1);
    y += 10;

    // Agrupar por proveedor
    const byProvider = new Map<string, BovedaLotData[]>();
    for (const lot of data.lots) {
      const key = lot.clientName || 'DESCONOCIDO';
      if (!byProvider.has(key)) byProvider.set(key, []);
      byProvider.get(key)!.push(lot);
    }

    for (const [providerName, providerLots] of byProvider) {
      checkPage(15);
      doc.setFillColor(19, 145, 105);
      doc.rect(m, y - 4, cw, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const providerTotal = providerLots.reduce((s, l) => s + Number(l.recovered ?? 0), 0);
      doc.text(`${providerName} — ${providerLots.length} lote(s) — ${formatWeight(providerTotal)}`, m + 2, y + 1);
      y += 10;

      // Cabecera de columnas
      checkPage(14);
      const colsW = [18, 35, 30, 30, 25, cw - 138];
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', m + 3, y);
      doc.text('PROCESO', m + 3 + colsW[0], y);
      doc.text('OPERADOR', m + 3 + colsW[0] + colsW[1], y);
      doc.text('BRUTO (g)', m + 3 + colsW[0] + colsW[1] + colsW[2], y);
      doc.text('FECHA', m + 3 + colsW[0] + colsW[1] + colsW[2] + colsW[3], y);
      doc.text('PESO FINO (g)', pw - m - 2, y, { align: 'right' });
      y += 6;

      let rowIdx = 0;
      for (const lot of providerLots) {
        checkPage(12);
        if (rowIdx % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(m, y - 3.5, cw, 6, 'F');
        }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(lot.name, m + 3, y);
        doc.text(lot.processName, m + 3 + colsW[0], y);
        doc.text(lot.operator ?? '—', m + 3 + colsW[0] + colsW[1], y);
        doc.text(formatWeight(Number(lot.recovered ?? 0)), m + 3 + colsW[0] + colsW[1] + colsW[2], y);
        const dateStr = '—';
        doc.text(dateStr, m + 3 + colsW[0] + colsW[1] + colsW[2] + colsW[3], y);
        doc.setTextColor(19, 145, 105);
        doc.text(formatWeight(Number(lot.grossWeight ?? 0)), pw - m - 2, y, { align: 'right' });
        y += 6;
        rowIdx++;

        // Desglose de barras
        if (lot.bars && lot.bars.length > 0) {
          for (const bar of lot.bars) {
            checkPage(8);
            doc.setFillColor(242, 250, 247);
            doc.rect(m, y - 3, cw, 5, 'F');
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(19, 145, 105);
            doc.text('↳', m + 3, y);
            doc.setTextColor(80, 80, 80);
            doc.text(bar.barNumber, m + 3 + colsW[0], y);
            doc.text(bar.clientName ?? '—', m + 3 + colsW[0] + colsW[1], y);
            doc.text(formatWeight(Number(bar.grossWeight ?? 0)), m + 3 + colsW[0] + colsW[1] + colsW[2], y);
            y += 4;
          }
        }
      }

      // Subtotal del proveedor
      checkPage(8);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total ${providerName}: ${formatWeight(providerTotal)}`, m + 3, y);
      y += 8;
    }
  }

  // --- SECCIÓN 2: ORO SIN REFUNDIR ---
  if (data.bars.length > 0) {
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`ORO SIN REFUNDIR — ${data.bars.length} barra(s)`, m + 2, y + 1);
    y += 10;

    // Agrupar por proveedor
    const barsByProvider = new Map<string, BovedaBarData[]>();
    for (const bar of data.bars) {
      const key = bar.clientName || 'DESCONOCIDO';
      if (!barsByProvider.has(key)) barsByProvider.set(key, []);
      barsByProvider.get(key)!.push(bar);
    }

    for (const [providerName, providerBars] of barsByProvider) {
      checkPage(15);
      doc.setFillColor(19, 145, 105);
      doc.rect(m, y - 4, cw, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      const provGross = providerBars.reduce((s, b) => s + b.grossWeight, 0);
      const provFine = providerBars.reduce((s, b) => s + b.fineWeight, 0);
      doc.text(`${providerName} — ${providerBars.length} barra(s) — Bruto: ${formatWeight(provGross)} / Fino: ${formatWeight(provFine)}`, m + 2, y + 1);
      y += 10;

      // Cabecera de columnas
      checkPage(14);
      const barColsW = [20, 40, 30, 30, cw - 120];
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', m + 3, y);
      doc.text('PROVEEDOR', m + 3 + barColsW[0], y);
      doc.text('LEY AU (‰)', m + 3 + barColsW[0] + barColsW[1], y);
      doc.text('BRUTO (g)', m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y);
      doc.text('PESO FINO (g)', pw - m - 2, y, { align: 'right' });
      y += 6;

      let rowIdx = 0;
      for (const bar of providerBars) {
        checkPage(8);
        if (rowIdx % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(m, y - 3.5, cw, 6, 'F');
        }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(bar.barNumber, m + 3, y);
        doc.text(bar.clientName, m + 3 + barColsW[0], y);
        doc.text(formatLey(bar.purity), m + 3 + barColsW[0] + barColsW[1], y);
        doc.text(formatWeight(bar.grossWeight), m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y);
        doc.setTextColor(19, 145, 105);
        doc.text(formatWeight(bar.fineWeight), pw - m - 2, y, { align: 'right' });
        y += 6;
        rowIdx++;
      }

      // Subtotal del proveedor
      checkPage(8);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(6);
      doc.setFont('helvetica', 'bold');
      doc.text(`Total ${providerName}: Bruto ${formatWeight(provGross)} / Fino ${formatWeight(provFine)}`, m + 3, y);
      y += 8;
    }
  }

  // --- TOTALES FINALES ---
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
  doc.text(`Bruto Total Refundido:   ${formatWeight(data.totalRecovered)}`, m, y); y += 5;
  doc.text(`Bruto Total Sin Refundir: ${formatWeight(data.totalGrossWeight)}`, m, y); y += 5;

  const grandTotal = data.totalRecovered + data.totalGrossWeight;
  const grandFine = data.totalFineWeight + data.bars.reduce((s, b) => s + b.fineWeight, 0);
  y += 2;
  doc.setFillColor(234, 244, 240);
  doc.rect(m, y - 4, cw, 7, 'F');
  doc.setTextColor(19, 145, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`GRAN TOTAL EN BÓVEDA: ${formatWeight(grandTotal)} Bruto / ${formatWeight(grandFine)} Fino`, m + 2, y + 1);
  y += 10;

  // --- PIE ---
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

  doc.save(`Boveda_Oro_${new Date().toISOString().slice(0, 10)}.pdf`);
}
