import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merges Tailwind classes safely — Kowalski pattern */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatted currency for VES / USD display */
export function formatCurrency(
  amount: number,
  currency: "USD" | "VES" = "USD"
): string {
  return new Intl.NumberFormat("es-VE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

/** Sleep utility for optimistic UI patterns */
export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

/** Retry wrapper for unreliable local server calls */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  delayMs = 1200
): Promise<T> {
  let lastError: Error;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err as Error;
      if (attempt < maxAttempts) await sleep(delayMs * attempt);
    }
  }
  throw lastError!;
}
