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

interface ProviderSummary {
  name: string;
  lotCount: number;
  barCount: number;
  looseCount: number;
  brutoRefundido: number;
  brutoSinRefundir: number;
  brutoTotal: number;
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

  // ============================================================
  //  RESUMEN CONSOLIDADO
  // ============================================================
  {
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN CONSOLIDADO POR PROVEEDOR', m + 2, y + 1);
    y += 10;

    const summaryMap = new Map<string, ProviderSummary>();
    const ensure = (name: string): ProviderSummary => {
      if (!summaryMap.has(name)) {
        summaryMap.set(name, { name, lotCount: 0, barCount: 0, looseCount: 0, brutoRefundido: 0, brutoSinRefundir: 0, brutoTotal: 0 });
      }
      return summaryMap.get(name)!;
    };

    for (const lot of data.lots) {
      const s = ensure(lot.clientName || 'DESCONOCIDO');
      s.lotCount++;
      s.barCount += lot.bars?.length ?? 0;
      s.brutoRefundido += Number(lot.recovered ?? 0);
    }
    for (const bar of data.bars) {
      const s = ensure(bar.clientName || 'DESCONOCIDO');
      s.looseCount++;
      s.barCount++;
      s.brutoSinRefundir += bar.grossWeight;
    }
    for (const s of summaryMap.values()) {
      s.brutoTotal = s.brutoRefundido + s.brutoSinRefundir;
    }

    const summaries = Array.from(summaryMap.values()).sort((a, b) => b.brutoTotal - a.brutoTotal);

    const sColsW = [42, 18, 20, 20, 26, 26, cw - 152];
    const sX = (col: number) => {
      let x = m + 3;
      for (let i = 0; i < col; i++) x += sColsW[i];
      return x;
    };

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
      doc.text(String(s.barCount), sX(1), y, { align: 'right' });
      doc.text(String(s.lotCount), sX(2), y, { align: 'right' });
      doc.text(String(s.looseCount), sX(3), y, { align: 'right' });
      doc.text(formatWeight(s.brutoRefundido), sX(4), y, { align: 'right' });
      doc.text(formatWeight(s.brutoSinRefundir), sX(5), y, { align: 'right' });
      doc.setTextColor(19, 145, 105);
      doc.text(formatWeight(s.brutoTotal), pw - m - 2, y, { align: 'right' });
      y += 5;
      rowIdx++;
    }

