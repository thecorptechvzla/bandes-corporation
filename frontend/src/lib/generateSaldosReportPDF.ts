import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { SaldoRecord, SaldoDetailedRecord, SaldoReportType } from '@/components/reportes/saldos/types';
import { formatLey, formatNumber } from '@/lib/format';

interface GenerateSaldosReportPDFParams {
  records: SaldoRecord[];
  detailedRecords: SaldoDetailedRecord[];
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  clienteName: string;
  reportType: SaldoReportType;
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

  // Left side — BANDES brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...GREEN);
  doc.text('BANDES', 10, y + 2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY);
  doc.text('Banco de Desarrollo Economico y Social de Venezuela', 10, y + 8);

  // Right side — RIF info
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...GRAY_DARK);
  doc.text('R.I.F.: G-20001643-0', pw - 10, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('Gerencia General de Operaciones', pw - 10, y + 5, { align: 'right' });
  doc.text('Caracas, Venezuela', pw - 10, y + 10, { align: 'right' });

  // Green bottom border
  y += 15;
  doc.setDrawColor(...GREEN);
  doc.setLineWidth(0.5);
  doc.line(10, y, pw - 10, y);

  return y + 4;
}

function drawTitleBlock(doc: jsPDF, y: number, pw: number, params: GenerateSaldosReportPDFParams) {
  const blockH = 14;

  // Background
  doc.setFillColor(...TITLE_BG);
  doc.roundedRect(10, y, pw - 20, blockH, 0, 0, 'F');

  // Green left border
  doc.setFillColor(...GREEN);
  doc.rect(10, y, 2, blockH, 'F');

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GREEN);
  doc.text('REPORTE DE BALANCE POR PROVEEDOR', 16, y + 6);

  // Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const subtitle = params.reportType === 'detallado'
    ? 'Desglose detallado de barras en bóveda por proveedor'
    : 'Resumen consolidado de balances por proveedor';
  doc.text(subtitle, 16, y + 11.5);

  return y + blockH + 4;
}

function drawFilterMetadata(doc: jsPDF, y: number, pw: number, params: GenerateSaldosReportPDFParams) {
  const boxH = 14;

  // Box border
  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  // Left column
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('Rango de Fechas:', 13, y + 5);
  doc.text('Proveedor:', 13, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`${params.dateFrom} al ${params.dateTo}`, 42, y + 5);
  doc.text(params.clienteName, 42, y + 10);

  // Divider
  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.2);
  doc.line(pw / 2, y + 2, pw / 2, y + boxH - 2);

  // Right column
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

function drawKPICards(doc: jsPDF, y: number, pw: number, records: SaldoRecord[]) {
  const totalIngresado = records.reduce((a, r) => a + r.totalRecibido, 0);
  const totalEgresadoBI = records.reduce((a, r) => a + r.totalEgresado, 0);
  const totalEgresadoBR = records.reduce((a, r) => a + r.totalEgresadoBR, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  const saldoActual = records.reduce((a, r) => a + r.saldoActual, 0);

  const gap = 4;
  const cardW = (pw - 20 - gap * 2) / 3;
  const cardH = 18;

  const cards = [
    { label: 'TOTAL PESO BRUTO INGRESADO', value: `${formatNumber(totalIngresado)} g`, sub: 'Peso Bruto Recibido' },
    { label: 'TOTAL PESO BRUTO EGRESADO (BR)', value: `${formatNumber(totalEgresadoBR)} g`, sub: `BI: ${formatNumber(totalEgresadoBI)} g | M: ${formatNumber(mermaTotal)} g` },
    { label: 'BALANCE PESO BRUTO ACTUAL', value: `${formatNumber(saldoActual)} g`, sub: 'Peso Bruto Restante Disponible' },
  ];

  cards.forEach((card, i) => {
    const x = 10 + i * (cardW + gap);

    // Card background
    doc.setFillColor(244, 249, 247);
    doc.setDrawColor(...GREEN_BORDER);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, cardW, cardH, 1.5, 1.5, 'FD');

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...GREEN);
    doc.text(card.label, x + cardW / 2, y + 5.5, { align: 'center' });

    // Value
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text(card.value, x + cardW / 2, y + 11, { align: 'center' });

    // Sub
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(card.sub, x + cardW / 2, y + 15.5, { align: 'center' });
  });

  return y + cardH + 4;
}

