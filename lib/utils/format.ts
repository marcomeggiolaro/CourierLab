/**
 * CourierLab — Formatting Utilities
 * Funzioni di formattazione condivise in tutta l'applicazione.
 */

/**
 * Formatta una dimensione in byte in una stringa leggibile.
 * Es: 512 B · 1.5 KB · 2.34 MB
 */
export function formatFileSize(bytes: number): string {
  if (bytes < 1_024) return `${bytes} B`;
  if (bytes < 1_024 * 1_024) return `${(bytes / 1_024).toFixed(1)} KB`;
  if (bytes < 1_024 * 1_024 * 1_024)
    return `${(bytes / (1_024 * 1_024)).toFixed(2)} MB`;
  return `${(bytes / (1_024 * 1_024 * 1_024)).toFixed(2)} GB`;
}

/**
 * Formatta una data in formato italiano: dd/mm/yyyy, HH:MM
 */
export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('it-IT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Formatta un numero con separatori delle migliaia (formato italiano).
 * Es: 1234567 → "1.234.567"
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat('it-IT').format(n);
}
