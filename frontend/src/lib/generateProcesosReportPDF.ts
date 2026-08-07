import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { ProcesosReportData, ProcesoReportType, ProcesoDetailedRecord } from '@/components/reportes/procesos/types';
import { formatNumber } from '@/lib/format';

interface GenerateProcesosReportPDFParams {
  data: ProcesosReportData;
  reportId: string;
  generatedAt: string;
  dateFrom: string;
  dateTo: string;
  proveedorName: string;
  reportType: ProcesoReportType;
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

function drawTitleBlock(doc: jsPDF, y: number, pw: number, reportType: ProcesoReportType) {
  const blockH = 14;

  doc.setFillColor(...TITLE_BG);
  doc.roundedRect(10, y, pw - 20, blockH, 0, 0, 'F');

  doc.setFillColor(...GREEN);
  doc.rect(10, y, 2, blockH, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...GREEN);
  doc.text('REPORTE DE PROCESOS DE FUNDICION Y REFINACION', 16, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  const subtitle = reportType === 'detallado'
    ? 'Desglose por barra individual de cada proceso'
    : 'Resumen consolidado de procesos realizados';
  doc.text(subtitle, 16, y + 11.5);

  return y + blockH + 4;
}

function drawFilterMetadata(doc: jsPDF, y: number, pw: number, params: GenerateProcesosReportPDFParams) {
  const boxH = 14;

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('Rango de Fechas:', 13, y + 5);
  doc.text('Proveedor:', 13, y + 10);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`${params.dateFrom} al ${params.dateTo}`, 42, y + 5);
  doc.text(params.proveedorName, 42, y + 10);

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

function drawKPICards(doc: jsPDF, y: number, pw: number, summary: ProcesosReportData['summary']) {
  const gap = 4;
  const cardW = (pw - 20 - gap * 2) / 3;
  const cardH = 18;

  const cards = [
    { label: 'TOTAL PROCESOS', value: String(summary.totalProcesos), sub: 'En el periodo' },
    { label: 'TOTAL BARRAS', value: String(summary.totalBarras), sub: 'Ingresadas a proceso' },
    { label: 'PESO RESULTANTE', value: `${formatNumber(summary.pesoResultanteTotal)} g`, sub: 'Total obtenido' },
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
    doc.setFontSize(11);
    doc.setTextColor(17, 17, 17);
    doc.text(card.value, x + cardW / 2, y + 11, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(card.sub, x + cardW / 2, y + 15.5, { align: 'center' });
  });

  return y + cardH + 4;
}

function drawSummaryTable(doc: jsPDF, y: number, pw: number, data: ProcesosReportData) {
  const { records, summary } = data;
  const totPesoInicial = records.reduce((a, r) => a + r.pesoInicial, 0);

  const bodyRows = records.map((r) => [
    `${r.id}\n${r.tipo}`,
    r.proveedores.join('\n'),
    r.esMixto ? 'SI' : 'NO',
    String(r.barras),
    `${formatNumber(r.pesoInicial)}`,
    `${formatNumber(r.pesoObtenido)}`,
    r.estatus,
  ]);

  bodyRows.push([
    `TOTALES (${summary.totalProcesos} Procesos)`,
    '\u2014',
    '\u2014',
    `${summary.totalBarras} Barras`,
    `${formatNumber(totPesoInicial)} g`,
    `${formatNumber(summary.pesoResultanteTotal)} g`,
    `Rendimiento: ${formatNumber(summary.rendimientoProm, 1)}%`,
  ]);

  autoTable(doc, {
    startY: y,
    head: [['N\u00b0 Proceso / Tipo', 'Proveedor(es)', 'Mixto', 'Cant. Barras', 'Peso Bruto (g)', 'Peso Bruto de Salida (g)', 'Estatus']],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 6.5,
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
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 18, halign: 'center' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { cellWidth: 22, halign: 'center' },
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
      if (data.section === 'body' && data.column.index === 6) {
        const raw = String(data.cell.raw);
        if (raw === 'Completado') {
          data.cell.styles.textColor = [16, 185, 129];
          data.cell.styles.fontStyle = 'bold';
        } else if (raw === 'Activo') {
          data.cell.styles.textColor = [14, 165, 233];
          data.cell.styles.fontStyle = 'bold';
        } else if (raw === 'Cancelado') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        }
      }
      if (data.section === 'body' && data.column.index === 2) {
        const raw = String(data.cell.raw);
        if (raw === 'SI') {
          data.cell.styles.textColor = [56, 189, 248];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = GRAY;
        }
      }
    },
  });

  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 4;
}

