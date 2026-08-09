import { api } from '@/lib/api';
import type { MaterialExit } from '@/types/api';
import type {
  BarraLote,
  EgresoDetailedRecord,
  EgresoRecord,
  EgresoReportType,
  EgresoSummary,
  LingoteEgreso,
  LoteDetallado,
} from '@/components/reportes/egresos/types';

interface ReportBarEgresoDTO {
  id: string;
  barNumber: string;
  grossWeight: number | string;
  purity: number | string;
  fineWeight: number | string;
  clientId: string;
  client?: { id: string; name: string } | null;
}

interface ReportDetailEgresoDTO {
  id: string;
  weightAported: number | string;
  lot?: {
    id: string;
    name: string;
    recovered?: number | string | null;
    process?: { client?: { id: string; name: string } | null } | null;
  } | null;
  bars?: ReportBarEgresoDTO[];
}

interface ReportEgresoDTO {
  id: string;
  destination: string;
  clientId?: string | null;
  client?: { id: string; name: string } | null;
  totalWeight: number | string;
  createdAt: string;
  exitDetails?: ReportDetailEgresoDTO[];
  bars?: ReportBarEgresoDTO[];
}

interface FetchEgresosReportParams {
  from: string;
  to: string;
  reportType: EgresoReportType;
  clientId?: string;
}

const padNumber = (n: number) => String(n).padStart(3, '0');

export function computeSummary(records: EgresoRecord[]): EgresoSummary {
  const totalEgresos = records.length;
  const totalLingotes = records.reduce((a, r) => a + r.lingotes, 0);
  const pesoFinoTotal = records.reduce((a, r) => a + r.pesoFino, 0);
  const pesoBrutoTotal = records.reduce((a, r) => a + r.pesoBruto, 0);
  const pesoBrutoBalanzaTotal = records.reduce((a, r) => a + r.pesoBrutoBalanza, 0);
  const mermaTotal = records.reduce((a, r) => a + r.merma, 0);
  return {
    totalEgresos,
    totalLingotes,
    pesoFinoTotal,
    pesoBrutoTotal,
    pesoBrutoBalanzaTotal,
    mermaTotal,
  };
}

function collectBars(e: ReportEgresoDTO): Array<ReportBarEgresoDTO & { lotName?: string }> {
  const fromDetails = (e.exitDetails ?? []).flatMap((d) =>
    (d.bars ?? []).map((b) => ({ ...b, lotName: d.lot?.name ?? '' })),
  );
  const fromBars = (e.bars ?? []).map((b) => ({ ...b, lotName: '' }));
  return [...fromDetails, ...fromBars];
}

function clienteDeEgreso(bars: Array<{ client?: { id: string; name: string } | null }>): string {
  const names = [...new Set(bars.map((b) => b.client?.name ?? '').filter(Boolean))];
  if (names.length === 0) return 'DESCONOCIDO';
  return names.join(' / ');
}

export function toEgresoRecord(e: ReportEgresoDTO, index: number): EgresoRecord {
  const bars = collectBars(e);

  const pesoBruto = bars.reduce((acc, b) => acc + Number(b.grossWeight ?? 0), 0);

  const pesoFino =
    (e.exitDetails ?? []).reduce((sum, d) => {
      const bs = d.bars ?? [];
      const totalGross = bs.reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);
      const fineOfBars = bs.reduce((s, b) => s + Number(b.fineWeight ?? 0), 0);
      const rec = Number(d.lot?.recovered ?? 0);
      return sum + (rec > 0 && totalGross > 0 ? (rec / totalGross) * fineOfBars : fineOfBars);
    }, 0) +
    (e.bars ?? []).reduce((s, b) => s + Number(b.fineWeight ?? 0), 0);

  const pesoBrutoBalanza =
    (e.exitDetails ?? []).reduce((sum, d) => {
      const lotGross = (d.bars ?? []).reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);
      return sum + (Number(d.lot?.recovered ?? 0) > 0 ? Number(d.lot?.recovered) : lotGross);
    }, 0) +
    (e.bars ?? []).reduce((s, b) => s + Number(b.grossWeight ?? 0), 0);
  const merma = pesoBruto - pesoBrutoBalanza;

  const leyProm = pesoBrutoBalanza > 0 ? (pesoFino / pesoBrutoBalanza) * 1000 : 0;

  return {
    id: `EGR-${padNumber(index + 1)}`,
    guia: e.destination,
    cliente: clienteDeEgreso(bars),
    clienteId: e.clientId ?? '',
    clienteDestino: e.client?.name ?? '',
    fecha: e.createdAt.slice(0, 10),
    lingotes: bars.length,
    pesoBruto,
    pesoBrutoBalanza,
    merma,
    leyProm,
    pesoFino,
    destino: e.destination,
    exit: e as unknown as MaterialExit,
  };
}

const round = (n: number, dp = 4) => {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
};

