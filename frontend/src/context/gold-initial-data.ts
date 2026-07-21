import type { Supplier, GoldBar, CastingLot, Transaction } from '../types';

export const INITIAL_SUPPLIERS: Supplier[] = [
  { id: 'SUP-01', name: 'Inversiones Auríferas El Callao', code: 'IAC', location: 'Bolívar, El Callao', status: 'ACTIVE' },
  { id: 'SUP-02', name: 'Minera Gold & Silver S.A.', code: 'MGS', location: 'Antioquia, Segovia', status: 'ACTIVE' },
  { id: 'SUP-03', name: 'Consorcio Metalúrgico Bolívar', code: 'CMB', location: 'Ciudad Guayana', status: 'ACTIVE' },
  { id: 'SUP-04', name: 'Metales Nobles del Sur', code: 'MNS', location: 'Arequipa, Chala', status: 'ACTIVE' },
  { id: 'SUP-05', name: 'Corporación Aurífera Caroní', code: 'CAC', location: 'Upata, Bolívar', status: 'ACTIVE' },
  { id: 'SUP-06', name: 'Centro de Fundición Andino', code: 'CFA', location: 'Mérida, Andes', status: 'ACTIVE' },
  { id: 'SUP-07', name: 'Auríferos de Yuruari', code: 'ADY', location: 'El Callao, Bolívar', status: 'ACTIVE' },
  { id: 'SUP-08', name: 'Preciosos de Guayana', code: 'PDG', location: 'Sifontes, Tumeremo', status: 'ACTIVE' },
];