    if (summaries.length > 0) {
      checkPage(8);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.text('TOTALES GENERALES', sX(0), y);
      doc.text(String(summaries.reduce((a, s) => a + s.barCount, 0)), sX(1), y, { align: 'right' });
      doc.text(String(summaries.reduce((a, s) => a + s.lotCount, 0)), sX(2), y, { align: 'right' });
      doc.text(String(summaries.reduce((a, s) => a + s.looseCount, 0)), sX(3), y, { align: 'right' });
      doc.text(formatWeight(summaries.reduce((a, s) => a + s.brutoRefundido, 0)), sX(4), y, { align: 'right' });
      doc.text(formatWeight(summaries.reduce((a, s) => a + s.brutoSinRefundir, 0)), sX(5), y, { align: 'right' });
      doc.text(formatWeight(summaries.reduce((a, s) => a + s.brutoTotal, 0)), pw - m - 2, y, { align: 'right' });
      y += 8;
    }
  }

  // ============================================================
  //  DETALLE POR PROVEEDOR — ORO REFUNDIDO
  // ============================================================
  if (data.lots.length > 0) {
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DETALLE — ORO REFUNDIDO — ${data.lots.length} lote(s)`, m + 2, y + 1);
    y += 10;

    const byProvider = new Map<string, BovedaLotData[]>();
    for (const lot of data.lots) {
      const key = lot.clientName || 'DESCONOCIDO';
      if (!byProvider.has(key)) byProvider.set(key, []);
      byProvider.get(key)!.push(lot);
    }

    const lotColsW = [24, 42, 28, 30, cw - 124];
    const lotX = (col: number) => {
      let x = m + 3;
      for (let i = 0; i < col; i++) x += lotColsW[i];
      return x;
    };

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

      checkPage(14);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', lotX(0), y);
      doc.text('PROCESO', lotX(1), y);
      doc.text('BRUTO (g)', lotX(2), y, { align: 'right' });
      doc.text('PESO FINO (g)', lotX(3), y, { align: 'right' });
      doc.text('BARRAS', pw - m - 2, y, { align: 'right' });
      y += 6;

      let rowIdx = 0;
      for (const lot of providerLots) {
        checkPage(10);
        if (rowIdx % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(m, y - 3.5, cw, 6, 'F');
        }
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(80, 80, 80);
        doc.text(lot.name, lotX(0), y);
        doc.text(lot.processName, lotX(1), y);
        doc.setTextColor(19, 145, 105);
        doc.text(formatWeight(Number(lot.recovered ?? 0)), lotX(2), y, { align: 'right' });
        doc.text(formatWeight(Number(lot.grossWeight ?? 0)), lotX(3), y, { align: 'right' });
        doc.setTextColor(80, 80, 80);
        doc.text(String(lot.bars?.length ?? 0), pw - m - 2, y, { align: 'right' });
        y += 6;
        rowIdx++;

        if (lot.bars && lot.bars.length > 0) {
          for (const bar of lot.bars) {
            checkPage(6);
            doc.setFillColor(242, 250, 247);
            doc.rect(m, y - 3, cw, 5, 'F');
            doc.setFontSize(6);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(19, 145, 105);
            doc.text('\u21B3', m + 4, y);
            doc.setTextColor(80, 80, 80);
            doc.text(bar.barNumber, lotX(1), y);
            doc.text(bar.clientName ?? '—', lotX(2) + 2, y);
            doc.setTextColor(19, 145, 105);
            doc.text(formatWeight(Number(bar.grossWeight ?? 0)), pw - m - 2, y, { align: 'right' });
            y += 4;
          }
        }
      }

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

  // ============================================================
  //  DETALLE POR PROVEEDOR — ORO SIN REFUNDIR
  // ============================================================
  if (data.bars.length > 0) {
    checkPage(20);
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DETALLE — ORO SIN REFUNDIR — ${data.bars.length} barra(s)`, m + 2, y + 1);
    y += 10;

    const barsByProvider = new Map<string, BovedaBarData[]>();
    for (const bar of data.bars) {
      const key = bar.clientName || 'DESCONOCIDO';
      if (!barsByProvider.has(key)) barsByProvider.set(key, []);
      barsByProvider.get(key)!.push(bar);
    }

    const barColsW = [22, 40, 30, 28, cw - 120];
    const barX = (col: number) => {
      let x = m + 3;
      for (let i = 0; i < col; i++) x += barColsW[i];
      return x;
    };

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

      checkPage(14);
      doc.setFillColor(234, 244, 240);
      doc.rect(m, y - 3.5, cw, 6, 'F');
      doc.setTextColor(19, 145, 105);
      doc.setFontSize(5.5);
      doc.setFont('helvetica', 'bold');
      doc.text('CÓDIGO', barX(0), y);
      doc.text('PROVEEDOR', barX(1), y);
      doc.text('LEY AU (\u2030)', barX(2), y, { align: 'right' });
      doc.text('BRUTO (g)', barX(3), y, { align: 'right' });
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
        doc.text(bar.barNumber, barX(0), y);
        doc.text(bar.clientName, barX(1), y);
        doc.text(formatLey(bar.purity), barX(2), y, { align: 'right' });
        doc.text(formatWeight(bar.grossWeight), barX(3), y, { align: 'right' });
        doc.setTextColor(19, 145, 105);
        doc.text(formatWeight(bar.fineWeight), pw - m - 2, y, { align: 'right' });
        y += 6;
        rowIdx++;
      }

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
  doc.text(`GRAN TOTAL EN BOVEDA: ${formatWeight(grandTotal)} Bruto / ${formatWeight(grandFine)} Fino`, m + 2, y + 1);
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
  doc.text(`Fecha generacion: ${new Date().toLocaleString('es-ES')}`, m, y);

  doc.save(`Boveda_Oro_${new Date().toISOString().slice(0, 10)}.pdf`);
}
