export interface BarProceso {
  lote: string;
  barId: string;
  packingOrigen: string;
  proveedorOrigen: string;
  pesoInicial: number;
  estatusBarra: string;
  pesoResultante: number;
}

export interface ProcesoRecord {
  id: string;
  tipo: string;
  proveedores: string[];
  esMixto: boolean;
  fecha: string;
  estatus: string;
  barras: number;
  pesoInicial: number;
  pesoObtenido: number;
}

export interface ProcesoDetailedRecord extends ProcesoRecord {
  bars: BarProceso[];
}

export interface ProcesoSummary {
  totalProcesos: number;
  totalBarras: number;
  pesoResultanteTotal: number;
  rendimientoProm: number;
}

export interface ProcesosReportData {
  summary: ProcesoSummary;
  records: ProcesoRecord[];
  detailed?: ProcesoDetailedRecord[];
}

export type ProcesoReportType = 'resumido' | 'detallado';

export const MOCK_PROVEEDORES = [
  { id: '', name: 'Todos los Proveedores' },
  { id: '1', name: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)' },
  { id: '2', name: 'THE CORP TECH, C.A.' },
  { id: '3', name: 'INVERSIONES TEST C.A.' },
  { id: 'mixto', name: 'Mixtos' },
];

export const MOCK_PROCESOS_DATA: ProcesosReportData = {
  summary: {
    totalProcesos: 4,
    totalBarras: 24,
    pesoResultanteTotal: 25690.30,
    rendimientoProm: 98.80,
  },
  records: [
    {
      id: 'PROC-2026-001',
      tipo: 'Fundición Inicial',
      proveedores: ['CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)'],
      esMixto: false,
      fecha: '2026-08-02',
      estatus: 'Completado',
      barras: 8,
      pesoInicial: 7300.50,
      pesoObtenido: 7150.20,
    },
    {
      id: 'PROC-2026-002',
      tipo: 'Afino / Electrólisis',
      proveedores: [
        'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
        'THE CORP TECH, C.A.',
      ],
      esMixto: true,
      fecha: '2026-08-03',
      estatus: 'Activo',
      barras: 8,
      pesoInicial: 8306.72,
      pesoObtenido: 8250.00,
    },
    {
      id: 'PROC-2026-003',
      tipo: 'Refinación Química',
      proveedores: ['THE CORP TECH, C.A.'],
      esMixto: false,
      fecha: '2026-08-04',
      estatus: 'Completado',
      barras: 4,
      pesoInicial: 4653.36,
      pesoObtenido: 4610.10,
    },
    {
      id: 'PROC-2026-004',
      tipo: 'Fundición y Homogeneización',
      proveedores: ['INVERSIONES TEST C.A.'],
      esMixto: false,
      fecha: '2026-08-05',
      estatus: 'Activo',
      barras: 4,
      pesoInicial: 5720.67,
      pesoObtenido: 5680.00,
    },
  ],
};

