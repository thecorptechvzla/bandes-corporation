const LOCALE = 'es-AR';

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatWeight(value: number, decimals?: number): string {
  const dec = decimals ?? 2;
  return `${formatNumber(value, dec)} g`;
}

export function cleanWeight(val: string): number {
  if (!val) return 0;
  const normalized = val.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(normalized);
  return isNaN(num) ? 0 : num;
}

export function formatRif(raw: string): string {
  if (raw.length !== 10) return raw;
  return `${raw[0]}-${raw.slice(1, 9)}-${raw[9]}`;
}

export function formatRifDisplay(digits: string): string {
  const d = digits.replace(/\D/g, '');
  if (!d) return 'J-';
  return d.length < 9 ? `J-${d}` : `J-${d.slice(0, 8)}-${d[8]}`;
}

export function sanitizeRifInput(val: string): string {
  return val.replace(/^J/i, '').replace(/\D/g, '').slice(0, 9);
}
