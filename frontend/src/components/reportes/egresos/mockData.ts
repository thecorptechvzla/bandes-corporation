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
  fecha: string;
  lingotes: number;
  pesoBruto: number;
  leyProm: number;
  pesoFino: number;
  destino: string;
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
}

export type EgresoReportType = 'resumido' | 'detallado';

export const MOCK_CLIENTES_EGRESOS = [
  { id: '', name: 'Todos los Clientes' },
  { id: '1', name: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)' },
  { id: '2', name: 'THE CORP TECH, C.A.' },
  { id: '3', name: 'INVERSIONES TEST C.A.' },
];

export const MOCK_EGRESOS_DATA: EgresosReportData = {
  summary: {
    totalEgresos: 4,
    totalLingotes: 18,
    pesoFinoTotal: 19303.47,
    pesoBrutoTotal: 20190.30,
  },
  records: [
    {
      id: 'EGR-2026-001',
      guia: 'Guia_Despacho_EGR_001.pdf',
      cliente: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
      fecha: '2026-08-02',
      lingotes: 6,
      pesoBruto: 6250.00,
      leyProm: 0.9990,
      pesoFino: 6243.75,
      destino: 'Custodia Externa / BVC',
    },
    {
      id: 'EGR-2026-002',
      guia: 'Guia_Despacho_EGR_002.pdf',
      cliente: 'THE CORP TECH, C.A.',
      fecha: '2026-08-03',
      lingotes: 4,
      pesoBruto: 4610.10,
      leyProm: 0.9995,
      pesoFino: 4607.79,
      destino: 'Despacho de Exportación',
    },
    {
      id: 'EGR-2026-003',
      guia: 'Guia_Despacho_EGR_003.pdf',
      cliente: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
      fecha: '2026-08-04',
      lingotes: 4,
      pesoBruto: 3650.20,
      leyProm: 0.9150,
      pesoFino: 3339.93,
      destino: 'Devolución a Cliente',
    },
    {
      id: 'EGR-2026-004',
      guia: 'Guia_Despacho_EGR_004.pdf',
      cliente: 'INVERSIONES TEST C.A.',
      fecha: '2026-08-05',
      lingotes: 4,
      pesoBruto: 5680.00,
      leyProm: 0.9000,
      pesoFino: 5112.00,
      destino: 'Bóveda Principal',
    },
  ],
};

export const MOCK_EGRESOS_DETAILED: EgresoDetailedRecord[] = [
  {
    id: 'EGR-2026-001',
    guia: 'Guia_Despacho_EGR_001.pdf',
    cliente: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
    fecha: '2026-08-02',
    lingotes: 6,
    pesoBruto: 6250.00,
    leyProm: 0.9990,
    pesoFino: 6243.75,
    destino: 'Custodia Externa / BVC',
    items: [
      { lote: 'LOT-2026-A1', lingoteId: 'LIN-001', pesoBruto: 1041.67, ley: 0.9990, pesoFino: 1040.63 },
      { lote: 'LOT-2026-A1', lingoteId: 'LIN-002', pesoBruto: 1041.66, ley: 0.9990, pesoFino: 1040.62 },
      { lote: 'LOT-2026-A2', lingoteId: 'LIN-003', pesoBruto: 1041.67, ley: 0.9990, pesoFino: 1040.63 },
      { lote: 'LOT-2026-A2', lingoteId: 'LIN-004', pesoBruto: 1041.67, ley: 0.9990, pesoFino: 1040.63 },
      { lote: 'LOT-2026-A3', lingoteId: 'LIN-005', pesoBruto: 1041.67, ley: 0.9990, pesoFino: 1040.63 },
      { lote: 'LOT-2026-A3', lingoteId: 'LIN-006', pesoBruto: 1041.66, ley: 0.9990, pesoFino: 1040.61 },
    ],
  },
  {
    id: 'EGR-2026-002',
    guia: 'Guia_Despacho_EGR_002.pdf',
    cliente: 'THE CORP TECH, C.A.',
    fecha: '2026-08-03',
    lingotes: 4,
    pesoBruto: 4610.10,
    leyProm: 0.9995,
    pesoFino: 4607.79,
    destino: 'Despacho de Exportación',
    items: [
      { lote: 'LOT-2026-B1', lingoteId: 'LIN-007', pesoBruto: 1152.53, ley: 0.9995, pesoFino: 1151.95 },
      { lote: 'LOT-2026-B1', lingoteId: 'LIN-008', pesoBruto: 1152.53, ley: 0.9995, pesoFino: 1151.95 },
      { lote: 'LOT-2026-B2', lingoteId: 'LIN-009', pesoBruto: 1152.52, ley: 0.9995, pesoFino: 1151.94 },
      { lote: 'LOT-2026-B2', lingoteId: 'LIN-010', pesoBruto: 1152.52, ley: 0.9995, pesoFino: 1151.94 },
    ],
  },
  {
    id: 'EGR-2026-003',
    guia: 'Guia_Despacho_EGR_003.pdf',
    cliente: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
    fecha: '2026-08-04',
    lingotes: 4,
    pesoBruto: 3650.20,
    leyProm: 0.9150,
    pesoFino: 3339.93,
    destino: 'Devolución a Cliente',
    items: [
      { lote: 'LOT-2026-C1', lingoteId: 'LIN-011', pesoBruto: 912.55, ley: 0.9150, pesoFino: 834.98 },
      { lote: 'LOT-2026-C1', lingoteId: 'LIN-012', pesoBruto: 912.55, ley: 0.9150, pesoFino: 834.98 },
      { lote: 'LOT-2026-C2', lingoteId: 'LIN-013', pesoBruto: 912.55, ley: 0.9150, pesoFino: 834.98 },
      { lote: 'LOT-2026-C2', lingoteId: 'LIN-014', pesoBruto: 912.55, ley: 0.9150, pesoFino: 834.99 },
    ],
  },
  {
    id: 'EGR-2026-004',
    guia: 'Guia_Despacho_EGR_004.pdf',
    cliente: 'INVERSIONES TEST C.A.',
    fecha: '2026-08-05',
    lingotes: 4,
    pesoBruto: 5680.00,
    leyProm: 0.9000,
    pesoFino: 5112.00,
    destino: 'Bóveda Principal',
    items: [
      { lote: 'LOT-2026-D1', lingoteId: 'LIN-015', pesoBruto: 1420.00, ley: 0.9000, pesoFino: 1278.00 },
      { lote: 'LOT-2026-D1', lingoteId: 'LIN-016', pesoBruto: 1420.00, ley: 0.9000, pesoFino: 1278.00 },
      { lote: 'LOT-2026-D2', lingoteId: 'LIN-017', pesoBruto: 1420.00, ley: 0.9000, pesoFino: 1278.00 },
      { lote: 'LOT-2026-D2', lingoteId: 'LIN-018', pesoBruto: 1420.00, ley: 0.9000, pesoFino: 1278.00 },
    ],
  },
];
