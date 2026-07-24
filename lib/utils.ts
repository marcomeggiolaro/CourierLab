// ============================================================
// CourierLab — Utility: cn() helper per classi Tailwind
// Combina clsx + tailwind-merge per gestire classi condizionali
// senza conflitti (es. "p-2 p-4" → "p-4")
// ============================================================
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
