import { jsPDF } from 'jspdf';
import { formatWeight, fetchLogoAsBase64 } from '@/lib/format';
import { computeComposition } from '@/lib/composition';
import type { MaterialExit } from '@/types/api';

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
  isMixed?: boolean;
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
  type: 'lots' | 'bars' | 'mixed';
}

export type CopyType = 'CLIENTE' | 'EMPRESA';

export function convertExitToDispatchResult(exit: MaterialExit): DispatchResult {
  const hasLots = (exit.exitDetails?.length ?? 0) > 0;
  const hasBars = (exit.bars?.length ?? 0) > 0;

  const providerMap = new Map<string, { count: number; weight: number }>();

  let lots: LotItem[] = [];
  let bars: BarItem[] = [];

  if (hasLots) {
    lots = (exit.exitDetails || []).flatMap<LotItem>(d => {
      const composition = computeComposition(
        (d.bars || []).map(b => ({
          clientId: b.clientId || '',
          clientName: b.client?.name || 'DESCONOCIDO',
          fineWeight: Number(b.fineWeight || 0),
        })),
      );
      if (composition.length > 1) {
        return composition.map(entry => ({
          name: d.lot?.name || '—',
          weight: entry.weight,
          provider: entry.clientName,
          isMixed: true,
        } as LotItem));
      }
      return [{
        name: d.lot?.name || '—',
        weight: Number(d.weightAported),
        provider: d.lot?.process?.client?.name || 'DESCONOCIDO',
        isMixed: false,
      } as LotItem];
    });
    lots.forEach(l => {
      const prev = providerMap.get(l.provider) || { count: 0, weight: 0 };
      providerMap.set(l.provider, { count: prev.count + 1, weight: prev.weight + l.weight });
    });
  }

  if (hasBars) {
    bars = (exit.bars || []).map(b => ({
      barNumber: b.barNumber,
      grossWeight: Number(b.grossWeight),
      purity: Number(b.purity),
      fineWeight: Number(b.fineWeight),
      provider: b.client?.name || 'DESCONOCIDO',
    }));
    bars.forEach(b => {
      const prev = providerMap.get(b.provider) || { count: 0, weight: 0 };
      providerMap.set(b.provider, { count: prev.count + 1, weight: prev.weight + b.fineWeight });
    });
  }

  const type = hasLots && hasBars ? 'mixed' : hasBars ? 'bars' : 'lots';

  return {
    reference: `DESP-${exit.id.slice(0, 8).toUpperCase()}`,
    destination: exit.destination,
    totalWeight: Number(exit.totalWeight),
    lotCount: lots.length || undefined,
    barCount: bars.length || undefined,
    providerCount: providerMap.size,
    lots: lots.length ? lots : undefined,
    bars: bars.length ? bars : undefined,
    providers: Array.from(providerMap.entries()).map(([name, v]) => ({ name, count: v.count, weight: v.weight })),
    createdAt: exit.createdAt,
    type,
  };
}

