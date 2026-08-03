/**
 * CourierLab — Excel Export Service
 *
 * Genera il file Excel di output con le coordinate geocodificate e le
 * distanze dai punti SPARO/Palmare usando ExcelJS (supporto completo
 * per stili e colori celle in formato .xlsx).
 *
 * Regola di evidenziazione:
 *   Distanza > 400 m  →  sfondo rosso chiaro (#FFCCCC)
 *   Distanza ≤ 400 m  →  sfondo verde chiaro (#CCFFCC)
 *   Non geocodificato  →  sfondo arancione chiaro (#FFE5CC)
 */
import ExcelJS from 'exceljs';
import type { CellValue } from '@/lib/excel/reader';
import type { GeocodingRowResult } from '@/components/geocoding/GeocodeResults';

// ─── Colori ───────────────────────────────────────────────────────────────────

const COLOR_OVER_400M   = 'FFFFCCCC'; // rosso chiaro   — distanza > 400 m
const COLOR_UNDER_400M  = 'FFCCFFCC'; // verde chiaro   — distanza ≤ 400 m
const COLOR_NO_GEOCODE  = 'FFFFE5CC'; // arancione      — non geocodificato
const COLOR_HEADER      = 'FF2563EB'; // blu primario   — intestazioni
const DISTANCE_THRESHOLD_KM = 0.4;   // 400 metri

// ─── Funzione principale ──────────────────────────────────────────────────────

/**
 * Genera e scarica nel browser il file Excel con i risultati.
 *
 * @param headers        Intestazioni originali dell'Excel caricato
 * @param rows           Righe originali dell'Excel (tutte, non solo preview)
 * @param geocodingResults Risultati del geocoding in ordine di riga
 * @param fileName       Nome del file da scaricare (senza .xlsx)
 */
