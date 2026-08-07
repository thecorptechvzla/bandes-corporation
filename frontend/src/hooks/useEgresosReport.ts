import { api } from '@/lib/api';
import type { MaterialExit } from '@/types/api';
import type {
  EgresoDetailedRecord,
  EgresoRecord,
  EgresoReportType,
  EgresoSummary,
  LingoteEgreso,
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
    name: string;
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
  return { totalEgresos, totalLingotes, pesoFinoTotal, pesoBrutoTotal };
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
  const pesoFino = bars.reduce((acc, b) => acc + Number(b.fineWeight ?? 0), 0);
  const leyProm = pesoBruto > 0 ? pesoFino / pesoBruto : 0;

  return {
    id: `EGR-${padNumber(index + 1)}`,
    guia: e.destination,
    cliente: clienteDeEgreso(bars),
    clienteId: e.clientId ?? '',
    clienteDestino: e.client?.name ?? '',
    fecha: e.createdAt.slice(0, 10),
    lingotes: bars.length,
    pesoBruto,
    leyProm,
    pesoFino,
    destino: e.destination,
    exit: e as unknown as MaterialExit,
  };
}

export function toEgresoDetailedRecord(e: ReportEgresoDTO, index: number): EgresoDetailedRecord {
  const base = toEgresoRecord(e, index);

  const items: LingoteEgreso[] = collectBars(e).map((b) => ({
    lote: b.lotName || '—',
    lingoteId: b.barNumber,
    pesoBruto: Number(b.grossWeight ?? 0),
    pesoBrutoBalanza: undefined,
    ley: Number(b.purity ?? 0) / 1000,
    pesoFino: Number(b.fineWeight ?? 0),
  }));

  return { ...base, items };
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
