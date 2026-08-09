export interface LingoteEgreso {
  lote: string;
  lingoteId: string;
  pesoBruto: number;
  pesoBrutoBalanza?: number;
  ley: number;
  pesoFino: number;
}

export interface BarraLote {
  barCode: string;
  pesoBruto: number;
  ley: number;
  pesoBalanza?: number;
  proveedor: string;
}

export interface LoteDetallado {
  loteName: string;
  recovered?: number;
  ley?: number;
  barras: BarraLote[];
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
  pesoBrutoBalanza: number;
  merma: number;
  leyProm: number;
  pesoFino: number;
  destino: string;
  exit?: import('@/types/api').MaterialExit;
}

export interface EgresoDetailedRecord extends EgresoRecord {
  items: LingoteEgreso[];
  lotes: LoteDetallado[];
}

export interface EgresoSummary {
  totalEgresos: number;
  totalLingotes: number;
  pesoFinoTotal: number;
  pesoBrutoTotal: number;
  pesoBrutoBalanzaTotal: number;
  mermaTotal: number;
}

export interface EgresosReportData {
  summary: EgresoSummary;
  records: EgresoRecord[];
  detailed?: EgresoDetailedRecord[];
}

export type EgresoReportType = 'resumido' | 'detallado';