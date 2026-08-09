import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { EgresosReportData, EgresoReportType, EgresoDetailedRecord } from '@/components/reportes/egresos/types';
import { formatLey, formatNumber } from '@/lib/format';

interface GenerateEgresosReportPDFParams {
  data: EgresosReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clienteName: string;
  reportType: EgresoReportType;
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

function drawTitleBlock(doc: jsPDF, y: number, pw: number, reportType: EgresoReportType) {
  const blockH = 14;

  doc.setFillColor(...TITLE_BG);
  doc.roundedRect(10, y, pw - 20, blockH, 0, 0, 'F');

  doc.setFillColor(...GREEN);
  doc.rect(10, y, 2, blockH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GREEN);
  doc.text('REPORTE DESGLOSADO DE EGRESOS DE MATERIAL', 16, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const subtitle = reportType === 'detallado'
    ? 'Desglose por lingote individual de cada egreso'
    : 'Resumen consolidado de salidas de material';
  doc.text(subtitle, 16, y + 11.5);

  return y + blockH + 4;
}

function drawFilterMetadata(doc: jsPDF, y: number, pw: number, params: GenerateEgresosReportPDFParams) {
  const boxH = 14;

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('Rango de Fechas:', 13, y + 5);
  doc.text('Cliente:', 13, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`${params.dateFrom} al ${params.dateTo}`, 42, y + 5);
  doc.text(params.clienteName, 42, y + 10);

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

function drawKPICards(doc: jsPDF, y: number, pw: number, summary: EgresosReportData['summary']) {
  const gap = 4;
  const cardW = (pw - 20 - gap * 2) / 3;
  const cardH = 22;

  const cards = [
    { label: 'TOTAL EGRESOS', value: String(summary.totalEgresos), sub: 'Salidas en el periodo' },
    { label: 'TOTAL LINGOTES', value: String(summary.totalLingotes), sub: 'Egresados' },
    { label: 'PESO BRUTO EGRESADO (BR)', value: `${formatNumber(summary.pesoBrutoBalanzaTotal)} g`, sub: `BI: ${formatNumber(summary.pesoBrutoTotal)} g | M: ${formatNumber(summary.mermaTotal)} g` },
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

function drawSummaryTable(doc: jsPDF, y: number, pw: number, data: EgresosReportData) {
  const { records, summary } = data;

  const bodyRows = records.map((r) => [
    `${r.id}\n${r.guia}`,
    r.cliente || '\u2014',
    r.fecha,
    String(r.lingotes),
    `${formatNumber(r.pesoBruto)}`,
    `${formatNumber(r.pesoBrutoBalanza)}`,
    `${formatNumber(r.merma)}`,
    `${formatLey(r.leyProm)}`,
  ]);

  bodyRows.push([
    `TOTALES (${summary.totalEgresos} Egresos)`,
    '',
    '',
    String(summary.totalLingotes),
    `${formatNumber(summary.pesoBrutoTotal)} g`,
    `${formatNumber(summary.pesoBrutoBalanzaTotal)} g`,
    `${formatNumber(summary.mermaTotal)} g`,
    '',
  ]);

  autoTable(doc, {
    startY: y,
    head: [['N\u00b0 Egreso / Gu\u00eda', 'Cliente', 'Fecha', 'Lingotes', 'BI (g)', 'BR (g)', 'M (g)', 'Ley Prom. (‰)']],
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
      1: { cellWidth: 34, halign: 'left' },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 15, halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'right' },
      7: { cellWidth: 20, halign: 'center' },
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

function drawDetailedSection(doc: jsPDF, startY: number, pw: number, detailed: EgresoDetailedRecord[]) {
  let y = startY;

  detailed.forEach((egreso) => {
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
    doc.text(egreso.id, 14, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(170, 170, 170);
    doc.text('|', 14 + doc.getTextWidth(egreso.id) + 3, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...GRAY_DARK);
    doc.text(egreso.cliente || '\u2014', 14 + doc.getTextWidth(egreso.id) + 8, y + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(`${egreso.fecha} | ${egreso.destino}`, pw - 14, y + 5.5, { align: 'right' });
    y += bannerH + 2;

    // Draw each lot with its bars
    egreso.lotes.forEach((lote, loteIdx) => {
      const pageH = doc.internal.pageSize.getHeight();
      if (y + 30 > pageH - 20) {
        doc.addPage();
        y = 15;
      }

      const lotStartY = y;

      // Lot header
      doc.setFillColor(245, 248, 247);
      doc.rect(10, y, pw - 20, 7, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(...GRAY_DARK);
      doc.text(lote.loteName, 14, y + 5);

      if (lote.recovered != null) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...GRAY);
        doc.text(`Peso Bruto Recuperado: ${formatNumber(lote.recovered)} gr`, pw - 14, y + 5, { align: 'right' });
      }

      if (lote.ley != null) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6);
        doc.setTextColor(...GRAY);
        const leyText = `Ley (‰): ${formatLey(lote.ley)}`;
        const recoveredWidth = lote.recovered != null ? doc.getTextWidth(`Peso Bruto Recuperado: ${formatNumber(lote.recovered)} gr`) : 0;
        doc.text(leyText, pw - 16 - recoveredWidth, y + 5, { align: 'right' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.setTextColor(...GRAY);
      doc.text(`${lote.barras.length} ${lote.barras.length === 1 ? 'barra' : 'barras'}`, pw / 2, y + 5, { align: 'center' });
      y += 7;

      // Bars sub-table
      if (lote.barras.length > 0) {
        const barBodyRows = lote.barras.map((barra) => [
          barra.barCode,
          `${formatNumber(barra.pesoBruto)}`,
          `${formatNumber(barra.pesoBalanza ?? barra.pesoBruto)}`,
          `${formatNumber(barra.pesoBruto - (barra.pesoBalanza ?? barra.pesoBruto))}`,
          `${formatLey(barra.ley)}`,
          barra.proveedor,
        ]);

        autoTable(doc, {
          startY: y,
          head: [['Código Barra', 'BI (g)', 'BR (g)', 'M (g)', 'Ley (‰)', 'Proveedor']],
          body: barBodyRows,
          theme: 'grid',
          headStyles: {
            fillColor: [19, 145, 105],
            textColor: WHITE,
            fontStyle: 'bold',
            fontSize: 6,
            halign: 'center',
            cellPadding: 2,
            lineColor: GREEN,
            lineWidth: 0.2,
          },
          bodyStyles: {
            fontSize: 6,
            textColor: [51, 51, 51],
            cellPadding: 1.5,
            lineColor: [240, 240, 240],
            lineWidth: 0.15,
          },
          columnStyles: {
            0: { cellWidth: 30, halign: 'left' },
            1: { halign: 'right' },
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { cellWidth: 18, halign: 'center' },
            5: { cellWidth: 52, halign: 'left' },
          },
          alternateRowStyles: {
            fillColor: ROW_ALT,
          },
          margin: { left: 14, right: 10 },
        });

        y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 3;
      }

      // Draw border around the lot block
      const lotEndY = y;
      doc.setDrawColor(...GREEN_BORDER);
      doc.setLineWidth(0.3);
      doc.roundedRect(9.5, lotStartY - 0.5, pw - 19, lotEndY - lotStartY + 1, 1.5, 1.5, 'S');

      // Add spacing between lots
      if (loteIdx < egreso.lotes.length - 1) {
        y += 2;
      }
    });

    // Subtotal
    const subRows = [[
      `Subtotal \u2014 ${egreso.lingotes} Lingotes`,
      `${formatNumber(egreso.pesoBruto)} g`,
      `${formatNumber(egreso.pesoBrutoBalanza)} g`,
      `${formatNumber(egreso.merma)} g`,
      '',
      `${formatNumber(egreso.pesoFino)} g`,
    ]];

    autoTable(doc, {
      startY: y,
      body: subRows,
      theme: 'grid',
      bodyStyles: {
        fontSize: 7,
        fontStyle: 'bold',
        textColor: GREEN,
        cellPadding: 2.5,
        fillColor: GREEN_LIGHT,
        lineColor: GREEN,
        lineWidth: 0.3,
      },
      columnStyles: {
        0: { cellWidth: 60, halign: 'left' },
        1: { halign: 'right' },
        2: { halign: 'right' },
        3: { halign: 'right' },
        5: { halign: 'right' },
      },
      margin: { left: 10, right: 10 },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  });

  return y;
}

function drawTotalesGenerales(doc: jsPDF, y: number, pw: number, summary: EgresosReportData['summary']) {
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
  doc.text(`TOTALES GENERALES \u2014 ${summary.totalEgresos} Egresos`, 14, y + 5.5);
  y += 8;

  doc.setDrawColor(...GREEN_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  const colW = (pw - 20) / 5;
  const cols = [
    { label: 'Total Lingotes', value: String(summary.totalLingotes) },
    { label: 'Peso Bruto (BI)', value: `${formatNumber(summary.pesoBrutoTotal)} g` },
    { label: 'Peso Balanza (BR)', value: `${formatNumber(summary.pesoBrutoBalanzaTotal)} g` },
    { label: 'Merma Total', value: `${formatNumber(summary.mermaTotal)} g` },
    { label: 'Peso Fino Total', value: `${formatNumber(summary.pesoFinoTotal)} g` },
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

export function generateEgresosReportPDF(params: GenerateEgresosReportPDFParams) {
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

  doc.save(`Reporte_Egresos_BANDES_${params.reportId.replace('#', '')}.pdf`);
}
