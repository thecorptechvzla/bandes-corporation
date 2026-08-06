export interface LingoteEgreso {
  lote: string;
  lingoteId: string;
  pesoBruto: number;
  ley: number;
  pesoFino: number;
}

export interface EgresoRecord {
  id: string;
  guia: string;
  cliente: string;
  clienteId: string;
  clienteDestino: string;
  fecha: string;
  lingotes: number;
  pesoBruto: number;
  leyProm: number;
  pesoFino: number;
  destino: string;
  exit?: import('@/types/api').MaterialExit;
}

export interface EgresoDetailedRecord extends EgresoRecord {
  items: LingoteEgreso[];
}

export interface EgresoSummary {
  totalEgresos: number;
  totalLingotes: number;
  pesoFinoTotal: number;
  pesoBrutoTotal: number;
}

export interface EgresosReportData {
  summary: EgresoSummary;
  records: EgresoRecord[];
  detailed?: EgresoDetailedRecord[];
}

export type EgresoReportType = 'resumido' | 'detallado';