function drawDetailedSection(doc: jsPDF, startY: number, pw: number, detailed: ProcesoDetailedRecord[], summary: ProcesosReportData['summary']) {
  let y = startY;

  detailed.forEach((proceso) => {
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
    doc.text(proceso.id, 14, y + 5.5);

    if (proceso.esMixto) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(56, 189, 248);
      doc.text('MIXTO', 14 + doc.getTextWidth(proceso.id) + 4, y + 5.5);
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text(`${proceso.tipo} | ${proceso.fecha} | ${proceso.estatus} | ${proceso.barras} Barras`, 14, y + 11);
    y += bannerH + 2;

    const bodyRows = proceso.bars.map((bar) => [
      `${bar.lote}\n${bar.barId}`,
      bar.packingOrigen,
      bar.proveedorOrigen,
      `${formatNumber(bar.pesoInicial)}`,
      bar.estatusBarra,
      `${formatNumber(bar.pesoResultante)}`,
    ]);

    const totPesoInicial = proceso.bars.reduce((a, b) => a + b.pesoInicial, 0);
    const totPesoResultante = proceso.bars.reduce((a, b) => a + b.pesoResultante, 0);
    bodyRows.push([
      `Subtotal \u2014 ${proceso.barras} Barras`,
      '',
      '',
      `${formatNumber(totPesoInicial)} g`,
      '',
      `${formatNumber(totPesoResultante)} g`,
    ]);

    autoTable(doc, {
      startY: y,
      head: [['N\u00b0 Lote / ID Barra', 'Packing Origen', 'Proveedor Origen', 'Peso Bruto de Entrada (g)', 'Estatus Barra', 'Peso Bruto de Salida (g)']],
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
        fontSize: 6,
        textColor: [51, 51, 51],
        cellPadding: 1.8,
        lineColor: [240, 240, 240],
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 28, halign: 'left' },
        1: { cellWidth: 24, halign: 'left' },
        2: { cellWidth: 30, halign: 'left' },
        3: { halign: 'right' },
        4: { cellWidth: 22, halign: 'center' },
        5: { halign: 'right' },
      },
      alternateRowStyles: {
        fillColor: ROW_ALT,
      },
      margin: { left: 10, right: 10 },
      didParseCell: (data) => {
        if (data.section === 'body' && data.row.index === proceso.bars.length) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = GREEN;
          data.cell.styles.fillColor = GREEN_LIGHT;
          data.cell.styles.lineColor = GREEN;
          data.cell.styles.lineWidth = 0.3;
        }
        if (data.section === 'body' && data.column.index === 4) {
          const raw = String(data.cell.raw);
          if (raw === 'Procesada') {
            data.cell.styles.textColor = [16, 185, 129];
            data.cell.styles.fontStyle = 'bold';
          } else if (raw === 'Fundida') {
            data.cell.styles.textColor = [251, 191, 36];
            data.cell.styles.fontStyle = 'bold';
          } else {
            data.cell.styles.textColor = [14, 165, 233];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      },
    });

    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  });

  return y;
}

function drawTotalesGenerales(doc: jsPDF, y: number, pw: number, summary: ProcesosReportData['summary']) {
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
  doc.text(`TOTALES GENERALES \u2014 ${summary.totalProcesos} Procesos`, 14, y + 5.5);
  y += 8;

  doc.setDrawColor(...GREEN_BORDER);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  const colW = (pw - 20) / 3;
  const cols = [
    { label: 'Total Barras', value: String(summary.totalBarras) },
    { label: 'Peso Bruto Resultante Total', value: `${formatNumber(summary.pesoResultanteTotal)} g` },
    { label: 'Rendimiento Promedio', value: `${formatNumber(summary.rendimientoProm, 1)}%` },
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
  doc.text('Documento generado automáticamente por el Sistema de Custodia y Control - BANDES.', 10, yText);
  doc.text(`Página ${pageNum} de ${totalPages}`, pw - 10, yText, { align: 'right' });
}

function addFooters(doc: jsPDF, pw: number, ph: number) {
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(doc, i, totalPages, pw, ph);
  }
}

export function generateProcesosReportPDF(params: GenerateProcesosReportPDFParams) {
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
    currentY = drawDetailedSection(doc, currentY, pw, data.detailed ?? [], summary);
    currentY = drawTotalesGenerales(doc, currentY, pw, summary);
  }

  addFooters(doc, pw, ph);

  doc.save(`Reporte_Procesos_BANDES_${params.reportId.replace('#', '')}.pdf`);
}