export async function exportToExcel(
  headers: string[],
  rows: CellValue[][],
  geocodingResults: GeocodingRowResult[],
  fileName: string = 'KmC_risultati',
): Promise<void> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CourierLab';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Risultati', {
    views: [{ state: 'frozen', ySplit: 1 }], // intestazione fissa
  });

  // ── Intestazioni ────────────────────────────────────────────────────────
  const extraHeaders = [
    'Lat (geocodificata)',
    'Lng (geocodificata)',
    'Distanza SPARO (km)',
    'Stato geocoding',
    'Link Percorso Maps',
  ];

  const headerRow = sheet.addRow([...headers, ...extraHeaders]);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLOR_HEADER },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FF1D4ED8' } },
    };
  });

  // Larghezze colonne
  sheet.columns = [
    ...headers.map(() => ({ width: 22 })),
    { width: 18 }, // Lat
    { width: 18 }, // Lng
    { width: 20 }, // Distanza
    { width: 18 }, // Stato
    { width: 28 }, // Link Maps
  ];

  // ── Righe dati ──────────────────────────────────────────────────────────
  for (let i = 0; i < rows.length; i++) {
    const geo = geocodingResults[i];
    const originalCells = rows[i].map(cellToExcelValue);

    const lat  = geo?.lat ?? null;
    const lng  = geo?.lng ?? null;
    const dist = geo?.distanceKm;
    const sparoLat = geo?.sparoLat ?? null;
    const sparoLng = geo?.sparoLng ?? null;

    const latVal  = lat  !== null ? parseFloat(lat.toFixed(6))   : 'NO GPS';
    const lngVal  = lng  !== null ? parseFloat(lng.toFixed(6))   : 'NO GPS';
    const distVal = dist !== undefined ? parseFloat(dist.toFixed(3)) : 'NO GPS';
    const statoVal = geo?.status ?? 'NO GPS';

    const dataRow = sheet.addRow([
      ...originalCells,
      latVal,
      lngVal,
      distVal,
      statoVal,
      '',  // Link Maps — impostato sotto come hyperlink
    ]);

    // ── Colore sfondo righe originali in base alla distanza ─────────────
    let bgColor: string;
    if (dist === undefined || geo?.status === 'failed' || geo?.status === 'skipped') {
      bgColor = COLOR_NO_GEOCODE;
    } else if (dist > DISTANCE_THRESHOLD_KM) {
      bgColor = COLOR_OVER_400M;
    } else {
      bgColor = COLOR_UNDER_400M;
    }

    // Applica sfondo alle colonne originali
    for (let c = 1; c <= originalCells.length; c++) {
      const cell = dataRow.getCell(c);
      cell.font = { size: 10 };
      cell.alignment = { vertical: 'middle' };
    }

    // ── Stile colonne extra (Lat, Lng, Distanza, Stato) ─────────────────
    const extraStart = originalCells.length + 1;
    const extraValues = [latVal, lngVal, distVal, statoVal];
    const numFmts    = ['0.000000', '0.000000', '0.000', '@'];

    extraValues.forEach((val, idx) => {
      const cell = dataRow.getCell(extraStart + idx);
      const isDistanzaCol = idx === 2; // solo la colonna Distanza riceve colore

      if (val === 'NO GPS') {
        // Sfondo bianco, testo rosso grassetto, centrato
        cell.fill  = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } };
        cell.font  = { size: 10, bold: true, color: { argb: 'FFCC0000' } };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      } else {
        // Colore sfondo solo sulla colonna Distanza
        if (isDistanzaCol) {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };
        }
        cell.font  = { size: 10 };
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
        if (typeof val === 'number') cell.numFmt = numFmts[idx];
      }
    });

    // ── Colonna Link Percorso Maps ───────────────────────────────────────
    const mapsCell = dataRow.getCell(extraStart + 4);
    if (lat !== null && lng !== null) {
      const mapsUrl =
        sparoLat !== null && sparoLng !== null
          ? `https://www.google.com/maps/dir/${sparoLat},${sparoLng}/${lat},${lng}`
          : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
      mapsCell.value = { text: 'Vedi percorso', hyperlink: mapsUrl };
      mapsCell.font  = { size: 10, color: { argb: 'FF2563EB' }, underline: true };
      mapsCell.alignment = { vertical: 'middle', horizontal: 'center' };
    } else {
      mapsCell.value = '—';
      mapsCell.font  = { size: 10, color: { argb: 'FFAAAAAA' } };
      mapsCell.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  }

  // ── Legenda ─────────────────────────────────────────────────────────────
  const legendSheet = workbook.addWorksheet('Legenda');
  legendSheet.addRow(['Colore', 'Significato']);
  const legend = [
    [COLOR_OVER_400M,  'Distanza > 400 m dal punto SPARO/Palmare'],
    [COLOR_UNDER_400M, 'Distanza ≤ 400 m dal punto SPARO/Palmare'],
    [COLOR_NO_GEOCODE, 'Indirizzo non geocodificato'],
  ];
  legend.forEach(([color, label]) => {
    const row = legendSheet.addRow(['', label]);
    row.getCell(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: color } };
  });
  legendSheet.getColumn(2).width = 50;

  // ── Download nel browser ─────────────────────────────────────────────────
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${fileName}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

// ─── Utilità ──────────────────────────────────────────────────────────────────

/** Converte un valore cella Excel in un valore compatibile con ExcelJS */
function cellToExcelValue(
  v: CellValue,
): string | number | boolean | Date | null {
  if (v === null || v === undefined) return null;
  if (v instanceof Date) return v;
  if (typeof v === 'number' || typeof v === 'boolean') return v;
  return String(v);
}

/** Link Google Maps — pin destinazione */
export function buildGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
}

/** Link Google Maps — percorso da SPARO a destinazione */
export function buildGoogleMapsRouteUrl(
  sparoLat: number, sparoLng: number,
  destLat: number, destLng: number,
): string {
  return `https://www.google.com/maps/dir/${sparoLat},${sparoLng}/${destLat},${destLng}`;
}
