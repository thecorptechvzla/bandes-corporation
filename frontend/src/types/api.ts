export type ClientRole = 'PROVEEDOR' | 'CLIENTE' | 'AMBOS';

export interface Client {
  id: string;
  rif: string;
  name: string;
  contactInfo?: string;
  role: ClientRole;
  createdAt: string;
  updatedAt: string;
}

export interface Process {
  id: string;
  name: string;
  clientId: string;
  isMixed?: boolean;
  status: 'OPEN' | 'CLOSED' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
  client?: Client;
  lots?: Lot[];
}

export interface Lot {
  id: string;
  name: string;
  processId: string;
  operator?: string;
  castingTemp?: number;
  moldCode?: string;
  recovered?: number | null;
  purity?: number | null;
  fineWeight?: number | null;
  recoveryAt?: string | null;
  photoUrl?: string | null;
  leyAg?: number | null;
  createdAt: string;
  updatedAt: string;
  process?: Process;
  bars?: Bar[];
  availableWeight?: number;
  barCount?: number;
}

export interface Bar {
  id: string;
  barNumber: string;
  spGrossWeight?: number | null;
  spPurity?: number | null;
  grossWeight: number;
  purity: number;
  fineWeight: number;
  leyAg?: number | null;
  fineWeightAg?: number | null;
  photoUrl?: string | null;
  status: 'POR_VALIDAR' | 'IN_STOCK' | 'PROCESANDO' | 'COMPLETADO' | 'EXITED';
  createdAt: string;
  updatedAt: string;
  clientId: string;
  exitDetailId?: string | null;
  exitId?: string | null;
  lotId?: string | null;
  client?: { id: string; name: string };
  packingId?: string | null;
}

export interface MaterialExit {
  id: string;
  destination: string;
  clientId?: string | null;
  client?: { id: string; name: string } | null;
  totalWeight: number;
  createdAt: string;
  exitDetails: ExitDetail[];
  bars?: Bar[];
}

export interface ExitDetail {
  id: string;
  weightAported: number;
  exitId: string;
  lotId: string;
  lot?: Lot & { process: Process & { client: Client } };
  bars?: { id: string; barNumber: string; grossWeight: number; purity?: number; fineWeight?: number; clientId?: string; client?: { id: string; name: string } }[];
}

export interface BalanceResponse {
  clientId: string;
  clientName: string;
  totalReceived: number;
  totalExited: number;
  inStock: number;
  currentBalance: number;
}

export interface AvailableLot {
  id: string;
  name: string;
  availableWeight: number;
  grossWeight?: number;
  purity?: number | null;
  barCount: number;
  isMixed?: boolean;
  composition?: { clientId: string; clientName: string; weight: number; percentage: number }[];
}

export interface AvailableLotsResponse {
  id: string;
  name: string;
  status: 'CLOSED';
  clientId: string;
  lots: AvailableLot[];
}

export interface CreateMaterialExitRequest {
  destination: string;
  clientId?: string;
  lotIds?: string[];
  barIds?: string[];
}

export interface CreateBarRequest {
  barNumber: string;
  grossWeight: number;
  purity: number;
  clientId: string;
  leyAg?: number;
  packingId?: string;
}

export interface UpdateBarRequest {
  lotId?: string | null;
  status?: 'POR_VALIDAR' | 'IN_STOCK' | 'PROCESANDO' | 'COMPLETADO' | 'EXITED';
  grossWeight?: number;
  purity?: number;
  leyAg?: number;
  photoUrl?: string;
}

export interface CreateProcessRequest {
  clientId: string;
  barIds: string[];
  operator: string;
  moldCode: string;
  castingTemp?: number;
}

export interface UpdateProcessRequest {
  name?: string;
  status?: 'OPEN' | 'CLOSED';
}

export interface CreateLotRequest {
  name: string;
  processId: string;
  operator?: string;
  castingTemp?: number;
  moldCode?: string;
}

export interface UpdateLotRequest {
  name?: string;
  operator?: string;
  castingTemp?: number;
  moldCode?: string;
  recovered?: number | null;
  purity?: number | null;
  fineWeight?: number | null;
  recoveryAt?: string | null;
  photoUrl?: string | null;
  leyAg?: number | null;
}

export interface CreateClientRequest {
  rif: string;
  name: string;
  contactInfo?: string;
  role?: ClientRole;
}

export interface DashboardMetrics {
  oroRecibido: {
    fineWeight: number;
    barCount: number;
  };
  oroEnProceso: {
    fineWeight: number;
    barCount: number;
  };
  oroEnBoveda: {
    fineWeight: number;
    fundido: number;
    sinFundir: number;
  };
  porRefundir: {
    fineWeight: number;
  };
  merma: {
    gramos: number;
    porcentaje: number;
  };
  dailyFlow: { date: string; ingresos: number; egresos: number }[];
}

export interface BulkUploadRecord {
  id: string;
  fileName: string;
  clientId: string;
  totalRows: number;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
  status: 'COMPLETED' | 'PARTIAL' | 'FAILED';
  createdAt: string;
}

export interface BulkUploadResult {
  packingId?: string;
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

export type PackingStatus = 'PENDING' | 'VALIDATED';

export interface Packing {
  id: string;
  fileName: string;
  clientId: string;
  packingNumber?: number | null;
  totalRows: number;
  created: number;
  skipped: number;
  errors?: { row: number; message: string }[];
  status: PackingStatus;
  createdAt: string;
  updatedAt: string;
  client?: { id: string; name: string };
  bars?: Bar[];
  _count?: { bars: number; pending: number; validated: number };
}

export interface AvailableLotsGlobalResponse {
  id: string;
  name: string;
  status: 'CLOSED';
  clientId: string;
  clientName: string;
  lots: AvailableLot[];
}

/* ─── Dashboard Computed Types ─── */

export interface ClientBalance {
  id: string;
  name: string;
  ingresoBruto: number;
  fa: number;
  leyAu: number;
  ingreso: number;
  r: number;
  sinFundir: number;
  egresos: number;
  egresoBI: number;
  egresoBR: number;
  balance: number;
  mermaG: number;
  mermaPct: number;
}
