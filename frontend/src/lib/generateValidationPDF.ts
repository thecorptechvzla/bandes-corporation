import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Bar } from '@/types/api';
import { formatLey, formatNumber } from '@/lib/format';

export interface ValidationPackingData {
  id: string;
  packingNumber?: number | null;
  fileName?: string | null;
  createdAt: string;
  client?: { id?: string; name?: string } | null;
  bars?: Bar[];
}

const GREEN: [number, number, number] = [19, 145, 105];
const GREEN_LIGHT: [number, number, number] = [234, 244, 240];
const GREEN_BORDER: [number, number, number] = [194, 229, 217];
const GRAY: [number, number, number] = [102, 102, 102];
const GRAY_DARK: [number, number, number] = [68, 68, 68];
const WHITE: [number, number, number] = [255, 255, 255];
const ROW_ALT: [number, number, number] = [251, 253, 252];
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

function drawTitleBlock(doc: jsPDF, y: number, pw: number) {
  const blockH = 14;

  doc.setFillColor(...GREEN);
  doc.roundedRect(10, y, pw - 20, blockH, 1, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...WHITE);
  doc.text('REPORTE DE VALIDACI\u00d3N DE PACKING', 15, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(220, 240, 232);
  doc.text('Comparativa entre valores seg\u00fan packing (SP) y valores f\u00edsicos validados', 15, y + 11.5);

  return y + blockH + 4;
}

function drawMetadata(doc: jsPDF, y: number, pw: number, packing: ValidationPackingData) {
  const boxH = 16;

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.3);
  doc.roundedRect(10, y, pw - 20, boxH, 1, 1, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('N\u00b0 Packing:', 13, y + 5.5);
  doc.text('Cliente:', 13, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(`#${packing.packingNumber ?? '\u2014'}`, 32, y + 5.5);
  doc.text(packing.client?.name ?? '\u2014', 32, y + 12);

  doc.setDrawColor(...BORDER_LIGHT);
  doc.setLineWidth(0.2);
  doc.line(pw / 2, y + 2, pw / 2, y + boxH - 2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...GREEN);
  doc.text('Archivo:', pw / 2 + 4, y + 5.5);
  doc.text('Fecha:', pw / 2 + 4, y + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY_DARK);
  doc.text(packing.fileName ?? '\u2014', pw / 2 + 18, y + 5.5);
  doc.text(new Date(packing.createdAt).toLocaleString('es-ES', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  }), pw / 2 + 18, y + 12);

  return y + boxH + 4;
}

function estadoFor(bar: Bar): string {
  if (bar.status === 'POR_VALIDAR') return 'POR VALIDAR';
  if (bar.status === 'EXITED') return 'EGRESADA';
  return 'VALIDADA';
}

function spWeightFor(bar: Bar): number | null {
  if (bar.spGrossWeight != null) return Number(bar.spGrossWeight);
  if (bar.status === 'POR_VALIDAR') return Number(bar.grossWeight);
  return null;
}

function spPurityFor(bar: Bar): number | null {
  if (bar.spPurity != null) return Number(bar.spPurity);
  if (bar.status === 'POR_VALIDAR') return Number(bar.purity);
  return null;
}

function fmtWeight(v: number | null | undefined): string {
  return v != null ? formatNumber(Number(v), 2) : '-';
}

function fmtdiff(v: number | null | undefined): string {
  return v != null ? `${v > 0 ? '+' : ''}${formatNumber(Number(v), 2)}` : '-';
}

function drawSummary(doc: jsPDF, y: number, pw: number, bars: Bar[]) {
  const validated = bars.filter((b) => b.status !== 'POR_VALIDAR').length;
  const pending = bars.length - validated;

  const blockH = 9;
  doc.setFillColor(...GREEN);
  doc.roundedRect(10, y, pw - 20, blockH, 1, 1, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(...WHITE);
  doc.text(`RESUMEN DE VALIDACI\u00d3N \u2014 ${bars.length} BARRAS`, 14, y + 5.8);
  y += blockH;

  const body = [
    ['BARRAS VALIDADAS', String(validated)],
    ['BARRAS POR VALIDAR', String(pending)],
    ['TOTAL BARRAS', String(bars.length)],
  ];

  autoTable(doc, {
    startY: y,
    head: [['Concepto', 'Cantidad']],
    body,
    theme: 'grid',
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 7,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5,
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
      0: { cellWidth: 80, halign: 'left' },
      1: { halign: 'center' },
    },
    margin: { left: 10, right: 10 },
    didParseCell: (data) => {
      if (data.section === 'body') {
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.textColor = GREEN;
        data.cell.styles.fillColor = GREEN_LIGHT;
      }
    },
  });
}

export function generateValidationPDF(packing: ValidationPackingData) {
  const pw = 215.9;
  const ph = 279.4;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'letter',
  });

  const bars = packing.bars ?? [];

  const bodyRows = bars.map((bar) => {
    const spW = spWeightFor(bar);
    const spP = spPurityFor(bar);
    const isPorValidar = bar.status === 'POR_VALIDAR';
    const valW = isPorValidar ? null : Number(bar.grossWeight);
    const valP = isPorValidar ? null : Number(bar.purity);

    let difW: number | null = null;
    let difP: number | null = null;
    if (!isPorValidar && spW != null && bar.spGrossWeight != null) {
      difW = Math.round((valW! - spW) * 100) / 100;
    }
    if (!isPorValidar && spP != null && bar.spPurity != null) {
      difP = Math.round((valP! - spP) * 100) / 100;
    }

    return [
      bar.barNumber,
      fmtWeight(spW),
      spP != null ? formatLey(spP) : '-',
      fmtWeight(valW),
      valP != null ? formatLey(valP) : '-',
      fmtdiff(difW),
      fmtdiff(difP),
      estadoFor(bar),
    ];
  });

  let currentY = drawMembrete(doc, pw);
  currentY = drawTitleBlock(doc, currentY, pw);
  currentY = drawMetadata(doc, currentY, pw, packing);

  autoTable(doc, {
    startY: currentY,
    head: [['C\u00d3DIGO', 'BRUTO SP', 'LEY SP', 'BRUTO VAL.', 'LEY VAL.', 'DIF. BRUTO', 'DIF. LEY', 'ESTADO']],
    body: bodyRows,
    theme: 'grid',
    headStyles: {
      fillColor: GREEN,
      textColor: WHITE,
      fontStyle: 'bold',
      fontSize: 6.5,
      halign: 'center',
      valign: 'middle',
      cellPadding: 2.5,
      lineColor: GREEN,
      lineWidth: 0.3,
    },
    bodyStyles: {
      fontSize: 6.5,
      textColor: [51, 51, 51],
      cellPadding: 2.2,
      lineColor: [230, 230, 230],
      lineWidth: 0.2,
    },
    columnStyles: {
      0: { cellWidth: 30, halign: 'center' },
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
      if (data.section === 'body') {
        if (data.column.index === 0) {
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.textColor = GREEN;
        }
        const estado = data.row.raw[7] as string;
        if (estado === 'POR VALIDAR') {
          data.cell.styles.textColor = [153, 111, 0];
        }
        if ((estado === 'VALIDADA' || estado === 'EGRESADA') && data.column.index >= 5) {
          const dif = data.row.raw[data.column.index] as string;
          if (dif !== '-') {
            data.cell.styles.textColor = GREEN;
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    },
  });

  currentY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;

  if (currentY + 30 > ph - 20) {
    doc.addPage();
    currentY = 15;
  }

  drawSummary(doc, currentY, pw, bars);

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    const yLine = ph - 14;
    const yText = ph - 9;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(10, yLine, pw - 10, yLine);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(136, 136, 136);
    doc.text('Documento generado automaticamente por el Sistema de Custodia y Control - BANDES.', 10, yText);
    doc.text(`Pagina ${i} de ${totalPages}`, pw - 10, yText, { align: 'right' });
  }

  doc.save(`Reporte_Validacion_Packing_#${packing.packingNumber ?? packing.id.slice(0, 8)}.pdf`);
}