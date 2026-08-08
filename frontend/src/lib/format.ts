const LOCALE = 'es-ES';

export function formatNumber(value: number, decimals: number = 2): string {
  return value.toLocaleString(LOCALE, {
    useGrouping: true,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatWeight(value: number, decimals?: number): string {
  const dec = decimals ?? 2;
  return `${formatNumber(value, dec)} g`;
}

export function truncateLey(value: number): number {
  return Math.trunc(value * 100 + 1e-9) / 100;
}

export function formatLey(value: number): string {
  return truncateLey(value).toLocaleString(LOCALE, {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
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

let cachedLogoBase64: string | null = null;

export async function fetchLogoAsBase64(): Promise<string> {
  if (cachedLogoBase64) return cachedLogoBase64;
  const res = await fetch('/BandesLogo.png');
  const blob = await res.blob();
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
  cachedLogoBase64 = base64;
  return base64;
}
