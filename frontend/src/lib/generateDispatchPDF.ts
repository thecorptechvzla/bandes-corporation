import { jsPDF } from 'jspdf';
import { formatWeight } from '@/lib/format';
import { computeComposition } from '@/lib/composition';
import type { MaterialExit } from '@/types/api';

interface BarItem {
  barNumber: string;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  provider: string;
  validatedWeight?: number;
}

interface LotItem {
  name: string;
  weight: number;
  provider: string;
  isMixed?: boolean;
  grossWeight?: number;
  fineWeight?: number;
  purity?: number;
  validatedWeight?: number;
  recovered?: number;
  inputBars?: BarItem[];
}

export interface DispatchResult {
  reference: string;
  destination: string;
  totalWeight: number;
  grossWeight?: number;
  totalGrossSP: number;
  totalBalanza: number;
  totalMerma: number;
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
      const lotBars = d.bars || [];
      const lotGrossWeight = lotBars.reduce((sum, b) => sum + Number(b.grossWeight || 0), 0);
      const lotFineWeight = lotBars.reduce((sum, b) => sum + Number(b.fineWeight || 0), 0);
      const lotPurity = lotGrossWeight > 0 ? (lotFineWeight / lotGrossWeight) * 1000 : 0;

      const inputBars: BarItem[] = lotBars.map(b => ({
        barNumber: b.barNumber,
        grossWeight: Number(b.grossWeight || 0),
        purity: Number(b.purity || 0),
        fineWeight: Number(b.fineWeight || 0),
        provider: b.client?.name || 'DESCONOCIDO',
      }));

