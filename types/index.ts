/**
 * CourierLab — Tipi TypeScript condivisi
 *
 * Contiene i tipi di alto livello condivisi a livello di applicazione.
 * I tipi specifici dei moduli (FileInfo, SheetData, DetectedColumnMap…)
 * sono definiti nel modulo corrispondente in lib/.
 */

// ─── Pipeline di elaborazione ─────────────────────────────────────────────────

export type RowStatus = 'pending' | 'geocoding' | 'routing' | 'done' | 'error';

export type PipelineStage =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'geocoding'
  | 'routing'
  | 'done'
  | 'error';

export interface PipelineState {
  stage: PipelineStage;
  /** Avanzamento 0–100 */
  progress: number;
  processedRows: number;
  totalRows: number;
  message: string;
  errors: string[];
}

// ─── Riga elaborata ────────────────────────────────────────────────────────────

/** Riga dell'Excel dopo l'elaborazione completa (geocoding + routing) */
export interface ProcessedRow {
  /** Indice originale 1-based */
  rowIndex: number;
  /** Dati originali chiave → valore */
  data: Record<string, string | number | boolean | Date | null>;
  /** Indirizzo composto per il geocoding */
  fullAddress?: string;
  lat?: number;
  lng?: number;
  /** Distanza stradale in km */
  distanceKm?: number;
  /** Link Google Maps */
  mapsUrl?: string;
  status: RowStatus;
  error?: string;
}

// ─── SSE Events (Milestone 3) ─────────────────────────────────────────────────

export interface ProgressEvent {
  type: 'progress' | 'complete' | 'error';
  stage: PipelineStage;
  progress: number;
  processedRows: number;
  totalRows: number;
  message: string;
}

