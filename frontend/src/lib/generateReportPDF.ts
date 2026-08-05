import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { formatWeight, formatNumber, fetchLogoAsBase64 } from '@/lib/format';

interface ClientRow {
  id: string;
  name: string;
  fa: number;
  fe: number;
  r: number;
  entregado: number;
  balance: number;
}

const C = {
  red:       [248, 24, 32] as const,
  darkBg:    [26, 10, 11] as const,
  lightBg:   [254, 242, 242] as const,
  textDark:  [26, 10, 11] as const,
  textMuted: [107, 114, 128] as const,
  gray:      [120, 120, 120] as const,
  lightGray: [200, 200, 200] as const,
  green:     [5, 150, 105] as const,
} as const;

interface ReportData {
  oroRecibido: { fineWeight: number; barCount: number; clientCount: number };
  oroFundido: { totalRecovered: number; lotCount: number; barCount: number; eficiencia: number; totalExpected: number };
  oroEnEspera: { count: number; fineWeight: number; clientCount: number };
  totals: { fa: number; fe: number; r: number; entregado: number; balance: number; puro: number; mixto: number };
  clientRows: ClientRow[];
  filters: {
    dateFrom: string;
    dateTo: string;
    filterClientId: string;
    statusFilter: string;
  };
  clients: Array<{ id: string; name: string }>;
}

