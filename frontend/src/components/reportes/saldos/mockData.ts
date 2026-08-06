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

export const MOCK_CLIENTES_SALDOS = [
  { id: '', name: 'Todos los Clientes' },
  { id: '1', name: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)' },
  { id: '2', name: 'THE CORP TECH, C.A.' },
  { id: '3', name: 'INVERSIONES TEST C.A.' },
];

export const MOCK_SALDOS_RECORDS: SaldoRecord[] = [
  {
    cliente: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
    totalRecibido: 10950.82,
    totalBarrasRecibidas: 12,
    totalEgresado: 9890.20,
    totalBarrasEgresadas: 10,
    saldoActual: 1060.62,
    barrasEnBoveda: 2,
    estatusCustodia: 'Con Stock',
  },
  {
    cliente: 'THE CORP TECH, C.A.',
    totalRecibido: 9306.72,
    totalBarrasRecibidas: 8,
    totalEgresado: 4610.10,
    totalBarrasEgresadas: 4,
    saldoActual: 4696.62,
    barrasEnBoveda: 4,
    estatusCustodia: 'Con Stock',
  },
  {
    cliente: 'INVERSIONES TEST C.A.',
    totalRecibido: 5720.67,
    totalBarrasRecibidas: 4,
    totalEgresado: 5680.00,
    totalBarrasEgresadas: 4,
    saldoActual: 40.67,
    barrasEnBoveda: 1,
    estatusCustodia: 'Saldo Mínimo',
  },
];

export const MOCK_SALDOS_DETAILED: SaldoDetailedRecord[] = [
  {
    ...MOCK_SALDOS_RECORDS[0],
    barras: [
      { loteId: 'LIN-CVM-011', packingOrigen: 'PK-CVM-2026-07', fechaRecepcion: '2026-07-18', pesoBrutoRecibido: 1000.00, ley: 0.9995, pesoFinoDisponible: 530.04, pesoBrutoEnBoveda: 530.31, fechaEgreso: null, fueEgresado: false },
      { loteId: 'LIN-CVM-012', packingOrigen: 'PK-CVM-2026-07', fechaRecepcion: '2026-07-18', pesoBrutoRecibido: 1000.00, ley: 0.9990, pesoFinoDisponible: 529.78, pesoBrutoEnBoveda: 530.31, fechaEgreso: '2026-08-02', fueEgresado: true },
    ],
  },
  {
    ...MOCK_SALDOS_RECORDS[1],
    barras: [
      { loteId: 'LIN-TCT-005', packingOrigen: 'PK-TCT-2026-06', fechaRecepcion: '2026-06-25', pesoBrutoRecibido: 1200.00, ley: 0.9995, pesoFinoDisponible: 1173.57, pesoBrutoEnBoveda: 1174.16, fechaEgreso: null, fueEgresado: false },
      { loteId: 'LIN-TCT-006', packingOrigen: 'PK-TCT-2026-06', fechaRecepcion: '2026-06-25', pesoBrutoRecibido: 1200.00, ley: 0.9990, pesoFinoDisponible: 1172.98, pesoBrutoEnBoveda: 1174.16, fechaEgreso: null, fueEgresado: false },
      { loteId: 'LIN-TCT-007', packingOrigen: 'PK-TCT-2026-07', fechaRecepcion: '2026-07-10', pesoBrutoRecibido: 1200.00, ley: 0.9995, pesoFinoDisponible: 1173.56, pesoBrutoEnBoveda: 1174.15, fechaEgreso: '2026-08-03', fueEgresado: true },
      { loteId: 'LIN-TCT-008', packingOrigen: 'PK-TCT-2026-07', fechaRecepcion: '2026-07-10', pesoBrutoRecibido: 1200.00, ley: 0.9990, pesoFinoDisponible: 1172.97, pesoBrutoEnBoveda: 1174.15, fechaEgreso: null, fueEgresado: false },
    ],
  },
  {
    ...MOCK_SALDOS_RECORDS[2],
    barras: [
      { loteId: 'LIN-INV-003', packingOrigen: 'PK-INV-2026-08', fechaRecepcion: '2026-08-01', pesoBrutoRecibido: 60.00, ley: 0.9200, pesoFinoDisponible: 37.42, pesoBrutoEnBoveda: 40.67, fechaEgreso: '2026-08-05', fueEgresado: true },
    ],
  },
];