      const composition = computeComposition(
        lotBars.map(b => ({
          clientId: b.clientId || '',
          clientName: b.client?.name || 'DESCONOCIDO',
          fineWeight: Number(b.fineWeight || 0),
        })),
      );
      const recovered = d.lot?.recovered ?? lotGrossWeight;
      if (composition.length > 1) {
        return composition.map(entry => ({
          name: d.lot?.name || '—',
          weight: entry.weight,
          provider: entry.clientName,
          isMixed: true,
          grossWeight: lotGrossWeight,
          fineWeight: lotFineWeight,
          purity: lotPurity,
          recovered,
          inputBars,
        } as LotItem));
      }
      return [{
        name: d.lot?.name || '—',
        weight: Number(d.weightAported),
        provider: d.lot?.process?.client?.name || 'DESCONOCIDO',
        isMixed: false,
        grossWeight: lotGrossWeight,
        fineWeight: lotFineWeight,
        purity: lotPurity,
        recovered,
        inputBars,
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

  const grossTotal = [
    ...(exit.exitDetails ?? []).flatMap((d) => d.bars ?? []),
    ...(exit.bars ?? []),
  ].reduce((sum, b) => sum + Number(b.grossWeight ?? 0), 0);

  const totalBalanza =
    (exit.exitDetails ?? []).reduce((sum, d) => {
      const lotGross = (d.bars ?? []).reduce((s, b) => s + Number(b.grossWeight || 0), 0);
      return sum + (Number(d.lot?.recovered) > 0 ? Number(d.lot?.recovered) : lotGross);
    }, 0) +
    (exit.bars ?? []).reduce((s, b) => s + Number(b.grossWeight || 0), 0);

  const totalMerma = grossTotal - totalBalanza;

  return {
    reference: `DESP-${exit.id.slice(0, 8).toUpperCase()}`,
    destination: exit.destination,
    totalWeight: grossTotal > 0 ? grossTotal : Number(exit.totalWeight),
    totalGrossSP: grossTotal,
    totalBalanza,
    totalMerma,
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
  showInputBars = false,
) {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pw = 210, m = 15, cw = pw - m * 2;
  let y = 15;

  const isMixed = data.type === 'mixed';
  const isBarMode = data.type === 'bars';
  const isLotMode = data.type === 'lots';
  const itemCount = (data.lotCount ?? 0) + (data.barCount ?? 0);
  const isEmpresa = copyType === 'EMPRESA';
  const hasMixedLot = (data.lots || []).some(l => l.isMixed);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(19, 145, 105);
  doc.text('BANDES', m, 14);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Banco de Desarrollo Económico y Social de Venezuela', m, 20);

  doc.setDrawColor(19, 145, 105);
  doc.setLineWidth(0.6);
  doc.line(m, 24, pw - m, 24);

  doc.setTextColor(100, 100, 100);
  doc.setFontSize(7);
  doc.text('Sistema de Trazabilidad de Oro Fino', m, 30);

  const titleSuffix = isMixed ? ' MIXTO' : isBarMode ? ' (BARRAS)' : ' GLOBAL';
  const copyLabel = isEmpresa ? 'EMPRESA' : 'CLIENTE';
  doc.setTextColor(19, 145, 105);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`COMPROBANTE DE DESPACHO${titleSuffix} — ${copyLabel}`, pw - m, 14, { align: 'right' });
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(`Ref: ${data.reference}`, pw - m, 20, { align: 'right' });
  doc.text(`Fecha: ${new Date(data.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, pw - m, 30, { align: 'right' });

  if (isEmpresa) {
    doc.setFontSize(48);
    doc.setTextColor(220, 220, 220);
    doc.setFont('helvetica', 'bold');
    doc.text('USO INTERNO', pw / 2, 160, { align: 'center', angle: 45 });
  }

  y = 40;

  doc.setFillColor(234, 244, 240);
  doc.rect(m, y - 4, cw, 7, 'F');
  doc.setTextColor(19, 145, 105);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('DATOS DEL DESTINATARIO', m + 2, y + 1); y += 6;

  const colLeft = m;
  const colRight = pw - m - 45;
  let yLeft = y;
  let yRight = y;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);

  doc.text(`Nombre/Razón Social: ${data.destination}`, colLeft, yLeft); yLeft += 5;
  if (destinationClient?.rif) { doc.text(`RIF: ${destinationClient.rif}`, colLeft, yLeft); yLeft += 5; }
  if (destinationClient?.contactInfo) { doc.text(`Contacto: ${destinationClient.contactInfo}`, colLeft, yLeft); yLeft += 5; }

  y = Math.max(yLeft, yRight) + 2;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.2);
  doc.line(m, y, pw - m, y);
  y += 8;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  if (isEmpresa) {
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('DETALLE POR PROVEEDOR', m + 2, y + 1); y += 6;

    if (hasMixedLot) {
      doc.setFontSize(7);
      doc.text('Nota: los lotes marcados con ◈ son MIXTOS y consolidan material de múltiples proveedores.', m, y); y += 6;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
    }

    data.providers.forEach((pv) => {
      if (y > 250) { doc.addPage(); y = 20; }
      doc.setFillColor(19, 145, 105);
      doc.rect(m, y - 4, cw, 7, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${pv.name} — ${pv.count} ítem(s) — ${formatWeight(Number(pv.weight))}`, m + 2, y + 1);
      y += 10;

      const providerLots = (data.lots || []).filter(l => l.provider === pv.name);
      const providerBars = (data.bars || []).filter(b => b.provider === pv.name);

      if (providerLots.length > 0) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFillColor(19, 145, 105);
        doc.rect(m, y - 4, cw, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(5.5);
        doc.setFont('helvetica', 'bold');
        const lotColsW = [20, 60, 30, 35, 20, 25];
        doc.text('TIPO', m + 3, y + 1);
        doc.text('CÓDIGO', m + 3 + lotColsW[0], y + 1);
        doc.text('PESO BRUTO (g)', m + 3 + lotColsW[0] + lotColsW[1], y + 1);
        doc.text('PESO BALANZA (g)', m + 3 + lotColsW[0] + lotColsW[1] + lotColsW[2], y + 1);
        doc.text('LEY (‰)', m + 3 + lotColsW[0] + lotColsW[1] + lotColsW[2] + lotColsW[3], y + 1);
        doc.text('PESO FINO (g)', pw - m - 2, y + 1, { align: 'right' });
        y += 7;

        providerLots.forEach((lot, idx) => {
          if (y > 260) { doc.addPage(); y = 20; }
          if (idx % 2 === 0) {
            doc.setFillColor(248, 248, 248);
            doc.rect(m, y - 4, cw, 7, 'F');
          }
          doc.setFontSize(7);
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(80, 80, 80);
          doc.text(lot.isMixed ? 'MIXTA' : 'REFUNDIDA', m + 3, y + 1);
          doc.text(`${lot.name}${lot.isMixed ? '  ◈' : ''}`, m + 3 + lotColsW[0], y + 1);
          doc.text(formatWeight(Number(lot.grossWeight ?? lot.recovered ?? 0)), m + 3 + lotColsW[0] + lotColsW[1], y + 1);
          doc.text(formatWeight(Number(lot.recovered ?? lot.grossWeight ?? 0)), m + 3 + lotColsW[0] + lotColsW[1] + lotColsW[2], y + 1);
          doc.text((Number(lot.purity) || 0).toFixed(2).replace('.', ','), m + 3 + lotColsW[0] + lotColsW[1] + lotColsW[2] + lotColsW[3], y + 1);
          doc.text(formatWeight(Number(lot.fineWeight ?? 0)), pw - m - 2, y + 1, { align: 'right' });
          y += 7;

          if (showInputBars && lot.inputBars && lot.inputBars.length > 0) {
            lot.inputBars.forEach((bar) => {
              if (y > 260) { doc.addPage(); y = 20; }
              doc.setFillColor(242, 250, 247);
              doc.rect(m, y - 3.5, cw, 6, 'F');
              doc.setFontSize(6);
              doc.setFont('helvetica', 'normal');
              doc.setTextColor(19, 145, 105);
              doc.text('  └', m + 3, y + 0.5);
              doc.setTextColor(80, 80, 80);
              doc.text(bar.barNumber, m + 3 + lotColsW[0], y + 0.5);
              doc.text(formatWeight(bar.grossWeight), m + 3 + lotColsW[0] + lotColsW[1], y + 0.5);
              doc.text('—', m + 3 + lotColsW[0] + lotColsW[1] + lotColsW[2], y + 0.5);
              doc.text((Number(bar.purity) || 0).toFixed(2).replace('.', ','), m + 3 + lotColsW[0] + lotColsW[1] + lotColsW[2] + lotColsW[3], y + 0.5);
              doc.text(formatWeight(bar.fineWeight), pw - m - 2, y + 0.5, { align: 'right' });
              y += 5;
            });
          }
        });
      }

      if (providerBars.length > 0) {
        if (y > 255) { doc.addPage(); y = 20; }
        doc.setFillColor(19, 145, 105);
        doc.rect(m, y - 4, cw, 7, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.setFont('helvetica', 'bold');
        const barColsW = [18, 28, 28, 28, 22, cw - 124];
        doc.text('TIPO', m + 3, y + 1);
        doc.text('CÓDIGO', m + 3 + barColsW[0], y + 1);
        doc.text('PESO BRUTO (g)', m + 3 + barColsW[0] + barColsW[1], y + 1);
        doc.text('PESO BALANZA (g)', m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y + 1);
        doc.text('LEY AU (‰)', m + 3 + barColsW[0] + barColsW[1] + barColsW[2] + barColsW[3], y + 1);
        doc.text('PESO FINO (g)', pw - m - 2, y + 1, { align: 'right' });
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
          doc.setTextColor(19, 145, 105);
          doc.text('SIN REF.', m + 3, y + 1);
          doc.setTextColor(80, 80, 80);
          doc.text(bar.barNumber, m + 3 + barColsW[0], y + 1);
          doc.text(formatWeight(bar.grossWeight), m + 3 + barColsW[0] + barColsW[1], y + 1);
          doc.text('—', m + 3 + barColsW[0] + barColsW[1] + barColsW[2], y + 1);
          doc.text((Number(bar.purity) || 0).toFixed(2).replace('.', ','), m + 3 + barColsW[0] + barColsW[1] + barColsW[2] + barColsW[3], y + 1);
          doc.text(formatWeight(bar.fineWeight), pw - m - 2, y + 1, { align: 'right' });
          y += 7;
        });
      }

      y += 4;
    });
  } else {
    doc.setFillColor(234, 244, 240);
    doc.rect(m, y - 4, cw, 7, 'F');
    doc.setTextColor(19, 145, 105);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('RESUMEN DEL DESPACHO', m + 2, y + 1); y += 6;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    if (isMixed) {
      doc.text(`Lotes: ${data.lotCount ?? 0} | Barras: ${data.barCount ?? 0} | Total: ${itemCount}`, m, y); y += 5;
    } else {
      const itemLabel = isBarMode ? 'barras' : 'lotes';
      doc.text(`Total de ${itemLabel}: ${itemCount}`, m, y); y += 5;
    }
    doc.text(`Peso Físico : ${formatWeight(data.totalBalanza)}`, m, y); y += 5;
    if (hasMixedLot) {
/*       doc.setTextColor(168, 85, 247);
 */      doc.text('Incluye lote(s) MIXTO(s): material consolidado de varios proveedores.', m, y); y += 5;
/*       doc.setTextColor(80, 80, 80);
 */    }
  }

  y += 4;
  doc.setDrawColor(19, 145, 105);
  doc.setLineWidth(0.6);
  doc.line(m, y, pw - m, y); y += 8;

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  if (isEmpresa) {
    doc.text(`PESO BRUTO (ENTRADA): ${formatWeight(data.totalGrossSP)}`, m, y); y += 6;
    doc.text(`PESO BALANZA (SALIDA): ${formatWeight(data.totalBalanza)}`, m, y); y += 6;
    const merma = data.totalMerma;
    doc.text(merma < 0 ? `MERMA DE FUNDICIÓN: −${formatWeight(Math.abs(merma))}` : `MERMA DE FUNDICIÓN: ${formatWeight(merma)}`, m, y);
  } else {
    doc.text(`PESO FÍSICO: ${formatWeight(data.totalBalanza)}`, m, y);
  }
  y += 7;
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
  doc.text('PESO BRUTO', m, y);
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
