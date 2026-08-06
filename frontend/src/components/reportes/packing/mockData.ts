export interface BarRecord {
  lote: string;
  barId: string;
  pesoBruto: number;
  ley: number;
  pesoFino: number;
}

export interface PackingRecord {
  id: string;
  file: string;
  client: string;
  barras: number;
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