export async function generateDispatchPDF(
  data: DispatchResult,
  destinationClient?: { rif?: string; contactInfo?: string },
  copyType: CopyType = 'CLIENTE',
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210, m = 15, cw = pw - m * 2;
  let y = 15;

  const logoBase64 = await fetchLogoAsBase64();

  const isMixed = data.type === 'mixed';
  const isBarMode = data.type === 'bars';
  const isLotMode = data.type === 'lots';
  const itemCount = (data.lotCount ?? 0) + (data.barCount ?? 0);
  const isEmpresa = copyType === 'EMPRESA';
  const hasMixedLot = (data.lots || []).some(l => l.isMixed);

  doc.setFillColor(7, 11, 20);
  doc.rect(0, 0, pw, 48, 'F');
  doc.setFillColor(212, 175, 55);
  doc.rect(0, 46, pw, 2, 'F');

  doc.addImage(logoBase64, 'PNG', m, 6, 40, 19);
  doc.setTextColor(200, 200, 200);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Sistema de Trazabilidad de Oro Fino', m, y + 18);

  const titleSuffix = isMixed ? ' MIXTO' : isBarMode ? ' (BARRAS)' : ' GLOBAL';
  const copyLabel = isEmpresa ? 'EMPRESA' : 'CLIENTE';
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`COMPROBANTE DE DESPACHO${titleSuffix} — ${copyLabel}`, pw - m, y + 10, { align: 'right' });
  doc.setTextColor(160, 160, 160);
  doc.setFontSize(7);
  doc.text(`Ref: ${data.reference}`, pw - m, y + 18, { align: 'right' });

  if (isEmpresa) {
    doc.setFontSize(48);
    doc.setTextColor(220, 220, 220);
    doc.setFont('helvetica', 'bold');
    doc.text('USO INTERNO', pw / 2, 160, { align: 'center', angle: 45 });
  }

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
  if (isEmpresa) { doc.text(`Proveedores: ${data.providerCount}`, m, y); y += 6; }

  if (isMixed) {
    doc.text(`Lotes: ${data.lotCount ?? 0} | Barras: ${data.barCount ?? 0}`, m, y); y += 6;
  } else {
    const itemLabel = isBarMode ? 'Barras' : 'Lotes';
    doc.text(`${itemLabel}: ${itemCount}`, m, y); y += 6;
  }
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

  if (isEmpresa) {
    doc.text('DETALLE POR PROVEEDOR', m, y); y += 8;

    if (hasMixedLot) {
      doc.setTextColor(168, 85, 247);
      doc.setFontSize(7);
      doc.text('Nota: los lotes marcados con ◈ son MIXTOS y consolidan material de múltiples proveedores.', m, y); y += 6;
      doc.setTextColor(40, 40, 40);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
    }

    data.providers.forEach((pv) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(7, 11, 20);
      doc.rect(m, y - 4, cw, 7, 'F');
      doc.setTextColor(212, 175, 55);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${pv.name} — ${pv.count} ítem(s) — ${formatWeight(Number(pv.weight))}`, m + 2, y + 1);
      y += 10;

      const providerLots = (data.lots || []).filter(l => l.provider === pv.name);
      const providerBars = (data.bars || []).filter(b => b.provider === pv.name);

      if (providerLots.length > 0) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFillColor(245, 158, 11);
        doc.rect(m, y - 4, cw, 7, 'F');
        doc.setTextColor(7, 11, 20);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        doc.text('TIPO', m + 3, y + 1);
        doc.text('CÓDIGO', m + 20, y + 1);
        doc.text('PESO FINO (g)', pw - m - 2, y + 1, { align: 'right' });
        y += 7;

        providerLots.forEach((lot, idx) => {
          if (y > 260) { doc.addPage(); y = 20; }
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(m, y - 4, cw, 7, 'F');
          }
          if (lot.isMixed) {
            doc.setTextColor(168, 85, 247);
          } else {
            doc.setTextColor(245, 158, 11);
          }
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.text(lot.isMixed ? 'MIXTA' : 'REFUNDIDA', m + 3, y + 1);
          doc.setTextColor(80, 80, 80);
          doc.text(`${lot.name}${lot.isMixed ? '  ◈' : ''}`, m + 20, y + 1);
          doc.text(formatWeight(Number(lot.weight)), pw - m - 2, y + 1, { align: 'right' });
          y += 7;
        });
      }

      if (providerBars.length > 0) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFillColor(20, 184, 166);
        doc.rect(m, y - 4, cw, 7, 'F');
        doc.setTextColor(7, 11, 20);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const barColsW = [20, 30, 40, 30, cw - 120];
        doc.text('TIPO', m + 3, y + 1);
        doc.text('CÓDIGO', m + 3 + barColsW[0], y + 1);
        doc.text('PESO BRUTO (g)', m + 3 + barColsW[0] + barColsW[1], y + 1);
        doc.text('LEY AU (‰)', m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y + 1);
        doc.text('PESO FINO (g)', m + 3 + barColsW[0] + barColsW[1] + barColsW[2] + barColsW[3], y + 1);
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
          doc.setTextColor(20, 184, 166);
          doc.text('SIN REF.', m + 3, y + 1);
          doc.setTextColor(80, 80, 80);
          doc.text(bar.barNumber, m + 3 + barColsW[0], y + 1);
          doc.text(formatWeight(bar.grossWeight), m + 3 + barColsW[0] + barColsW[1], y + 1);
          doc.text(String(bar.purity), m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y + 1);
          doc.text(formatWeight(bar.fineWeight), m + 3 + barColsW[0] + barColsW[1] + barColsW[2] + barColsW[3], y + 1);
          y += 7;
        });
      }

      y += 4;
    });
  } else {
    doc.text('RESUMEN DEL DESPACHO', m, y); y += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    if (isMixed) {
      doc.text(`Lotes: ${data.lotCount ?? 0} | Barras: ${data.barCount ?? 0} | Total: ${itemCount}`, m, y); y += 5;
    } else {
      const itemLabel = isBarMode ? 'barras' : 'lotes';
      doc.text(`Total de ${itemLabel}: ${itemCount}`, m, y); y += 5;
    }
    doc.text(`Peso Bruto Total : ${formatWeight(Number(data.totalWeight))}`, m, y); y += 5;
    if (hasMixedLot) {
      doc.setTextColor(168, 85, 247);
      doc.text('Incluye lote(s) MIXTO(s): material consolidado de varios proveedores.', m, y); y += 5;
      doc.setTextColor(80, 80, 80);
    }
  }

  y += 4;
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.6);
  doc.line(m, y, pw - m, y); y += 8;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`PESO FINO: ${formatWeight(Number(data.totalWeight))}`, m, y); y += 7;
  if (isMixed) {
    doc.text(`LOTES: ${data.lotCount ?? 0}  |  BARRAS: ${data.barCount ?? 0}`, m, y);
  } else {
    const itemLabel = isBarMode ? 'BARRAS' : 'LOTES';
    doc.text(`${itemLabel}: ${itemCount}`, m, y);
  }
  y += 7;
  if (isEmpresa) { doc.text(`PROVEEDORES: ${data.providerCount}`, m, y); }
  y += 20;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, y, pw - m, y); y += 8;
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.text('_________________________', m, y); y += 5;
  doc.text('Peso Fino', m, y);
  doc.text('_________________________', pw - m - 40, y - 5);
  doc.text('R', pw - m - 40, y);

  if (isEmpresa) {
    y += 12;
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.text(`Ref completa: ${data.reference}`, m, y); y += 4;
    doc.text('Elaborado por: Sistema de Trazabilidad Bandes', m, y); y += 4;
    doc.text(`Fecha generación: ${new Date().toLocaleString('es-ES')}`, m, y);
  }

  const safeRef = data.reference.replace(/[/\\?%*:|"<>]/g, '_');
  doc.save(`Despacho_${safeRef}-${copyType}.pdf`);
}
