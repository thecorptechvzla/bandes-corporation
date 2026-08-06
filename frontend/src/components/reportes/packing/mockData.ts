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
}

export type ReportType = 'resumido' | 'detallado';

export const MOCK_PACKING_DATA: PackingReportData = {
  summary: {
    totalPackings: 6,
    totalBarras: 24,
    pesoBrutoTotal: 25978.21,
    leyProm: 0.9081,
    pesoFinoTotal: 23590.50,
  },
  records: [
    {
      id: 'PKG-2026-001',
      file: 'CVM_Packing_Lote_01.pdf',
      client: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
      barras: 4,
      pesoBruto: 3650.20,
      ley: 0.9150,
      pesoFino: 3339.93,
    },
    {
      id: 'PKG-2026-002',
      file: 'CVM_Packing_Lote_02.pdf',
      client: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
      barras: 4,
      pesoBruto: 3650.30,
      ley: 0.9150,
      pesoFino: 3340.02,
    },
    {
      id: 'PKG-2026-003',
      file: 'CVM_Packing_Lote_03.pdf',
      client: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
      barras: 4,
      pesoBruto: 3650.32,
      ley: 0.9150,
      pesoFino: 3340.05,
    },
    {
      id: 'PKG-2026-004',
      file: 'CORPTECH_Recepcion_A.pdf',
      client: 'THE CORP TECH, C.A.',
      barras: 4,
      pesoBruto: 4653.36,
      ley: 0.9080,
      pesoFino: 4225.25,
    },
    {
      id: 'PKG-2026-005',
      file: 'CORPTECH_Recepcion_B.pdf',
      client: 'THE CORP TECH, C.A.',
      barras: 4,
      pesoBruto: 4653.36,
      ley: 0.9080,
      pesoFino: 4225.25,
    },
    {
      id: 'PKG-2026-006',
      file: 'TEST_Recepcion_Unica.pdf',
      client: 'INVERSIONES TEST C.A.',
      barras: 4,
      pesoBruto: 5720.67,
      ley: 0.8950,
      pesoFino: 5120.00,
    },
  ],
};

export const MOCK_DETAILED_DATA: PackingDetailedRecord[] = [
  {
    id: 'PKG-2026-001',
    file: 'CVM_Packing_Lote_01.pdf',
    client: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
    barras: 4,
    pesoBruto: 3650.20,
    ley: 0.9150,
    pesoFino: 3339.93,
    bars: [
      { lote: 'LOT-2026-A1', barId: 'BAR-001', pesoBruto: 912.55, ley: 0.9150, pesoFino: 835.00 },
      { lote: 'LOT-2026-A1', barId: 'BAR-002', pesoBruto: 912.60, ley: 0.9150, pesoFino: 835.03 },
      { lote: 'LOT-2026-A1', barId: 'BAR-003', pesoBruto: 912.50, ley: 0.9150, pesoFino: 834.94 },
      { lote: 'LOT-2026-A1', barId: 'BAR-004', pesoBruto: 912.55, ley: 0.9150, pesoFino: 834.98 },
    ],
  },
  {
    id: 'PKG-2026-002',
    file: 'CVM_Packing_Lote_02.pdf',
    client: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
    barras: 4,
    pesoBruto: 3650.30,
    ley: 0.9150,
    pesoFino: 3340.02,
    bars: [
      { lote: 'LOT-2026-A2', barId: 'BAR-005', pesoBruto: 912.60, ley: 0.9150, pesoFino: 835.03 },
      { lote: 'LOT-2026-A2', barId: 'BAR-006', pesoBruto: 912.55, ley: 0.9150, pesoFino: 835.00 },
      { lote: 'LOT-2026-A2', barId: 'BAR-007', pesoBruto: 912.55, ley: 0.9150, pesoFino: 835.00 },
      { lote: 'LOT-2026-A2', barId: 'BAR-008', pesoBruto: 912.60, ley: 0.9150, pesoFino: 835.03 },
    ],
  },
  {
    id: 'PKG-2026-003',
    file: 'CVM_Packing_Lote_03.pdf',
    client: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
    barras: 4,
    pesoBruto: 3650.32,
    ley: 0.9150,
    pesoFino: 3340.05,
    bars: [
      { lote: 'LOT-2026-A3', barId: 'BAR-009', pesoBruto: 912.58, ley: 0.9150, pesoFino: 835.02 },
      { lote: 'LOT-2026-A3', barId: 'BAR-010', pesoBruto: 912.60, ley: 0.9150, pesoFino: 835.03 },
      { lote: 'LOT-2026-A3', barId: 'BAR-011', pesoBruto: 912.55, ley: 0.9150, pesoFino: 834.99 },
      { lote: 'LOT-2026-A3', barId: 'BAR-012', pesoBruto: 912.59, ley: 0.9150, pesoFino: 835.01 },
    ],
  },
  {
    id: 'PKG-2026-004',
    file: 'CORPTECH_Recepcion_A.pdf',
    client: 'THE CORP TECH, C.A.',
    barras: 4,
    pesoBruto: 4653.36,
    ley: 0.9080,
    pesoFino: 4225.25,
    bars: [
      { lote: 'LOT-2026-B1', barId: 'BAR-013', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
      { lote: 'LOT-2026-B1', barId: 'BAR-014', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
      { lote: 'LOT-2026-B1', barId: 'BAR-015', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
      { lote: 'LOT-2026-B1', barId: 'BAR-016', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
    ],
  },
  {
    id: 'PKG-2026-005',
    file: 'CORPTECH_Recepcion_B.pdf',
    client: 'THE CORP TECH, C.A.',
    barras: 4,
    pesoBruto: 4653.36,
    ley: 0.9080,
    pesoFino: 4225.25,
    bars: [
      { lote: 'LOT-2026-B2', barId: 'BAR-017', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
      { lote: 'LOT-2026-B2', barId: 'BAR-018', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
      { lote: 'LOT-2026-B2', barId: 'BAR-019', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
      { lote: 'LOT-2026-B2', barId: 'BAR-020', pesoBruto: 1163.34, ley: 0.9080, pesoFino: 1056.31 },
    ],
  },
  {
    id: 'PKG-2026-006',
    file: 'TEST_Recepcion_Unica.pdf',
    client: 'INVERSIONES TEST C.A.',
    barras: 4,
    pesoBruto: 5720.67,
    ley: 0.8950,
    pesoFino: 5120.00,
    bars: [
      { lote: 'LOT-2026-C1', barId: 'BAR-021', pesoBruto: 1430.17, ley: 0.8950, pesoFino: 1280.00 },
      { lote: 'LOT-2026-C1', barId: 'BAR-022', pesoBruto: 1430.17, ley: 0.8950, pesoFino: 1280.00 },
      { lote: 'LOT-2026-C1', barId: 'BAR-023', pesoBruto: 1430.17, ley: 0.8950, pesoFino: 1280.00 },
      { lote: 'LOT-2026-C1', barId: 'BAR-024', pesoBruto: 1430.16, ley: 0.8950, pesoFino: 1280.00 },
    ],
  },
];

export const MOCK_CLIENTS = [
  { id: '', name: 'Todos los Clientes' },
  { id: '1', name: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)' },
  { id: '2', name: 'THE CORP TECH, C.A.' },
  { id: '3', name: 'INVERSIONES TEST C.A.' },
];
