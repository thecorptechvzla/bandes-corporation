import { jsPDF } from 'jspdf';
import { formatWeight, fetchLogoAsBase64 } from '@/lib/format';

interface BarItem {
  barNumber: string;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  provider: string;
}

interface LotItem {
  name: string;
  weight: number;
  provider: string;
}

export interface DispatchResult {
  reference: string;
  destination: string;
  totalWeight: number;
  lotCount?: number;
  barCount?: number;
  providerCount: number;
  lots?: LotItem[];
  bars?: BarItem[];
  providers: { name: string; count: number; weight: number }[];
  createdAt: string;
  type: 'lots' | 'bars';
}

export async function generateDispatchPDF(data: DispatchResult, destinationClient?: { rif?: string; contactInfo?: string }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210, m = 15, cw = pw - m * 2;
  let y = 15;

  const logoBase64 = await fetchLogoAsBase64();

  const isBarMode = data.type === 'bars';
  const itemLabel = isBarMode ? 'Barras' : 'Lotes';
  const itemCount = isBarMode ? data.barCount ?? 0 : data.lotCount ?? 0;

  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, pw, 48, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 46, pw, 2, 'F');

  doc.addImage(logoBase64, 'PNG', m, 6, 40, 19);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Trazabilidad de Oro Fino', m, y + 18);

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(isBarMode ? 'COMPROBANTE DE DESPACHO (BARRAS)' : 'COMPROBANTE DE DESPACHO GLOBAL', pw - m, y + 10, { align: 'right' });
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(7);
  doc.text(`Ref: ${data.reference}`, pw - m, y + 18, { align: 'right' });

  y = 58;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.4);
  doc.line(m, y, pw - m, y);
  y += 10;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL DESTINATARIO', m, y); y += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text(`Nombre/Razón Social: ${data.destination}`, m, y); y += 5;
  if (destinationClient?.rif) { doc.text(`RIF: ${destinationClient.rif}`, m, y); y += 5; }
  if (destinationClient?.contactInfo) { doc.text(`Contacto: ${destinationClient.contactInfo}`, m, y); y += 5; }
  y += 2;
  doc.text(`Proveedores: ${data.providerCount}`, m, y); y += 6;
  doc.text(`${itemLabel}: ${itemCount}`, m, y); y += 6;
  doc.text(`Peso Total: ${formatWeight(Number(data.totalWeight))}`, m, y); y += 6;
  doc.text(`Fecha: ${new Date(data.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, m, y);
  y += 10;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, y, pw - m, y);
  y += 8;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DETALLE POR PROVEEDOR', m, y); y += 8;

  data.providers.forEach((pv) => {
    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(7, 11, 20);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(212, 175, 55);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text(`${pv.name} — ${pv.count} ${isBarMode ? 'barra(s)' : 'lote(s)'} — ${formatWeight(Number(pv.weight))}`, m + 2, y + 1);
    y += 10;

    if (isBarMode) {
      const providerBars = (data.bars || []).filter(b => b.provider === pv.name);
      if (providerBars.length > 0) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFillColor(212, 175, 55);
        doc.rect(m, y - 4, cw, 7, 'F');
        doc.setTextColor(7, 11, 20);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const barColsW = [35, 40, 30, cw - 105];
        doc.text('CÓDIGO', m + 3, y + 1);
        doc.text('PESO BRUTO (g)', m + 3 + barColsW[0], y + 1);
        doc.text('LEY AU (‰)', m + 3 + barColsW[0] + barColsW[1], y + 1);
        doc.text('FA (g)', m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y + 1);
        y += 7;

        providerBars.forEach((bar, idx) => {
          if (y > 260) { doc.addPage(); y = 20; }
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(m, y - 4, cw, 7, 'F');
          }
          doc.setTextColor(80, 80, 80);
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(bar.barNumber, m + 3, y + 1);
          doc.text(formatWeight(bar.grossWeight), m + 3 + barColsW[0], y + 1);
          doc.text(String(bar.purity), m + 3 + barColsW[0] + barColsW[1], y + 1);
          doc.text(formatWeight(bar.fineWeight), m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y + 1);
          y += 7;
        });
      }
    } else {
      const providerLots = (data.lots || []).filter(l => l.provider === pv.name);
      providerLots.forEach((lot, idx) => {
        if (y > 260) { doc.addPage(); y = 20; }
        if (idx % 2 === 0) {
          doc.setFillColor(248, 248, 248);
          doc.rect(m, y - 4, cw, 7, 'F');
        }
        doc.setTextColor(80, 80, 80);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(lot.name, m + 4, y + 1);
        doc.text(formatWeight(Number(lot.weight)), pw - m - 2, y + 1, { align: 'right' });
        y += 7;
      });
    }
    y += 4;
  });

  y += 4;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(m, y, pw - m, y); y += 8;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`Peso Fino: ${formatWeight(Number(data.totalWeight))}`, m, y); y += 7;
  doc.text(`${itemLabel.toUpperCase()}: ${itemCount}`, m, y); y += 7;
  doc.text(`PROVEEDORES: ${data.providerCount}`, m, y); y += 20;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, y, pw - m, y); y += 8;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('_________________________', m, y); y += 5;
  doc.text('Peso Fino', m, y);
  doc.text('_________________________', pw - m - 40, y - 5);
  doc.text('R', pw - m - 40, y);

  doc.save(`Comprobante_${data.reference.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
}
