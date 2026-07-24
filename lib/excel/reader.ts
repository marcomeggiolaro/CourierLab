/**
 * CourierLab — Excel Reader Service
 *
 * Gestisce la lettura e il parsing di file Excel (.xlsx / .xls)
 * tramite la libreria xlsx. Espone tipi e utility per lavorare
 * con i dati del workbook in modo type-safe.
 */
import * as XLSX from 'xlsx';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Valore possibile in una cella Excel */
export type CellValue = string | number | boolean | Date | null;

/** Re-export del tipo WorkBook per evitare import diretti di xlsx nei consumer */
export type ExcelWorkbook = XLSX.WorkBook;

/** Metadati del file caricato */
export interface FileInfo {
  /** Nome originale del file */
  name: string;
  /** Dimensione in byte */
  size: number;
  /** Timestamp di caricamento (impostato dal client, non dal filesystem) */
  uploadedAt: Date;
  /** Numero di fogli presenti */
  sheetCount: number;
  /** Lista dei nomi dei fogli */
  sheets: string[];
}

/** Dati estratti da un singolo foglio */
export interface SheetData {
  /** Intestazioni di colonna (prima riga) */
  headers: string[];
  /** Righe di dati (esclude la riga header) */
  rows: CellValue[][];
  /** Numero totale di righe dati (esclude header e righe vuote) */
  totalRows: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

/** Nome canonico del foglio da cercare in automatico */
export const DEFAULT_SHEET_NAME = 'DB DATI';

// ─── Core Functions ───────────────────────────────────────────────────────────

/**
 * Legge un File Excel e restituisce metadati + workbook parsato.
 * Il workbook deve essere mantenuto in un ref lato client per evitare
 * re-parsing ad ogni cambio di foglio.
 */
export async function readExcelFile(file: File): Promise<{
  fileInfo: FileInfo;
  workbook: ExcelWorkbook;
}> {
  const buffer = await file.arrayBuffer();

  // Parsing con supporto date native
  const workbook = XLSX.read(new Uint8Array(buffer), {
    type: 'array',
    cellDates: true,
  });

  const fileInfo: FileInfo = {
    name: file.name,
    size: file.size,
    uploadedAt: new Date(),
    sheetCount: workbook.SheetNames.length,
    sheets: [...workbook.SheetNames],
  };

  return { fileInfo, workbook };
}

/**
 * Estrae i dati da un foglio specifico del workbook.
 * La prima riga viene usata come intestazioni; le righe completamente
 * vuote vengono filtrate automaticamente.
 */
export function extractSheetData(
  workbook: ExcelWorkbook,
  sheetName: string,
): SheetData {
  const sheet = workbook.Sheets[sheetName];

  if (!sheet) {
    throw new Error(`Foglio "${sheetName}" non trovato nel file.`);
  }

  // sheet_to_json con header:1 restituisce array di array
  const rawData = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
  }) as CellValue[][];

  if (rawData.length === 0) {
    return { headers: [], rows: [], totalRows: 0 };
  }

  // Prima riga = intestazioni
  const headers = rawData[0].map((cell) =>
    cell !== null && cell !== undefined ? String(cell).trim() : '',
  );

  // Righe rimanenti = dati
  const allRows = rawData.slice(1) as CellValue[][];

  // Filtra righe completamente vuote
  const nonEmptyRows = allRows.filter((row) =>
    row.some(
      (cell) =>
        cell !== null &&
        cell !== undefined &&
        String(cell).trim() !== '',
    ),
  );

  return {
    headers,
    rows: nonEmptyRows,
    totalRows: nonEmptyRows.length,
  };
}

/**
 * Cerca il foglio di default "DB DATI" (case-insensitive) nella lista.
 * Restituisce il nome originale (con la capitalizzazione del file) o null.
 */
export function findDefaultSheet(sheets: string[]): string | null {
  const target = DEFAULT_SHEET_NAME.toLowerCase().trim();
  return sheets.find((s) => s.toLowerCase().trim() === target) ?? null;
}

/**
 * Valida che un File sia un Excel valido per estensione o MIME type.
 * Necessario perché alcuni OS restituiscono MIME type generici.
 */
export function isValidExcelFile(file: File): boolean {
  const validMimeTypes = new Set([
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/octet-stream',
    '', // Alcuni browser non impostano il MIME type
  ]);

  const validExtensions = ['.xlsx', '.xls'];

  const hasValidMime = validMimeTypes.has(file.type);
  const hasValidExt = validExtensions.some((ext) =>
    file.name.toLowerCase().endsWith(ext),
  );

  return hasValidMime || hasValidExt;
}
