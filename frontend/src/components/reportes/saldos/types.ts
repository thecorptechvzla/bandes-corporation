export interface BarraEnBoveda {
  loteId: string;
  packingOrigen: string;
  fechaRecepcion: string;
  pesoBrutoRecibido: number;
  ley: number;
  pesoFinoDisponible: number;
  pesoBrutoEnBoveda: number;
  fechaEgreso: string | null;
  fueEgresado: boolean;
}

export interface SaldoRecord {
  cliente: string;
  totalRecibido: number;
  totalBarrasRecibidas: number;
  totalEgresado: number;
  totalEgresadoBR: number;
  merma: number;
  totalBarrasEgresadas: number;
  saldoActual: number;
  barrasEnBoveda: number;
  estatusCustodia: string;
}

export interface SaldoDetailedRecord extends SaldoRecord {
  barras: BarraEnBoveda[];
}

export interface SaldosReportData {
  records: SaldoRecord[];
}

export type SaldoReportType = 'resumido' | 'detallado';