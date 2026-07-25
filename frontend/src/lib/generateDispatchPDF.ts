import { jsPDF } from 'jspdf';
import { formatWeight } from '@/lib/format';

interface DispatchResult {
  reference: string;
  destination: string;
  totalWeight: number;
  lotCount: number;
  providerCount: number;
  lots: { name: string; weight: number; provider: string }[];
  providers: { name: string; lots: number; weight: number }[];
  createdAt: string;
}

export function generateDispatchPDF(data: DispatchResult, destinationClient?: { rif?: string; contactInfo?: string }) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210, m = 15, cw = pw - m * 2;
  let y = 15;

  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, pw, 48, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 46, pw, 2, 'F');

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('BANDES', m, y + 10);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Trazabilidad de Oro Fino', m, y + 18);

  doc.setTextColor(212, 175, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE DESPACHO GLOBAL', pw - m, y + 10, { align: 'right' });
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
  doc.text(`Lotes: ${data.lotCount}`, m, y); y += 6;
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
    doc.text(`${pv.name} — ${pv.lots} lote(s) — ${formatWeight(Number(pv.weight))}`, m + 2, y + 1);
    y += 10;

    const providerLots = data.lots.filter(l => l.provider === pv.name);
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
  doc.text(`LOTES: ${data.lotCount}`, m, y); y += 7;
  doc.text(`PROVEEDORES: ${data.providerCount}`, m, y); y += 20;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, y, pw - m, y); y += 8;
  doc.setTextColor(140, 140, 140);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('_________________________', m, y); y += 5;
  doc.text('Peso Fino', m, y);
  doc.text('_________________________', pw - m - 40, y - 5);
  doc.text('R', pw - m - 40, y);

  doc.save(`Comprobante_${data.reference.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`);
}
