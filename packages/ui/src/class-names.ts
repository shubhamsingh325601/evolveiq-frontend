import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Joins Tailwind classes and lets a caller's className win over the default. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
