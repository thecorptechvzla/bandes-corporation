import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { PackingReportData, ReportType, PackingDetailedRecord } from '@/components/reportes/packing/types';
import { formatLey, formatNumber } from '@/lib/format';

interface GeneratePackingReportPDFParams {
  data: PackingReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clientName: string;
  reportType: ReportType;
}

const GREEN: [number, number, number] = [19, 145, 105];
const GREEN_LIGHT: [number, number, number] = [234, 244, 240];
const GREEN_BORDER: [number, number, number] = [194, 229, 217];
const GRAY: [number, number, number] = [102, 102, 102];
const GRAY_DARK: [number, number, number] = [68, 68, 68];
const WHITE: [number, number, number] = [255, 255, 255];
const ROW_ALT: [number, number, number] = [251, 253, 252];
const TITLE_BG: [number, number, number] = [248, 250, 249];
const BORDER_LIGHT: [number, number, number] = [224, 224, 224];

function drawMembrete(doc: jsPDF, pw: number) {
  let y = 12;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...GREEN);
  doc.text('BANDES', 10, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Banco de Desarrollo Economico y Social de Venezuela', 10, y + 8);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_DARK);
  doc.text('R.I.F.: G-20001643-0', pw - 10, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Gerencia General de Operaciones', pw - 10, y + 5, { align: 'right' });
  doc.text('Caracas, Venezuela', pw - 10, y + 10, { align: 'right' });

  y += 15;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.line(10, y, pw - 10, y);

  return y + 4;
}

function drawTitleBlock(doc: jsPDF, y: number, pw: number, reportType: ReportType) {
  const blockH = 14;

  doc.setFillColor(...TITLE_BG);
  doc.roundedRect(10, y, pw - 20, blockH, 0, 0, 'F');

  doc.setFillColor(...GREEN);
  doc.rect(10, y, 2, blockH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GREEN);
  doc.text(
    reportType === 'detallado' ? 'REPORTE DETALLADO DE PACKINGS RECIBIDOS' : 'REPORTE DESGLOSADO DE PACKINGS RECIBIDOS',
    16, y + 6,
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const subtitle = reportType === 'detallado'
    ? 'Desglose por barra individual de cada packing recibido'
    : 'Resumen consolidado de recepciones de material valioso';
  doc.text(subtitle, 16, y + 11.5);

  return y + blockH + 4;
}

function drawFilterMetadata(doc: jsPDF, y: number, pw: number, params: GeneratePackingReportPDFParams) {
  const boxH = 14;

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('Rango de Fechas:', 13, y + 5);
  doc.text('Cliente / Entidad:', 13, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`${params.dateFrom} al ${params.dateTo}`, 44, y + 5);
  doc.text(params.clientName, 44, y + 10);

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.2);
  doc.line(pw / 2, y + 2, pw / 2, y + boxH - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('ID Documento:', pw / 2 + 4, y + 5);
  doc.text('Fecha de Generacion:', pw / 2 + 4, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(params.reportId, pw / 2 + 36, y + 5);
  doc.text(params.generatedAt, pw / 2 + 36, y + 10);

  return y + boxH + 4;
}

function drawKPICards(doc: jsPDF, y: number, pw: number, summary: PackingReportData['summary']) {
  const gap = 4;
  const cardW = (pw - 20 - gap * 2) / 3;
  const cardH = 22;

  const cards = [
    { label: 'TOTAL PACKINGS', value: String(summary.totalPackings), sub: 'Procesados' },
    { label: 'TOTAL BARRAS', value: `${summary.totalBarras} (${summary.totalValidadas} / ${summary.totalPendientes})`, sub: 'Unidades recibidas — Val. / Pend.' },
    { label: 'TOTAL PESO BRUTO', value: `${formatNumber(summary.pesoBrutoTotal)} g`, sub: `Ley Prom (‰): ${formatLey(summary.leyProm)}` },
  ];

  cards.forEach((card, i) => {
    const x = 10 + i * (cardW + gap);

    doc.setFillColor(244, 249, 247);
    doc.setDrawColor(...GREEN_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GREEN);
    doc.text(card.label, x + cardW / 2, y + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(17, 17, 17);
    doc.text(card.value, x + cardW / 2, y + 12, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(card.sub, x + cardW / 2, y + 18, { align: 'center' });
  });

  return y + cardH + 4;
}

function drawSummaryTable(doc: jsPDF, y: number, pw: number, data: PackingReportData) {
  const { records, summary } = data;

  const bodyRows = records.map((r) => [
    `${r.id}\n${r.file}`,
    r.client,
    `${r.barras} (${r.barrasValidadas} / ${r.barrasPendientes})`,
    `${formatNumber(r.pesoBruto)}`,
    `${formatLey(r.ley)}`,
    `${formatNumber(r.pesoFino)}`,
  ]);

  bodyRows.push([
    `TOTALES (${summary.totalPackings} Packings)`,
    '\u2014',
    `${summary.totalBarras} (${summary.totalValidadas} / ${summary.totalPendientes}) Barras`,
    `${formatNumber(summary.pesoBrutoTotal)} g`,
    `${formatLey(summary.leyProm)} (Prom)`,
    `${formatNumber(summary.pesoFinoTotal)} g`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['N\u00b0 Packing / Archivo', 'Cliente / Raz\u00f3n Social', 'Barras (Val. / Pend.)', 'Peso Bruto (g)', 'Ley (‰)', 'Peso Fino (g)']],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      cellPadding: 3,
      lineColor: GREEN,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 7,
      textColor: [51, 51, 51],
      cellPadding: 2.5,
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 32, halign: 'left' },
      1: { cellWidth: 42, halign: 'left' },
      2: { cellWidth: 16, halign: 'center' },
      3: { halign: 'right' },
      4: { cellWidth: 22, halign: 'right' },
      5: { halign: 'right' },
    },
    alternateRowStyles: {
      fillColor: ROW_ALT,
    },
    margin: { left: 10, right: 10 },
    didParseCell: (data) => {
      const totalRowIndex = records.length;
      if (data.section === 'body' && data.row.index === totalRowIndex) {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = GREEN;
        data.cell.styles.fillColor = GREEN_LIGHT;
        data.cell.styles.lineColor = GREEN;
        data.cell.styles.lineWidth = 0.3;
      }
    },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

function drawDetailedSection(doc: jsPDF, startY: number, pw: number, detailed: PackingDetailedRecord[]) {
  let y = startY;

  detailed.forEach((packing) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + 55 > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }

    const bannerH = 14;
    doc.setFillColor(...GREEN_LIGHT);
    doc.roundedRect(10, y, pw - 20, bannerH, 1, 1, 'F');
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.line(10, y + bannerH, pw - 10, y + bannerH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...GREEN);
    doc.text(packing.id, 14, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 170);
    doc.text('|', 14 + doc.getTextWidth(packing.id) + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_DARK);
    doc.text(packing.file, 14 + doc.getTextWidth(packing.id) + 8, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY);
    doc.text(packing.client, pw - 14, y + 5.5, { align: 'right' });
    y += bannerH + 2;

    const spWeightFor = (b: (typeof packing.bars)[number]): number | null => {
      if (b.spGrossWeight != null) return b.spGrossWeight;
      if (b.status === 'POR_VALIDAR') return b.pesoBruto;
      return null;
    };
    const spPurityFor = (b: (typeof packing.bars)[number]): number | null => {
      if (b.spPurity != null) return b.spPurity;
      if (b.status === 'POR_VALIDAR') return b.ley;
      return null;
    };
    const fmtWeight = (v: number | null | undefined) => (v != null ? formatNumber(Number(v), 2) : '-');
    const fmtdiff = (v: number | null | undefined) => (v != null ? `${v > 0 ? '+' : ''}${formatNumber(Number(v), 2)}` : '-');

    const bodyRows = packing.bars.map((bar) => {
      const isPorValidar = bar.status === 'POR_VALIDAR';
      const spW = spWeightFor(bar);
      const spP = spPurityFor(bar);
      const difW = !isPorValidar && bar.spGrossWeight != null ? Math.round((bar.pesoBruto - bar.spGrossWeight) * 100) / 100 : null;
      const difP = !isPorValidar && bar.spPurity != null ? Math.round((bar.ley - bar.spPurity) * 100) / 100 : null;
      return [
        `${bar.lote}\n${bar.barId}`,
        fmtWeight(spW),
        spP != null ? formatLey(spP) : '-',
        isPorValidar ? '-' : fmtWeight(bar.pesoBruto),
        isPorValidar ? '-' : formatLey(bar.ley),
        fmtdiff(difW),
        fmtdiff(difP),
        isPorValidar ? 'POR VALIDAR' : 'VALIDADA',
      ];
    });

    const spTotal = packing.bars.reduce((a, b) => a + Number(spWeightFor(b) ?? 0), 0);
    const valTotal = packing.bars.reduce((a, b) => a + (b.status === 'POR_VALIDAR' ? 0 : b.pesoBruto), 0);
    const difTotal = packing.bars.reduce(
      (a, b) => a + (b.status !== 'POR_VALIDAR' && b.spGrossWeight != null ? b.pesoBruto - b.spGrossWeight : 0),
      0,
    );
    bodyRows.push([
      `Subtotal \u2014 ${packing.barras} Barras`,
      `${formatNumber(spTotal)} g`,
      '\u03a3 Ley SP',
      `${formatNumber(valTotal)} g`,
      '\u03a3 Ley Val.',
      `${difTotal > 0 ? '+' : ''}${formatNumber(difTotal)} g`,
      '\u03a3 Dif. Ley',
      `${packing.barras} (${packing.barrasValidadas} / ${packing.barrasPendientes})`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['C\u00d3DIGO BARRA', 'BRUTO SP', 'LEY SP (\u2030)', 'BRUTO VAL.', 'LEY VAL. (\u2030)', 'DIF. BRUTO', 'DIF. LEY', 'ESTADO']],
      body: bodyRows,
      theme: 'grid',
      headStyles: {
        fillColor: GREEN,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 6.5,
        halign: 'center',
        cellPadding: 2.5,
        lineColor: GREEN,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [51, 51, 51],
        cellPadding: 2,
        lineColor: [240, 240, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 40, halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'center' },
      },
      alternateRowStyles: {
        fillColor: ROW_ALT,
      },
      margin: { left: 10, right: 10 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === packing.bars.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fillColor = GREEN_LIGHT;
          data.cell.styles.lineColor = GREEN;
          data.cell.styles.lineWidth = 0.3;
        }
        if (data.section === 'body' && data.row.index < packing.bars.length) {
          const estado = data.row.raw[7] as string;
          if (estado === 'POR VALIDAR') {
            data.cell.styles.textColor = [153, 111, 0];
          }
          if (estado === 'VALIDADA' && (data.column.index === 5 || data.column.index === 6)) {
            const dif = data.row.raw[data.column.index] as string;
            if (dif !== '-') {
              data.cell.styles.textColor = GREEN;
              data.cell.styles.fontStyle = 'bold';
            }
          }
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  });

  return y;
}

function drawTotalesGenerales(doc: jsPDF, y: number, pw: number, summary: PackingReportData['summary']) {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (y + 30 > pageHeight - 20) {
    doc.addPage();
    y = 15;
  }

  const boxH = 22;

  doc.setFillColor(...GREEN);
  doc.roundedRect(10, y, pw - 20, 8, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(`TOTALES GENERALES \u2014 ${summary.totalPackings} Packings`, 14, y + 5.5);
  y += 8;

  doc.setDrawColor(...GREEN_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  const colW = (pw - 20) / 5;
  const cols = [
    { label: 'Total Barras (Val / Pend)', value: `${summary.totalBarras} (${summary.totalValidadas} / ${summary.totalPendientes})` },
    { label: 'Peso Bruto Total', value: `${formatNumber(summary.pesoBrutoTotal)} g` },
    { label: 'Peso Fino Total', value: `${formatNumber(summary.pesoFinoTotal)} g` },
    { label: 'Barras Validadas', value: String(summary.totalValidadas) },
    { label: 'Barras Pendientes', value: String(summary.totalPendientes) },
  ];

  cols.forEach((col, i) => {
    const x = 10 + i * colW;

    if (i > 0) {
      doc.setDrawColor(...GREEN_BORDER);
      doc.setLineWidth(0.2);
      doc.line(x, y + 3, x, y + boxH - 3);
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(...GRAY);
    doc.text(col.label.toUpperCase(), x + colW / 2, y + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...GREEN);
    doc.text(col.value, x + colW / 2, y + 17, { align: 'center' });
  });

  return y + boxH + 4;
}

function drawFooter(doc: jsPDF, pageNum: number, totalPages: number, pw: number, ph: number) {
  const yLine = ph - 14;
  const yText = ph - 9;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(10, yLine, pw - 10, yLine);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(136, 136, 136);
  doc.text('Documento generado automaticamente por el Sistema de Custodia y Control - BANDES.', 10, yText);
  doc.text(`Pagina ${pageNum} de ${totalPages}`, pw - 10, yText, { align: 'right' });
}

function addFooters(doc: jsPDF, pw: number, ph: number) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages, pw, ph);
  }
}

export function generatePackingReportPDF(params: GeneratePackingReportPDFParams) {
  const { reportType, data } = params;
  const { summary } = data;

  const isLandscape = reportType === 'detallado';
  const pw = isLandscape ? 279.4 : 215.9;
  const ph = isLandscape ? 215.9 : 279.4;

  const doc = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  let currentY = drawMembrete(doc, pw);
  currentY = drawTitleBlock(doc, currentY, pw, reportType);
  currentY = drawFilterMetadata(doc, currentY, pw, params);
  currentY = drawKPICards(doc, currentY, pw, summary);

  if (reportType === 'resumido') {
    currentY = drawSummaryTable(doc, currentY, pw, data);
  } else {
    currentY = drawDetailedSection(doc, currentY, pw, data.detailed ?? []);
    currentY = drawTotalesGenerales(doc, currentY, pw, summary);
  }

  addFooters(doc, pw, ph);

  doc.save(`Reporte_Packings_BANDES_${params.reportId.replace('#', '')}.pdf`);
}
