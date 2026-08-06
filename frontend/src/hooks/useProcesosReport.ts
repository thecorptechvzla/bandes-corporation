import { api } from '@/lib/api';
import type {
  ProcesoDetailedRecord,
  ProcesoRecord,
  ProcesoReportType,
  ProcesoSummary,
  BarProceso,
} from '@/components/reportes/procesos/types';

interface ReportBarProcesoDTO {
  barNumber: string;
  grossWeight: number | string;
  fineWeight: number | string;
  status: string;
  client?: { id: string; name: string } | null;
  packing?: { fileName: string; packingNumber: number | null } | null;
}

interface ReportLotProcesoDTO {
  id: string;
  name: string;
  recovered?: number | string | null;
  bars?: ReportBarProcesoDTO[];
}

interface ReportProcesoDTO {
  id: string;
  name: string;
  clientId: string;
  isMixed: boolean;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  client?: { id: string; name: string } | null;
  lots?: ReportLotProcesoDTO[];
}

interface FetchProcesosReportParams {
  from: string;
  to: string;
  reportType: ProcesoReportType;
  clientId?: string;
}

const padNumber = (n: number) => String(n).padStart(3, '0');

export function computeSummary(records: ProcesoRecord[]): ProcesoSummary {
  const totalProcesos = records.length;
  const totalBarras = records.reduce((a, r) => a + r.barras, 0);
  const pesoResultanteTotal = records.reduce((a, r) => a + r.pesoObtenido, 0);
  const pesoInicialTotal = records.reduce((a, r) => a + r.pesoInicial, 0);
  const rendimientoProm = pesoInicialTotal > 0 ? (pesoResultanteTotal / pesoInicialTotal) * 100 : 0;
  return { totalProcesos, totalBarras, pesoResultanteTotal, rendimientoProm };
}

function mapEstatus(status: string): string {
  switch (status) {
    case 'CLOSED':
      return 'Completado';
    case 'CANCELLED':
      return 'Cancelado';
    case 'OPEN':
    default:
      return 'Activo';
  }
}

function mapEstatusBarra(status: string): string {
  switch (status) {
    case 'POR_VALIDAR':
      return 'Sin Validar';
    case 'IN_STOCK':
      return 'Disponible';
    case 'PROCESANDO':
      return 'En Proceso';
    case 'COMPLETADO':
      return 'Procesada';
    case 'EXITED':
      return 'Egresada';
    default:
      return status;
  }
}

export function toProcesoRecord(p: ReportProcesoDTO, index: number): ProcesoRecord {
  const bars = p.lots?.flatMap((l) => l.bars ?? []) ?? [];
  const proveedores = [...new Set(bars.map((b) => b.client?.name ?? '').filter(Boolean))];

  const pesoInicial = bars.reduce((acc, b) => acc + Number(b.grossWeight ?? 0), 0);
  const recovered = p.lots?.reduce((acc, l) => acc + Number(l.recovered ?? 0), 0) ?? 0;
  const pesoObtenido = recovered > 0 ? recovered : bars.reduce((acc, b) => acc + Number(b.fineWeight ?? 0), 0);

  return {
    id: `PROC-${padNumber(index + 1)}`,
    tipo: p.name,
    proveedores: proveedores.length > 0 ? proveedores : [p.client?.name ?? 'DESCONOCIDO'],
    esMixto: p.isMixed,
    fecha: p.createdAt.slice(0, 10),
    estatus: mapEstatus(p.status),
    barras: bars.length,
    pesoInicial,
    pesoObtenido,
  };
}

export function toProcesoDetailedRecord(p: ReportProcesoDTO, index: number): ProcesoDetailedRecord {
  const base = toProcesoRecord(p, index);

  const bars: BarProceso[] = (p.lots ?? []).flatMap((l) =>
    (l.bars ?? []).map((b) => ({
      lote: l.name,
      barId: b.barNumber,
      packingOrigen: b.packing?.fileName
        ?? (b.packing?.packingNumber != null ? `PKG-${padNumber(b.packing.packingNumber)}` : '—'),
      proveedorOrigen: b.client?.name ?? 'DESCONOCIDO',
      pesoInicial: Number(b.grossWeight ?? 0),
      estatusBarra: mapEstatusBarra(b.status),
      pesoResultante: Number(l.recovered ?? b.fineWeight ?? 0),
    })),
  );

  return { ...base, bars };
}

export async function fetchProcesosReport({
  from,
  to,
  reportType,
  clientId,
}: FetchProcesosReportParams): Promise<{
  summary: ProcesoSummary;
  records: ProcesoRecord[];
  detailed: ProcesoDetailedRecord[];
}> {
  const res = await api.get('/processes/report', {
    params: { from, to, type: reportType, clientId: clientId || undefined },
  });
  const processes: ReportProcesoDTO[] = res.data;

  const records = processes.map(toProcesoRecord);
  const detailed = reportType === 'detallado' ? processes.map(toProcesoDetailedRecord) : [];

  return { summary: computeSummary(records), records, detailed };
}
