export interface BarRecord {
  lote: string;
  barId: string;
  status: string;
  spGrossWeight: number | null;
  spPurity: number | null;
  pesoBruto: number;
  ley: number;
}

export interface PackingRecord {
  id: string;
  uid: string;
  file: string;
  client: string;
  barras: number;
  barrasValidadas: number;
  barrasPendientes: number;
  pesoBruto: number;
  ley: number;
  pesoFino: number;
}

export interface PackingDetailedRecord extends PackingRecord {
  bars: BarRecord[];
}

export interface PackingSummary {
  totalPackings: number;
  totalBarras: number;
  totalValidadas: number;
  totalPendientes: number;
  pesoBrutoTotal: number;
  leyProm: number;
  pesoFinoTotal: number;
}

export interface PackingReportData {
  summary: PackingSummary;
  records: PackingRecord[];
  detailed?: PackingDetailedRecord[];
}

export type ReportType = 'resumido' | 'detallado';