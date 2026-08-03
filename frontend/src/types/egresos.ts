export interface UnifiedItem {
  type: 'lot' | 'bar';
  id: string;
  code: string;
  provider: string;
  clientId: string;
  clientName: string;
  clientRif: string;
  pesoBruto: number | null;
  leyAu: number | null;
  pesoFino: number;
  barCount?: number;
  isMixed?: boolean;
  composition?: { clientId: string; clientName: string; weight: number; percentage: number }[];
}
