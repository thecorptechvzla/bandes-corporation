import { api } from '@/lib/api';
import type {
  PackingDetailedRecord,
  PackingRecord,
  PackingReportData,
  PackingSummary,
  ReportType,
} from '@/components/reportes/packing/types';

interface ReportPackingDTO {
  id: string;
  packingNumber: number | null;
  fileName: string;
  client?: { id: string; name: string } | null;
  barras: number;
  barrasValidadas?: number;
  barrasPendientes?: number;
  pesoBruto: number;
  pesoFino: number;
  ley: number;
  bars?: Array<{
    barNumber: string;
    grossWeight: number | string;
    purity: number | string;
    fineWeight: number | string;
    status: string;
    spGrossWeight: number | string | null;
    spPurity: number | string | null;
    lot?: { name: string } | null;
  }>;
}

interface FetchPackingReportParams {
  from: string;
  to: string;
  reportType: ReportType;
  clientId?: string;
}

export function computeSummary(records: PackingRecord[]): PackingSummary {
  const totalPackings = records.length;
  const totalBarras = records.reduce((acc, r) => acc + r.barras, 0);
  const totalValidadas = records.reduce((acc, r) => acc + r.barrasValidadas, 0);
  const totalPendientes = records.reduce((acc, r) => acc + r.barrasPendientes, 0);
  const pesoBrutoTotal = records.reduce((acc, r) => acc + r.pesoBruto, 0);
  const pesoFinoTotal = records.reduce((acc, r) => acc + r.pesoFino, 0);
  const leyProm = pesoBrutoTotal > 0 ? (pesoFinoTotal / pesoBrutoTotal) * 1000 : 0;
  return { totalPackings, totalBarras, totalValidadas, totalPendientes, pesoBrutoTotal, pesoFinoTotal, leyProm };
}

const padNumber = (n: number) => String(n).padStart(3, '0');

const countByStatus = (bars: ReportPackingDTO['bars']) => {
  const arr = bars ?? [];
  const validadas = arr.filter((b) => b.status !== 'POR_VALIDAR').length;
  return { validadas, pendientes: arr.length - validadas };
};

export function toPackingRecord(p: ReportPackingDTO): PackingRecord {
  const counts =
    p.barrasValidadas != null && p.barrasPendientes != null
      ? { validadas: p.barrasValidadas, pendientes: p.barrasPendientes }
      : countByStatus(p.bars);
  return {
    id: p.packingNumber != null ? `PKG-${padNumber(p.packingNumber)}` : p.id.slice(0, 8).toUpperCase(),
    uid: p.id,
    file: p.fileName,
    client: p.client?.name ?? '',
    barras: p.barras,
    barrasValidadas: counts.validadas,
    barrasPendientes: counts.pendientes,
    pesoBruto: p.pesoBruto,
    ley: p.ley,
    pesoFino: p.pesoFino,
  };
}

export function toPackingDetailedRecord(p: ReportPackingDTO): PackingDetailedRecord {
  const bars = (p.bars ?? []).map((b) => ({
    lote: b.lot?.name ?? '',
    barId: b.barNumber,
    status: b.status,
    spGrossWeight: b.spGrossWeight != null ? Number(b.spGrossWeight) : null,
    spPurity: b.spPurity != null ? Number(b.spPurity) : null,
    pesoBruto: Number(b.grossWeight),
    ley: Number(b.purity),
  }));

  return { ...toPackingRecord(p), bars };
}

export async function fetchPackingReport({
  from,
  to,
  reportType,
  clientId,
}: FetchPackingReportParams): Promise<PackingReportData> {
  const res = await api.get('/packings/report', {
    params: { from, to, type: reportType, clientId: clientId || undefined },
  });
  const packings: ReportPackingDTO[] = res.data;

  const records = packings.map(toPackingRecord);
  const detailed = reportType === 'detallado' ? packings.map(toPackingDetailedRecord) : [];

  return { summary: computeSummary(records), records, detailed };
}