function drawSummaryTable(doc: jsPDF, y: number, pw: number, records: SaldoRecord[]) {
  const totalIngresado = records.reduce((a, r) => a + r.totalRecibido, 0);
  const totalEgresado = records.reduce((a, r) => a + r.totalEgresado, 0);
  const totalEgresadoBR = records.reduce((a, r) => a + r.totalEgresadoBR, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  const saldoTotal = records.reduce((a, r) => a + r.saldoActual, 0);
  const barrasTotal = records.reduce((a, r) => a + r.barrasEnBoveda, 0);

  const bodyRows = records.map((r) => [
    r.cliente,
    `${formatNumber(r.totalRecibido)}`,
    `${formatNumber(r.totalEgresado)}`,
    `${formatNumber(r.totalEgresadoBR)}`,
    `${formatNumber(r.merma)}`,
    `${formatNumber(r.saldoActual)}`,
    `${r.barrasEnBoveda}`,
  ]);

  bodyRows.push([
    `TOTALES (${records.length} Proveedores)`,
    `${formatNumber(totalIngresado)}`,
    `${formatNumber(totalEgresado)}`,
    `${formatNumber(totalEgresadoBR)}`,
    `${formatNumber(mermaTotal)}`,
    `${formatNumber(saldoTotal)}`,
    `${barrasTotal} Barras`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['Cliente / Proveedor', 'Total Recibido (g)', 'Egresado BI (g)', 'Egresado BR (g)', 'MERMA (g)', 'Balance Restante (g)', 'Barras Boveda']],
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
      0: { cellWidth: 50, halign: 'left' },
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right', fontStyle: 'bold', textColor: GREEN },
      6: { halign: 'center' },
    },
    alternateRowStyles: {
      fillColor: ROW_ALT,
    },
    margin: { left: 10, right: 10 },
    didParseCell: (data) => {
      // Totals row styling
      if (data.section === 'body' && data.row.index === records.length) {
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

function drawDetailedSection(doc: jsPDF, startY: number, pw: number, records: SaldoDetailedRecord[]) {
  let y = startY;

  records.forEach((cliente) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    if (y + 55 > pageHeight - 20) {
      doc.addPage();
      y = 15;
    }

    // Client banner — green background with border
    const bannerH = 14;
    doc.setFillColor(...GREEN_LIGHT);
    doc.roundedRect(10, y, pw - 20, bannerH, 1, 1, 'F');
    doc.setDrawColor(...GREEN);
    doc.setLineWidth(0.4);
    doc.line(10, y + bannerH, pw - 10, y + bannerH);

    // Client name
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...GREEN);
    doc.text(cliente.cliente, 14, y + 5.5);

    // Summary on second line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(
      `Peso Bruto Recibido: ${formatNumber(cliente.totalRecibido)} g  |  Egresado BI: ${formatNumber(cliente.totalEgresado)} g  |  Egresado BR: ${formatNumber(cliente.totalEgresadoBR)} g  |  MERMA: ${formatNumber(cliente.merma)} g  |  BALANCE PESO BRUTO: ${formatNumber(cliente.saldoActual)} g`,
      14,
      y + 11
    );
    y += bannerH + 2;

    // Bar detail table — 8 columns
    const bodyRows = cliente.barras.map((b) => [
      b.loteId,
      b.packingOrigen,
      b.fechaRecepcion,
      `${formatNumber(b.pesoBrutoRecibido)}`,
      `${formatLey(b.ley)}`,
      `${formatNumber(b.pesoFinoDisponible)}`,
      b.fueEgresado
        ? `BI: ${formatNumber(b.pesoBrutoRecibido)} g | BR: ${formatNumber(b.pesoBrutoEnBoveda)} g | M: ${formatNumber(b.pesoBrutoRecibido - b.pesoBrutoEnBoveda)} g`
        : `${formatNumber(b.pesoBrutoEnBoveda)}`,
      b.fueEgresado ? (b.fechaEgreso ?? '') : 'EN BOVEDA',
    ]);

    const totBrutoRecibido = cliente.barras.reduce((a, b) => a + b.pesoBrutoRecibido, 0);
    const totFino = cliente.barras.reduce((a, b) => a + b.pesoFinoDisponible, 0);
    const totBrutoBoveda = cliente.barras.reduce((a, b) => a + b.pesoBrutoEnBoveda, 0);
    bodyRows.push([
      `Subtotal - ${cliente.barrasEnBoveda} Barras`,
      '',
      '',
      `${formatNumber(totBrutoRecibido)}`,
      '',
      `${formatNumber(totFino)}`,
      `${formatNumber(totBrutoBoveda)}`,
      '',
    ]);

    autoTable(doc, {
      startY: y,
      head: [['N Lote / ID Barra', 'Packing Origen', 'Fecha Recepcion', 'Peso Bruto Recibido (g)', 'Ley (‰)', 'Peso Fino Disponible (g)', 'Boveda / Egreso (BI-BR-M)', 'Fecha Egreso / Estatus']],
      body: bodyRows,
      theme: 'grid',
      headStyles: {
        fillColor: GREEN,
        textColor: WHITE,
        fontStyle: 'bold',
        fontSize: 6,
        halign: 'center',
        cellPadding: 2,
        lineColor: GREEN,
        lineWidth: 0.3,
      },
      bodyStyles: {
        fontSize: 6.5,
        textColor: [51, 51, 51],
        cellPadding: 1.8,
        lineColor: [240, 240, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 26, halign: 'left' },
        1: { cellWidth: 26, halign: 'left' },
        2: { halign: 'center', cellWidth: 20 },
        3: { halign: 'right' },
        4: { halign: 'center', cellWidth: 14 },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'center', cellWidth: 22 },
      },
      alternateRowStyles: {
        fillColor: ROW_ALT,
      },
      margin: { left: 10, right: 10 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === cliente.barras.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fillColor = GREEN_LIGHT;
          data.cell.styles.lineColor = GREEN;
          data.cell.styles.lineWidth = 0.3;
        }
        // "EN BOVEDA" green text
        if (data.section === 'body' && data.column.index === 7 && data.cell.raw === 'EN BOVEDA') {
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  });

  return y;
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

export function generateSaldosReportPDF(params: GenerateSaldosReportPDFParams) {
  const { reportType, records, detailedRecords } = params;

  const pw = 215.9;
  const ph = 279.4;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  let currentY = drawMembrete(doc, pw);
  currentY = drawTitleBlock(doc, currentY, pw, params);
  currentY = drawFilterMetadata(doc, currentY, pw, params);
  currentY = drawKPICards(doc, currentY, pw, records);

  if (reportType === 'resumido') {
    currentY = drawSummaryTable(doc, currentY, pw, records);
  } else {
    currentY = drawDetailedSection(doc, currentY, pw, detailedRecords);
  }

  drawFooter(doc, 1, 1, pw, ph);

  doc.save(`Reporte_Balance_BANDES_${params.reportId.replace('#', '')}.pdf`);
}
