export interface CompositionEntry {
  clientId: string;
  clientName: string;
  weight: number;
  percentage: number;
}

export function computeComposition(
  bars: { clientId: string; clientName?: string; fineWeight: number }[],
): CompositionEntry[] {
  const byClient = new Map<string, { clientId: string; clientName: string; weight: number }>();
  let total = 0;

  for (const b of bars) {
    const weight = Number(b.fineWeight) || 0;
    total += weight;
    const prev = byClient.get(b.clientId) || {
      clientId: b.clientId,
      clientName: b.clientName || 'DESCONOCIDO',
      weight: 0,
    };
    prev.weight += weight;
    byClient.set(b.clientId, prev);
  }

  return Array.from(byClient.values()).map((c) => ({
    ...c,
    percentage: total > 0 ? Number(((c.weight / total) * 100).toFixed(2)) : 0,
  }));
}

export function isMixedLot(bars: { clientId: string }[]): boolean {
  return new Set(bars.map((b) => b.clientId)).size > 1;
}

export function formatComposition(composition: CompositionEntry[], separator = ' · '): string {
  return composition.map((c) => `${c.clientName} ${c.percentage}%`).join(separator);
}