export async function generateReportPDF(data: ReportData) {
  const { oroRecibido, oroFundido, oroEnEspera, totals, clientRows, filters, clients } = data;

  const element = document.getElementById('report-content');
  if (!element) return;

  const imgData = await toPng(element, {
    backgroundColor: '#0A0F1A',
    pixelRatio: 3,
    width: element.scrollWidth,
    height: element.scrollHeight,
  });

  const logoBase64 = await fetchLogoAsBase64();

  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = 210;
  const m = 15;
  const cw = pw - m * 2;

  let y = 15;

  // Header bar
  pdf.setFillColor(...C.darkBg);
  pdf.rect(0, 0, pw, 42, 'F');
  pdf.setFillColor(...C.red);
  pdf.rect(0, 40, pw, 2, 'F');

  pdf.addImage(logoBase64, 'PNG', m, 6, 40, 19);
  pdf.setTextColor(200, 200, 200);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Sistema de Trazabilidad de Oro Fino', m, y + 18);

  pdf.setTextColor(...C.red);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('REPORTE DE CONCILIACION', pw - m, y + 10, { align: 'right' });
  pdf.setTextColor(160, 160, 160);
  pdf.setFontSize(7);
  const dateStr = new Date().toLocaleDateString('es-ES', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
  pdf.text(`Generado: ${dateStr}`, pw - m, y + 18, { align: 'right' });

  // KPIs Section
  y = 52;
  pdf.setDrawColor(...C.red);
  pdf.setLineWidth(0.4);
  pdf.line(m, y, pw - m, y);
  y += 10;

  pdf.setTextColor(...C.textDark);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RESUMEN EJECUTIVO', m, y);
  y += 12;

  const kpiW = (cw - 12) / 4;
  const kpis = [
    { label: 'ORO RECIBIDO (Peso Bruto)', value: formatWeight(oroRecibido.fineWeight), sub: `${oroRecibido.barCount} barras` },
    { label: 'ORO FUNDIDO (R)', value: formatWeight(oroFundido.totalRecovered), sub: `${oroFundido.lotCount} lotes` },
    { label: 'ORO EN ESPERA', value: formatWeight(oroEnEspera.fineWeight), sub: `${oroEnEspera.count} barras` },
    { label: 'BALANCE GLOBAL', value: formatWeight(totals.balance), sub: `${formatNumber(oroFundido.eficiencia, 1)}% eficiencia` },
  ];

  kpis.forEach((kpi, idx) => {
    const x = m + idx * (kpiW + 4);
    pdf.setFillColor(...C.lightBg);
    pdf.roundedRect(x, y - 4, kpiW, 28, 2, 2, 'F');
    pdf.setTextColor(...C.textMuted);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.label, x + 3, y + 2);
    pdf.setTextColor(...C.textDark);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(kpi.value, x + 3, y + 14);
    pdf.setTextColor(...C.gray);
    pdf.setFontSize(6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(kpi.sub, x + 3, y + 21);
  });

  y += 36;

  // Filter info
  const { dateFrom, dateTo, filterClientId, statusFilter } = filters;
  if (dateFrom || dateTo || filterClientId || statusFilter !== 'ALL') {
    pdf.setDrawColor(200, 200, 200);
    pdf.setLineWidth(0.2);
    pdf.line(m, y, pw - m, y);
    y += 8;
    pdf.setTextColor(...C.textMuted);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');

    const parts: string[] = [];
    if (dateFrom) parts.push(`Desde: ${dateFrom}`);
    if (dateTo) parts.push(`Hasta: ${dateTo}`);
    if (filterClientId) {
      const c = clients.find(x => x.id === filterClientId);
      if (c) parts.push(`Cliente: ${c.name}`);
    }
    if (statusFilter !== 'ALL') {
      const labels: Record<string, string> = { IN_STOCK: 'VALIDADO', COMPLETADO: 'VALIDADO', EXITED: 'EGRESADO' };
      parts.push(`Estado: ${labels[statusFilter] || statusFilter}`);
    }
    if (parts.length > 0) {
      pdf.text(`Filtros aplicados: ${parts.join(' | ')}`, m, y);
      y += 10;
    }
  }

  // Divider
  y += 4;
  pdf.setDrawColor(...C.red);
  pdf.setLineWidth(0.4);
  pdf.line(m, y, pw - m, y);
  y += 10;

  // Pure vs Mixed summary
  pdf.setTextColor(...C.textMuted);
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'bold');
  pdf.text(`FUNDIDO PURO (1 proveedor): ${formatWeight(totals.puro)}   |   FUNDIDO MIXTO (2+ proveedores): ${formatWeight(totals.mixto)}`, m, y);
  y += 10;

  // Balance table header
  pdf.setTextColor(...C.textDark);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BALANCE POR CLIENTE', m, y);
  y += 8;

  // Table header row
  pdf.setFillColor(...C.darkBg);
  pdf.rect(m, y - 4, cw, 7, 'F');
  pdf.setTextColor(...C.red);
  pdf.setFontSize(6);
  pdf.setFont('helvetica', 'bold');

  const cols = [
    { label: 'CLIENTE', x: m + 2, align: 'left' as const },
    { label: 'PESO BRUTO (g)', x: m + 52, align: 'right' as const },
    { label: 'R (g)', x: m + 92, align: 'right' as const },
    { label: 'ENTREGADO (g)', x: m + 112, align: 'right' as const },
    { label: 'BALANCE (g)', x: m + 145, align: 'right' as const },
  ];

  cols.forEach(col => {
    pdf.text(col.label, col.x, y + 0, { align: col.align });
  });
  y += 11;

  // Table rows
  const rowsToShow = clientRows.length > 0 ? clientRows : [{ id: '', name: 'Sin datos', fa: 0, fe: 0, r: 0, entregado: 0, balance: 0 }];
  rowsToShow.forEach((row, idx) => {
    if (y > 260) {
      pdf.addPage();
      y = 20;
      pdf.setFillColor(...C.darkBg);
      pdf.rect(m, y - 4, cw, 7, 'F');
      pdf.setTextColor(...C.red);
      pdf.setFontSize(6);
      pdf.setFont('helvetica', 'bold');
      cols.forEach(col => pdf.text(col.label, col.x, y + 0, { align: col.align }));
      y += 11;
    }

    if (idx % 2 === 0) {
      pdf.setFillColor(...C.lightBg);
      pdf.rect(m, y - 4, cw, 7, 'F');
    }
    pdf.setTextColor(...C.textDark);
    pdf.setFontSize(7);
    pdf.setFont('helvetica', 'normal');

    const isPos = row.balance >= 0;
    const rowData = [
      { text: row.name, x: m + 2, align: 'left' as const, color: '#1A0A0B' },
      { text: formatWeight(row.fa), x: m + 52, align: 'right' as const, color: '#1A0A0B' },
      { text: formatWeight(row.r), x: m + 92, align: 'right' as const, color: '#1A0A0B' },
      { text: formatWeight(row.entregado), x: m + 112, align: 'right' as const, color: '#1A0A0B' },
      { text: `${isPos ? '+' : ''}${formatWeight(Math.abs(row.balance))}`, x: m + 145, align: 'right' as const, color: isPos ? '#059669' : '#F81820' },
    ];

    rowData.forEach(cell => {
      if (cell.color) pdf.setTextColor(cell.color);
      pdf.text(cell.text, cell.x, y + 1, { align: cell.align });
    });
    y += 7;
  });

  // Totals row
  y += 4;
  pdf.setDrawColor(...C.red);
  pdf.setLineWidth(0.6);
  pdf.line(m, y, pw - m, y);
  y += 8;
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(...C.textDark);
  const totalIsPos = totals.balance >= 0;
  const totalRow = [
    { text: 'TOTALES', x: m + 2, align: 'left' as const },
    { text: formatWeight(totals.fa), x: m + 52, align: 'right' as const },
    { text: formatWeight(totals.r), x: m + 92, align: 'right' as const },
    { text: formatWeight(totals.entregado), x: m + 112, align: 'right' as const },
    { text: `${totalIsPos ? '+' : ''}${formatWeight(Math.abs(totals.balance))}`, x: m + 145, align: 'right' as const },
  ];
  totalRow.forEach(cell => pdf.text(cell.text, cell.x, y, { align: cell.align }));

  // Signature space
  y += 20;
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.2);
  pdf.line(m, y, pw - m, y);
  y += 8;
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(...C.gray);
  pdf.text('_________________________', m, y);
  pdf.text('Responsable de Boveda', m, y + 5);
  pdf.text('_________________________', pw - m - 45, y);
  pdf.text('Gerencia', pw - m - 45, y + 5);

  pdf.save('Reporte_Conciliacion_Bandes.pdf');
}
