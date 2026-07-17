import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function parseWeight(value: string): number {
  return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}