export const INITIAL_GOLD_BARS: GoldBar[] = [
  { code: 'BAR-IAC-9402', supplierId: 'SUP-01', grossWeight: 3500, ley: 913, analytical: 3195.5, expected: 3163.55, recovered: null, leyAg: 42, analyticalAg: 147, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-15T14:30:00Z' },
  { code: 'BAR-IAC-1123', supplierId: 'SUP-01', grossWeight: 4200, ley: 880, analytical: 3696, expected: 3659.04, recovered: null, leyAg: 55, analyticalAg: 231, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-15T14:35:00Z' },
  { code: 'BAR-CAC-2301', supplierId: 'SUP-05', grossWeight: 25100, ley: 920, analytical: 23092, expected: 22861.08, recovered: null, leyAg: 30, analyticalAg: 753, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T09:12:00Z' },
  { code: 'BAR-CMB-8091', supplierId: 'SUP-03', grossWeight: 1200, ley: 840, analytical: 1008, expected: 997.92, recovered: null, leyAg: 65, analyticalAg: 78, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T10:05:00Z' },
  { code: 'BAR-RAO-1001', supplierId: 'SUP-06', grossWeight: 5400, ley: 910, analytical: 4914.0, expected: 4864.86, recovered: null, leyAg: 45, analyticalAg: 243, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T07:15:00Z' },
  { code: 'BAR-RAO-1002', supplierId: 'SUP-06', grossWeight: 6200, ley: 935, analytical: 5797.0, expected: 5739.03, recovered: null, leyAg: 38, analyticalAg: 235.6, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T07:15:00Z' },
  { code: 'BAR-ADY-3041', supplierId: 'SUP-07', grossWeight: 9100, ley: 890, analytical: 8099.0, expected: 8018.01, recovered: null, leyAg: 52, analyticalAg: 473.2, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T08:00:00Z' },
  { code: 'BAR-ADY-3042', supplierId: 'SUP-07', grossWeight: 10400, ley: 902, analytical: 9380.8, expected: 9286.99, recovered: null, leyAg: 48, analyticalAg: 499.2, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T08:00:00Z' },
  { code: 'BAR-PDG-5511', supplierId: 'SUP-08', grossWeight: 15400, ley: 940, analytical: 14476.0, expected: 14331.24, recovered: null, leyAg: 30, analyticalAg: 462, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T09:40:00Z' },
  { code: 'BAR-PDG-5512', supplierId: 'SUP-08', grossWeight: 12100, ley: 928, analytical: 11228.8, expected: 11116.51, recovered: null, leyAg: 32, analyticalAg: 387.2, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T09:40:00Z' },
  { code: 'BAR-IAC-5501', supplierId: 'SUP-01', grossWeight: 8900, ley: 900, analytical: 8010, expected: 7929.9, recovered: null, leyAg: 45, analyticalAg: 400.5, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T10:00:00Z' },
  { code: 'BAR-MGS-9901', supplierId: 'SUP-02', grossWeight: 14200, ley: 915, analytical: 12993, expected: 12863.07, recovered: null, leyAg: 40, analyticalAg: 568, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T10:10:00Z' },
  { code: 'BAR-CAC-7701', supplierId: 'SUP-05', grossWeight: 11100, ley: 912, analytical: 10123.2, expected: 10021.97, recovered: null, leyAg: 35, analyticalAg: 388.5, available: true, status: 'INGRESADO', processId: null, egresadoG: 0, egresoId: null, createdAt: '2026-07-16T10:20:00Z' },
  { code: 'BAR-MGS-7761', supplierId: 'SUP-02', grossWeight: 12500, ley: 925, analytical: 11562.5, expected: 11446.88, recovered: null, leyAg: 30, analyticalAg: 375, available: false, status: 'PROCESANDO', processId: 'LOT-101', egresadoG: 0, egresoId: null, createdAt: '2026-07-14T08:15:00Z' },
  { code: 'BAR-MGS-8291', supplierId: 'SUP-02', grossWeight: 11000, ley: 890, analytical: 9790, expected: 9692.1, recovered: null, leyAg: 40, analyticalAg: 440, available: false, status: 'PROCESANDO', processId: 'LOT-101', egresadoG: 0, egresoId: null, createdAt: '2026-07-14T08:20:00Z' },
  { code: 'BAR-CMB-4829', supplierId: 'SUP-03', grossWeight: 1800, ley: 840, analytical: 1512, expected: 1496.88, recovered: 1610.2, leyAg: 70, analyticalAg: 126, available: false, status: 'COMPLETADO', processId: 'LOT-102', egresadoG: 0, egresoId: null, createdAt: '2026-07-14T10:00:00Z' },
  { code: 'BAR-CMB-5021', supplierId: 'SUP-03', grossWeight: 2500, ley: 950, analytical: 2375, expected: 2351.25, recovered: 2530.3, leyAg: 20, analyticalAg: 50, available: false, status: 'COMPLETADO', processId: 'LOT-102', egresadoG: 0, egresoId: null, createdAt: '2026-07-14T10:05:00Z' },
  { code: 'BAR-MNS-2091', supplierId: 'SUP-04', grossWeight: 6200, ley: 995, analytical: 6169, expected: 6107.31, recovered: 6112.2, leyAg: 2, analyticalAg: 12.4, available: false, status: 'EGRESADO', processId: 'LOT-103', egresadoG: 6112.2, egresoId: 'TX-401', createdAt: '2026-07-13T11:00:00Z' },
];

export const INITIAL_LOTS: CastingLot[] = [
  { id: 'LOT-101', code: 'LOTE-MGS-308', barCodes: ['BAR-MGS-7761', 'BAR-MGS-8291'], createdAt: '2026-07-15T10:00:00Z', status: 'FUNDICION', grossWeightTotal: 23500, analyticalTotal: 21352.5, expectedTotal: 21138.98, recovered: null, operator: 'Ing. Carlos Mendoza', castingTemp: 1085, moldCode: 'CRISOL-04' },
  { id: 'LOT-102', code: 'LOTE-CMB-309', barCodes: ['BAR-CMB-4829', 'BAR-CMB-5021'], createdAt: '2026-07-15T15:30:00Z', status: 'COMPLETADO', grossWeightTotal: 4300, analyticalTotal: 3887, expectedTotal: 3848.13, recovered: 4140.5, operator: 'Ing. Sofía Vergara', castingTemp: 1072, moldCode: 'CRISOL-07' },
  { id: 'LOT-103', code: 'LOTE-MNS-310', barCodes: ['BAR-MNS-2091'], createdAt: '2026-07-14T09:40:00Z', status: 'COMPLETADO', grossWeightTotal: 6200, analyticalTotal: 6169, expectedTotal: 6107.31, recovered: 6112.2, operator: 'Ing. Carlos Mendoza', castingTemp: 1090, moldCode: 'CRISOL-01' },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 'TX-301', type: 'IN', clientName: 'Inversiones Auríferas El Callao', clientId: 'SUP-01', weight: 7700, barsCount: 2, barCodes: ['BAR-IAC-9402', 'BAR-IAC-1123'], date: '2026-07-15T14:35:00Z', reference: 'REF-IN-940', status: 'CONFIRMADO' },
  { id: 'TX-302', type: 'IN', clientName: 'Minera Gold & Silver S.A.', clientId: 'SUP-02', weight: 23500, barsCount: 2, barCodes: ['BAR-MGS-7761', 'BAR-MGS-8291'], date: '2026-07-14T08:20:00Z', reference: 'REF-IN-512', status: 'CONFIRMADO' },
  { id: 'TX-303', type: 'IN', clientName: 'Consorcio Metalúrgico Bolívar', clientId: 'SUP-03', weight: 4300, barsCount: 2, barCodes: ['BAR-CMB-4829', 'BAR-CMB-5021'], date: '2026-07-14T10:05:00Z', reference: 'REF-IN-109', status: 'CONFIRMADO' },
  { id: 'TX-304', type: 'IN', clientName: 'Centro de Fundición Andino', clientId: 'SUP-06', weight: 11600, barsCount: 2, barCodes: ['BAR-RAO-1001', 'BAR-RAO-1002'], date: '2026-07-16T07:15:00Z', reference: 'REF-IN-702', status: 'CONFIRMADO' },
  { id: 'TX-305', type: 'IN', clientName: 'Auríferos de Yuruari', clientId: 'SUP-07', weight: 19500, barsCount: 2, barCodes: ['BAR-ADY-3041', 'BAR-ADY-3042'], date: '2026-07-16T08:00:00Z', reference: 'REF-IN-703', status: 'CONFIRMADO' },
  { id: 'TX-306', type: 'IN', clientName: 'Preciosos de Guayana', clientId: 'SUP-08', weight: 27500, barsCount: 2, barCodes: ['BAR-PDG-5511', 'BAR-PDG-5512'], date: '2026-07-16T09:40:00Z', reference: 'REF-IN-704', status: 'CONFIRMADO' },
  { id: 'TX-401', type: 'OUT', clientName: 'Metales Nobles del Sur', clientId: 'SUP-04', weight: 6112.2, barsCount: 1, barCodes: ['BAR-MNS-2091'], lotIds: ['LOT-103'], date: '2026-07-16T08:30:00Z', reference: 'REF-OUT-401', status: 'CONFIRMADO' },
  { id: 'TX-402', type: 'OUT', clientName: 'Inversiones Auríferas El Callao', clientId: 'SUP-01', weight: 8500.0, barsCount: 1, barCodes: ['BAR-IAC-5501'], lotIds: [], date: '2026-07-16T09:00:00Z', reference: 'REF-OUT-402', status: 'CONFIRMADO' },
  { id: 'TX-403', type: 'OUT', clientName: 'Minera Gold & Silver S.A.', clientId: 'SUP-02', weight: 12000.0, barsCount: 0, barCodes: [], lotIds: [], date: '2026-07-16T09:15:00Z', reference: 'REF-OUT-403', status: 'CONFIRMADO' },
  { id: 'TX-404', type: 'OUT', clientName: 'Corporación Aurífera Caroní', clientId: 'SUP-05', weight: 15000.0, barsCount: 0, barCodes: [], lotIds: [], date: '2026-07-16T09:45:00Z', reference: 'REF-OUT-404', status: 'CONFIRMADO' },
  { id: 'TX-405', type: 'OUT', clientName: 'Centro de Fundición Andino', clientId: 'SUP-06', weight: 6000.0, barsCount: 0, barCodes: [], lotIds: [], date: '2026-07-16T10:10:00Z', reference: 'REF-OUT-405', status: 'CONFIRMADO' },
  { id: 'TX-406', type: 'OUT', clientName: 'Auríferos de Yuruari', clientId: 'SUP-07', weight: 9000.0, barsCount: 0, barCodes: [], lotIds: [], date: '2026-07-16T10:20:00Z', reference: 'REF-OUT-406', status: 'CONFIRMADO' },
];
