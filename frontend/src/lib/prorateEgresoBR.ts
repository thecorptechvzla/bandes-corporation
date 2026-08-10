import type { MaterialExit } from '@/types/api';

interface LotBarLite {
  clientId?: string | null;
  grossWeight?: number | string | null;
}

interface LotDetailLite {
  weightAported?: number | string | null;
  lot?: {
    recovered?: number | string | null;
    process?: { client?: { id?: string | null } | null } | null;
  } | null;
  bars?: LotBarLite[];
}

export interface ExitLite {
  bars?: LotBarLite[];
  exitDetails?: LotDetailLite[];
}

const num = (v?: number | string | null): number => {
  const n = Number(v ?? 0);
  return Number.isFinite(n) ? n : 0;
};

export function lotGrossTotal(detail: LotDetailLite): number {
  const barsGross = (detail.bars ?? []).reduce((s, b) => s + num(b.grossWeight), 0);
  if (barsGross > 0) return barsGross;
  return num(detail.weightAported);
}

export function lotBrTotal(detail: LotDetailLite): number {
  const recovered = num(detail.lot?.recovered);
  if (recovered > 0) return recovered;
  return lotGrossTotal(detail);
}

export function clientLotGross(detail: LotDetailLite, clientId: string): number {
  return (detail.bars ?? []).reduce(
    (s, b) => (b.clientId === clientId ? s + num(b.grossWeight) : s),
    0,
  );
}

export function computeClientBRFromLot(detail: LotDetailLite, clientId: string): number {
  const grossTotal = lotGrossTotal(detail);
  const grossCliente = clientLotGross(detail, clientId);
  if (grossTotal <= 0 || grossCliente <= 0) return 0;
  return (lotBrTotal(detail) * grossCliente) / grossTotal;
}

export function computeClientEgresoBR(exit: ExitLite | MaterialExit, clientId: string): number {
  let br = 0;

  for (const b of exit.bars ?? []) {
    if (b.clientId === clientId) br += num(b.grossWeight);
  }

  for (const d of exit.exitDetails ?? []) {
    br += computeClientBRFromLot(d, clientId);
  }

  return br;
}