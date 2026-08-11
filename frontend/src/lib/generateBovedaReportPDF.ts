import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatWeight, formatLey } from '@/lib/format';

interface LotBar {
  barNumber: string;
  grossWeight: number;
  purity?: number;
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
  purity?: number | null;
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
  //  DETALLADO — BLOQUES POR LOTE CON DESGLOSE DE BARRAS
  //  ============================================================
  if (type === 'DETALLADO') {
    const GREEN: [number, number, number] = [19, 145, 105];
    const BLOCK_LEFT = 14;
    const BLOCK_RIGHT = pw - 10;
    const BLOCK_WIDTH = BLOCK_RIGHT - BLOCK_LEFT;
    const GREEN_LIGHT: [number, number, number] = [234, 244, 240];
    const GREEN_BORDER: [number, number, number] = [194, 229, 217];
    const GRAY_DARK: [number, number, number] = [68, 68, 68];
    const WHITE: [number, number, number] = [255, 255, 255];
    const ROW_ALT: [number, number, number] = [251, 253, 252];

    const tableCols = {
      theme: 'grid' as const,
      margin: { left: BLOCK_LEFT, right: pw - BLOCK_RIGHT },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 52 },
        2: { cellWidth: 40 },
        3: { cellWidth: 18, halign: 'right' as const },
        4: { cellWidth: 'auto' as const, halign: 'right' as const },
      },
    };

    const getFinalY = (): number =>
      (doc as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? y;

    const drawBarsTable = (
      bars: { barNumber: string; proveedor: string; origen: string; ley: number; peso: number }[],
    ) => {
      checkPage(30);
      autoTable(doc, {
        ...tableCols,
        startY: y,
        head: [['Código Barra', 'Proveedor', 'Origen', 'Ley (‰)', 'Peso Bruto (g)']],
        headStyles: { fillColor: GREEN, fontSize: 6, fontStyle: 'bold', textColor: WHITE },
        bodyStyles: { fontSize: 6, textColor: [51, 51, 51], cellPadding: 1.2 },
        alternateRowStyles: { fillColor: ROW_ALT },
        body: bars.map((b) => [b.barNumber, b.proveedor, b.origen, formatLey(b.ley), formatWeight(b.peso)]),
      });
      y = getFinalY() + 3;
    };

    const drawSubtotal = (label: string, peso: number, count: number) => {
      autoTable(doc, {
        ...tableCols,
        startY: y,
        head: [],
        body: [[`${label} (${count} barra(s))`, '', '', '', formatWeight(peso)]],
        bodyStyles: { fontSize: 7, fontStyle: 'bold', fillColor: GREEN_LIGHT, textColor: GREEN, cellPadding: 2 },
        columnStyles: { ...tableCols.columnStyles, 0: { cellWidth: 60 } },
      });
      y = getFinalY() + 4;
    };

    const encloseBlock = (startY: number) => {
      doc.setDrawColor(GREEN_BORDER[0], GREEN_BORDER[1], GREEN_BORDER[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(BLOCK_LEFT, startY - 0.5, BLOCK_WIDTH, y - startY + 0.5, 1.5, 1.5, 'S');
      y += 2;
    };

    // Section header
    checkPage(20);
    doc.setFillColor(...GREEN_LIGHT);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(...GREEN);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`DETALLADO — ${data.lots.length} lote(s) · ${data.bars.length} barra(s) sin refundir`, m + 2, y + 1);
    y += 10;

    // Block header for each lot / group (clon del layout de Egresos)
    const blockHeader = (
      label: string,
      count: number,
      recovered?: number,
      ley?: number,
    ) => {
      doc.setFillColor(245, 248, 247);
      doc.rect(BLOCK_LEFT, y, BLOCK_WIDTH, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(GRAY_DARK[0], GRAY_DARK[1], GRAY_DARK[2]);
      doc.text(label, m + 1, y + 5);

      if (recovered != null) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        const recoveredText = `Peso Bruto Recuperado: ${formatWeight(recovered)}`;
        doc.text(recoveredText, pw - m - 2, y + 5, { align: 'right' });
      }

      if (ley != null) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        const leyText = `Ley (‰): ${formatLey(ley)}`;
        const recoveredWidth = recovered != null ? doc.getTextWidth(`Peso Bruto Recuperado: ${formatWeight(recovered)}`) : 0;
        doc.text(leyText, pw - m - 2 - recoveredWidth - 8, y + 5, { align: 'right' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(`${count} ${count === 1 ? 'barra' : 'barras'}`, pw / 2, y + 5, { align: 'center' });
      y += 7;
    };

    // One block per lot (fundido/refundido)
    for (const lot of data.lots) {
      const blockStart = y;
      const bars = lot.bars ?? [];
      const recovered = Number(lot.recovered ?? 0);
      const pureza = Number(lot.purity ?? 0);

      blockHeader(`LOTE ${lot.name}`, bars.length, recovered, pureza);

      if (bars.length > 0) {
        drawBarsTable(
          bars.map((b) => ({
            barNumber: b.barNumber,
            proveedor: b.clientName || lot.clientName || 'DESCONOCIDO',
            origen: '',
            ley: Number(b.purity ?? 0),
            peso: Number(b.grossWeight ?? 0),
          })),
        );
        drawSubtotal('Subtotal Lote', bars.reduce((a, b) => a + Number(b.grossWeight ?? 0), 0), bars.length);
      } else {
        y += 2;
        doc.setFontSize(6.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(100, 100, 100);
        doc.text(`  Sin barras asociadas (peso recuperado ${formatWeight(recovered)})`, m + 2, y);
        y += 6;
      }

      // Block border
      encloseBlock(blockStart);
    }

    // Block: barras sin refundir (ingreso directo)
    if (data.bars.length > 0) {
      const blockStart = y;
      blockHeader(
        'BARRAS SIN REFUNDIR',
        data.bars.length,
        data.bars.reduce((a, b) => a + b.grossWeight, 0),
      );
      drawBarsTable(
        data.bars.map((bar) => ({
          barNumber: bar.barNumber,
          proveedor: bar.clientName || 'DESCONOCIDO',
          origen: 'Ingreso directo',
          ley: Number(bar.purity ?? 0),
          peso: Number(bar.grossWeight ?? 0),
        })),
      );
      drawSubtotal(
        'Subtotal Sin Refundir',
        data.bars.reduce((a, b) => a + b.grossWeight, 0),
        data.bars.length,
      );
      encloseBlock(blockStart);
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