function prorateByLot(details: ReportDetailEgresoDTO[]): LingoteEgreso[] {
  const items: LingoteEgreso[] = [];

  for (const d of details) {
    const bars = d.bars ?? [];
    if (bars.length === 0) continue;

    const recovered = d.lot?.recovered;
    const totalGross = bars.reduce((acc, b) => acc + Number(b.grossWeight ?? 0), 0);
    const usable = recovered != null && Number(recovered) > 0 && totalGross > 0;

    let allocated = 0;
    bars.forEach((b, i) => {
      let pesoBrutoBalanza: number | undefined;
      if (usable) {
        const r = Number(recovered);
        if (i === bars.length - 1) {
          pesoBrutoBalanza = round(r - allocated);
        } else {
          pesoBrutoBalanza = round((r * Number(b.grossWeight ?? 0)) / totalGross);
          allocated += pesoBrutoBalanza;
        }
      }

      items.push({
        lote: d.lot?.name ?? '—',
        lingoteId: b.barNumber,
        pesoBruto: Number(b.grossWeight ?? 0),
        pesoBrutoBalanza,
        ley: Number(b.purity ?? 0),
        pesoFino: Number(((pesoBrutoBalanza ?? Number(b.grossWeight ?? 0)) * Number(b.purity ?? 0)) / 1000),
      });
    });
  }

  return items;
}

export function toEgresoDetailedRecord(e: ReportEgresoDTO, index: number): EgresoDetailedRecord {
  const base = toEgresoRecord(e, index);

  const fromDetails = prorateByLot(e.exitDetails ?? []);
  const fromBars = (e.bars ?? []).map<LingoteEgreso>((b) => ({
    lote: '—',
    lingoteId: b.barNumber,
    pesoBruto: Number(b.grossWeight ?? 0),
    pesoBrutoBalanza: undefined,
    ley: Number(b.purity ?? 0),
    pesoFino: Number(b.fineWeight ?? 0),
  }));

  const lotes: LoteDetallado[] = (e.exitDetails ?? []).map((d) => {
    const bars = d.bars ?? [];
    const recovered = d.lot?.recovered != null ? Number(d.lot.recovered) : undefined;
    const totalGross = bars.reduce((acc, b) => acc + Number(b.grossWeight ?? 0), 0);
    const usable = recovered != null && recovered > 0 && totalGross > 0;

    let allocated = 0;
    const barras: BarraLote[] = bars.map((b, i) => {
      let pesoBalanza: number | undefined;
      if (usable) {
        if (i === bars.length - 1) {
          pesoBalanza = round(recovered! - allocated);
        } else {
          pesoBalanza = round((recovered! * Number(b.grossWeight ?? 0)) / totalGross);
          allocated += pesoBalanza;
        }
      }
      return {
        barCode: b.barNumber,
        pesoBruto: Number(b.grossWeight ?? 0),
        ley: Number(b.purity ?? 0),
        pesoBalanza,
        proveedor: b.client?.name ?? '—',
      };
    });

    const brTotal = barras.reduce((acc, b) => acc + (b.pesoBalanza ?? b.pesoBruto), 0);
    const totalPesoFino = barras.reduce((acc, b) => acc + ((b.pesoBalanza ?? b.pesoBruto) * b.ley) / 1000, 0);
    const ley = brTotal > 0 ? (totalPesoFino / brTotal) * 1000 : 0;

    return {
      loteName: d.lot?.name ?? '—',
      recovered,
      ley,
      barras,
    };
  });

  if (e.bars && e.bars.length > 0) {
    const barrasSueltas: BarraLote[] = e.bars.map((b) => ({
      barCode: b.barNumber,
      pesoBruto: Number(b.grossWeight ?? 0),
      ley: Number(b.purity ?? 0),
      pesoBalanza: undefined,
      proveedor: b.client?.name ?? '—',
    }));
    const totalGross = barrasSueltas.reduce((acc, b) => acc + b.pesoBruto, 0);
    const totalPesoFino = barrasSueltas.reduce((acc, b) => acc + (b.pesoBruto * b.ley) / 1000, 0);
    lotes.push({
      loteName: '—',
      recovered: undefined,
      ley: totalGross > 0 ? (totalPesoFino / totalGross) * 1000 : 0,
      barras: barrasSueltas,
    });
  }

  return { ...base, items: [...fromDetails, ...fromBars], lotes };
}

export async function fetchEgresosReport({
  from,
  to,
  reportType,
  clientId,
}: FetchEgresosReportParams): Promise<{
  summary: EgresoSummary;
  records: EgresoRecord[];
  detailed: EgresoDetailedRecord[];
}> {
  const res = await api.get('/material-exits/report', {
    params: { from, to, type: reportType, clientId: clientId || undefined },
  });
  const exits: ReportEgresoDTO[] = res.data;

  const records = exits.map(toEgresoRecord);
  const detailed = reportType === 'detallado' ? exits.map(toEgresoDetailedRecord) : [];

  return { summary: computeSummary(records), records, detailed };
}