export const MOCK_PROCESOS_DETAILED: ProcesoDetailedRecord[] = [
  {
    id: 'PROC-2026-001',
    tipo: 'Fundición Inicial',
    proveedores: ['CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)'],
    esMixto: false,
    fecha: '2026-08-02',
    estatus: 'Completado',
    barras: 8,
    pesoInicial: 7300.50,
    pesoObtenido: 7150.20,
    bars: [
      { lote: 'LOT-2026-A1', barId: 'BAR-001', packingOrigen: 'PKG-2026-001', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.55, estatusBarra: 'Fundida', pesoResultante: 893.78 },
      { lote: 'LOT-2026-A1', barId: 'BAR-002', packingOrigen: 'PKG-2026-001', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.60, estatusBarra: 'Fundida', pesoResultante: 893.78 },
      { lote: 'LOT-2026-A1', barId: 'BAR-003', packingOrigen: 'PKG-2026-001', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.50, estatusBarra: 'Fundida', pesoResultante: 893.77 },
      { lote: 'LOT-2026-A2', barId: 'BAR-005', packingOrigen: 'PKG-2026-002', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.60, estatusBarra: 'Fundida', pesoResultante: 893.78 },
      { lote: 'LOT-2026-A2', barId: 'BAR-006', packingOrigen: 'PKG-2026-002', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.55, estatusBarra: 'Fundida', pesoResultante: 893.78 },
      { lote: 'LOT-2026-A2', barId: 'BAR-007', packingOrigen: 'PKG-2026-002', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.55, estatusBarra: 'Fundida', pesoResultante: 893.77 },
      { lote: 'LOT-2026-A3', barId: 'BAR-009', packingOrigen: 'PKG-2026-003', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.58, estatusBarra: 'Fundida', pesoResultante: 893.76 },
      { lote: 'LOT-2026-A3', barId: 'BAR-010', packingOrigen: 'PKG-2026-003', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.60, estatusBarra: 'Fundida', pesoResultante: 893.76 },
    ],
  },
  {
    id: 'PROC-2026-002',
    tipo: 'Afino / Electrólisis',
    proveedores: [
      'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)',
      'THE CORP TECH, C.A.',
    ],
    esMixto: true,
    fecha: '2026-08-03',
    estatus: 'Activo',
    barras: 8,
    pesoInicial: 8306.72,
    pesoObtenido: 8250.00,
    bars: [
      { lote: 'LOT-2026-A1', barId: 'BAR-004', packingOrigen: 'PKG-2026-001', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.55, estatusBarra: 'En Afino', pesoResultante: 905.00 },
      { lote: 'LOT-2026-A3', barId: 'BAR-011', packingOrigen: 'PKG-2026-003', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.55, estatusBarra: 'En Afino', pesoResultante: 905.00 },
      { lote: 'LOT-2026-A3', barId: 'BAR-012', packingOrigen: 'PKG-2026-003', proveedorOrigen: 'CORPORACIÓN VENEZOLANA DE MINERÍA (CVM)', pesoInicial: 912.59, estatusBarra: 'En Afino', pesoResultante: 905.00 },
      { lote: 'LOT-2026-B1', barId: 'BAR-013', packingOrigen: 'PKG-2026-004', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'En Afino', pesoResultante: 1155.00 },
      { lote: 'LOT-2026-B1', barId: 'BAR-014', packingOrigen: 'PKG-2026-004', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'En Afino', pesoResultante: 1155.00 },
      { lote: 'LOT-2026-B1', barId: 'BAR-015', packingOrigen: 'PKG-2026-004', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'En Afino', pesoResultante: 1155.00 },
      { lote: 'LOT-2026-B2', barId: 'BAR-017', packingOrigen: 'PKG-2026-005', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'En Afino', pesoResultante: 1155.00 },
      { lote: 'LOT-2026-B2', barId: 'BAR-018', packingOrigen: 'PKG-2026-005', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'En Afino', pesoResultante: 1155.00 },
    ],
  },
  {
    id: 'PROC-2026-003',
    tipo: 'Refinación Química',
    proveedores: ['THE CORP TECH, C.A.'],
    esMixto: false,
    fecha: '2026-08-04',
    estatus: 'Completado',
    barras: 4,
    pesoInicial: 4653.36,
    pesoObtenido: 4610.10,
    bars: [
      { lote: 'LOT-2026-B1', barId: 'BAR-016', packingOrigen: 'PKG-2026-004', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'Procesada', pesoResultante: 1152.53 },
      { lote: 'LOT-2026-B2', barId: 'BAR-019', packingOrigen: 'PKG-2026-005', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'Procesada', pesoResultante: 1152.53 },
      { lote: 'LOT-2026-B2', barId: 'BAR-020', packingOrigen: 'PKG-2026-005', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'Procesada', pesoResultante: 1152.52 },
      { lote: 'LOT-2026-B2', barId: 'BAR-021', packingOrigen: 'PKG-2026-005', proveedorOrigen: 'THE CORP TECH, C.A.', pesoInicial: 1163.34, estatusBarra: 'Procesada', pesoResultante: 1152.52 },
    ],
  },
  {
    id: 'PROC-2026-004',
    tipo: 'Fundición y Homogeneización',
    proveedores: ['INVERSIONES TEST C.A.'],
    esMixto: false,
    fecha: '2026-08-05',
    estatus: 'Activo',
    barras: 4,
    pesoInicial: 5720.67,
    pesoObtenido: 5680.00,
    bars: [
      { lote: 'LOT-2026-C1', barId: 'BAR-021', packingOrigen: 'PKG-2026-006', proveedorOrigen: 'INVERSIONES TEST C.A.', pesoInicial: 1430.17, estatusBarra: 'Fundida', pesoResultante: 1420.00 },
      { lote: 'LOT-2026-C1', barId: 'BAR-022', packingOrigen: 'PKG-2026-006', proveedorOrigen: 'INVERSIONES TEST C.A.', pesoInicial: 1430.17, estatusBarra: 'Fundida', pesoResultante: 1420.00 },
      { lote: 'LOT-2026-C1', barId: 'BAR-023', packingOrigen: 'PKG-2026-006', proveedorOrigen: 'INVERSIONES TEST C.A.', pesoInicial: 1430.17, estatusBarra: 'Fundida', pesoResultante: 1420.00 },
      { lote: 'LOT-2026-C1', barId: 'BAR-024', packingOrigen: 'PKG-2026-006', proveedorOrigen: 'INVERSIONES TEST C.A.', pesoInicial: 1430.16, estatusBarra: 'Fundida', pesoResultante: 1420.00 },
    ],
  },
];
