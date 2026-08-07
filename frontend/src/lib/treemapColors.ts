'use client';

/* ═══════════════════════════════════════════════════════════
   TREEMAP COLORS — Paletas secuenciales por propósito
   ═══════════════════════════════════════════════════════════

   Cada rampa está ordenada de OSCURO a CLARO. El valor más alto
   de la serie recibe el tono más oscuro/saturado y los valores
   menores se aclaran de forma proporcional (interpolación lineal).

   Los ramps se mantienen dentro de un rango medio-oscuro para que
   el texto blanco conserve contraste legible en todos los bloques.
   ═══════════════════════════════════════════════════════════ */

/** Verdes (ingresos / masa recibida). */
export const INGRESOS_RAMP = [
  '#022c22',
  '#064e3b',
  '#065f46',
  '#047857',
  '#059669',
];

/** Azul petróleo / teal (egresos / masa despachada). */
export const EGRESOS_RAMP = [
  '#042f2e',
  '#134e4a',
  '#115e59',
  '#0f766e',
  '#0d9488',
];

/**
 * Interpola linealmente `value/maxValue` sobre la rampa dada.
 * - intensity = 1 (mayor valor)  -> stop 0 (más oscuro/saturado)
 * - intensity = 0 (valor nulo)   -> último stop (más claro)
 * Protegido contra división por cero cuando maxValue es 0.
 */
export function sequentialFill(
  value: number,
  maxValue: number,
  ramp: string[] = INGRESOS_RAMP,
): string {
  const intensity = maxValue > 0 ? value / maxValue : 0;
  const clamped = Math.min(1, Math.max(0, intensity));
  const position = clamped * (ramp.length - 1);
  const lower = Math.floor(position);
  const upper = Math.min(ramp.length - 1, lower + 1);
  const t = position - lower;
  if (lower === upper) return ramp[lower];

  const from = ramp[lower];
  const to = ramp[upper];
  const a = parseInt(from.slice(1), 16);
  const b = parseInt(to.slice(1), 16);
  const r = Math.round(((a >> 16) & 0xff) + (((b >> 16) & 0xff) - ((a >> 16) & 0xff)) * t);
  const g = Math.round(((a >> 8) & 0xff) + (((b >> 8) & 0xff) - ((a >> 8) & 0xff)) * t);
  const bl = Math.round((a & 0xff) + ((b & 0xff) - (a & 0xff)) * t);
  return `#${((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)}`;
}
