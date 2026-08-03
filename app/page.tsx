'use client';
/**
 * CourierLab — Dashboard principale
 *
 * Orchestratore del workflow di importazione:
 *   1. Upload file Excel (drag & drop / click)
 *   2. Selezione foglio (auto-detect "DB DATI")
 *   3. Preview dati (prime 10 righe)
 *   4. Riconoscimento automatico colonne
 *   5. [M3] Geocoding → [M4] Routing → [M5] Export
 */

import { useState, useRef, useCallback } from 'react';
import { MapPin } from 'lucide-react';

import StepIndicator, {
  type WorkflowStep,
} from '@/components/workflow/StepIndicator';
import FileDropzone from '@/components/upload/FileDropzone';
import FileInfoCard from '@/components/upload/FileInfoCard';
import SheetSelector from '@/components/upload/SheetSelector';
import DataTable from '@/components/preview/DataTable';
import ColumnMapDisplay from '@/components/preview/ColumnMapDisplay';
import GeocodeResults, {
  type GeocodingRowResult,
} from '@/components/geocoding/GeocodeResults';
import AddressSelectionModal from '@/components/geocoding/AddressSelectionModal';

import {
  readExcelFile,
  extractSheetData,
  findDefaultSheet,
  type FileInfo,
  type SheetData,
  type ExcelWorkbook,
  type CellValue,
} from '@/lib/excel/reader';
import {
  detectColumns,
  getMissingRequiredColumns,
  type DetectedColumnMap,
} from '@/lib/parser/column-detector';
import { buildSearchQuery } from '@/lib/geocoding/utils';
import type { GeocodingAddress, GeocodingResult, GeocodingCandidate } from '@/lib/geocoding/types';
import { exportToExcel } from '@/lib/export/excel';
import { formatNumber } from '@/lib/utils/format';

// ─── Tipi locali ──────────────────────────────────────────────────────────────

type AppPhase = 'upload' | 'loaded' | 'error';
type GeocodingPhase = 'idle' | 'running' | 'done';

// ─── Utilità indirizzo ────────────────────────────────────────────────────────

/**
 * Estrae un indirizzo strutturato da una riga dell'Excel usando la mappa
 * delle colonne riconosciute automaticamente.
 */
function buildAddressFromRow(
  row: CellValue[],
  headers: string[],
  detectedColumns: DetectedColumnMap,
): GeocodingAddress {
  const get = (type: keyof DetectedColumnMap): string | undefined => {
    const colName = detectedColumns[type];
    if (!colName) return undefined;
    const idx = headers.indexOf(colName);
    if (idx < 0) return undefined;
    const val = row[idx];
    if (val === null || val === undefined) return undefined;
    const str = String(val).trim();
    return str || undefined;
  };

  const streetNumber = get('streetNumber');

  // Alcune colonne Excel chiamate "N" (Nord) vengono rilevate come numero civico
  // ma contengono coordinate geografiche (es. 38.66419601). Le escludiamo:
  // un numero civico reale non ha mai 4+ cifre decimali.
  // Escludiamo anche i valori zero (0, 0.0) che alcune celle Excel usano come placeholder.
  const isCoordinate = (v?: string): boolean => {
    if (!v) return false;
    const t = v.trim();
    if (/^0(\.0*)?$/.test(t)) return true;          // 0, 0.0, 0.00 → non è un civico
    return /^-?\d+\.\d{4,}$/.test(t);               // 38.66419601 → è una coordinata
  };

  return {
    street: get('address'),
    streetNumber: isCoordinate(streetNumber) ? undefined : streetNumber,
    postalCode: get('cap'),
    city: get('city'),
    province: get('province'),
    country: 'Italy',
  };
}

/**
 * Estrae le coordinate del punto SPARO/Palmare dalla riga Excel,
 * usando le colonne rilevate automaticamente come sparoLat/sparoLng.
 */
function extractSparoCoords(
  row: CellValue[],
  headers: string[],
  detectedColumns: DetectedColumnMap,
): { lat: number | null; lng: number | null } {
  const getNum = (type: keyof DetectedColumnMap): number | null => {
    const colName = detectedColumns[type];
    if (!colName) return null;
    const idx = headers.indexOf(colName);
    if (idx < 0) return null;
    const val = row[idx];
    if (val === null || val === undefined) return null;
    const n = typeof val === 'number' ? val : parseFloat(String(val));
    return isNaN(n) ? null : n;
  };

  return { lat: getNum('sparoLat'), lng: getNum('sparoLng') };
}

// ─── Fetch con retry automatico ──────────────────────────────────────────────

/**
 * Esegue una fetch con retry automatico su errori di rete, 5xx e 429.
 * - 429 (rate limit): backoff esponenziale partendo da 5 s
 * - 5xx / errore rete: backoff esponenziale partendo da baseDelayMs
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  baseDelayMs = 2000,
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const resp = await fetch(url, options);
      if (resp.status === 429) {
        if (attempt < maxRetries) {
          await new Promise<void>((r) => setTimeout(r, 5000 * (attempt + 1)));
          continue;
        }
        return resp;
      }
      if (resp.status >= 500 && attempt < maxRetries) {
        await new Promise<void>((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
        continue;
      }
      return resp;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Errore di rete');
      if (attempt < maxRetries) {
        await new Promise<void>((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
  }
  throw lastError ?? new Error('Richiesta fallita dopo più tentativi');
}

// ─── Step builder ─────────────────────────────────────────────────────────────

function buildWorkflowSteps(
  phase: AppPhase,
  tableData: SheetData | null,
  detectedColumns: DetectedColumnMap | null,
  geocodingPhase: GeocodingPhase,
): WorkflowStep[] {
  const isLoaded = phase === 'loaded';
  const hasData = tableData !== null;
  const hasColumns = detectedColumns !== null;

  return [
    {
      id: 'upload',
      label: 'Carica File',
      description: 'Importa Excel',
      status: isLoaded ? 'completed' : 'active',
    },
    {
      id: 'preview',
      label: 'Anteprima',
      description: 'Verifica dati',
      status:
        isLoaded && hasData
          ? 'completed'
          : isLoaded
            ? 'active'
            : 'pending',
    },
    {
      id: 'columns',
      label: 'Colonne',
      description: 'Mapping campi',
      status:
        isLoaded && hasColumns
          ? 'completed'
          : isLoaded && hasData
            ? 'active'
            : 'pending',
    },
    {
      id: 'geocoding',
      label: 'Geocoding',
      description: 'Coordinate GPS',
      status:
        geocodingPhase === 'done'
          ? 'completed'
          : geocodingPhase === 'running'
            ? 'active'
            : isLoaded && hasColumns
              ? 'pending'
              : 'disabled',
    },
    {
      id: 'routing',
      label: 'Distanze',
      description: 'Km calcolati',
      status:
        geocodingPhase === 'done'
          ? 'completed'
          : 'disabled',
    },
  ];
}

// ─── Componente ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  // ── State ────────────────────────────────────────────────
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [fileInfo, setFileInfo] = useState<FileInfo | null>(null);
  const [defaultSheet, setDefaultSheet] = useState<string | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [tableData, setTableData] = useState<SheetData | null>(null);
  const [detectedColumns, setDetectedColumns] =
    useState<DetectedColumnMap | null>(null);

  // Il workbook è in un ref: è costoso, non serializzabile e non serve
  // nel render — viene riusato quando l'utente cambia foglio
  const workbookRef = useRef<ExcelWorkbook | null>(null);

  // Geocoding state
  const [geocodingPhase, setGeocodingPhase] = useState<GeocodingPhase>('idle');
  const [geocodingProgress, setGeocodingProgress] = useState(0);
  const [geocodingCompleted, setGeocodingCompleted] = useState(0);
  const [geocodingResults, setGeocodingResults] = useState<GeocodingRowResult[]>([]);
  const geocodingStopRef = useRef<boolean>(false);

  // Modal completamento elaborazione
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Selezione automatica indirizzi ambigui
  const [pendingSelection, setPendingSelection] = useState<{
    rowIndex: number;
    address: string;
    candidates: GeocodingCandidate[];
  } | null>(null);
  const selectionResolverRef = useRef<((idx: number) => void) | null>(null);

  // ── Handlers ─────────────────────────────────────────────

  const handleFileSelect = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      const { fileInfo: info, workbook } = await readExcelFile(file);
      workbookRef.current = workbook;
      setFileInfo(info);

      // Auto-selezione foglio "DB DATI"
      const found = findDefaultSheet(info.sheets);
      const sheetToLoad = found ?? info.sheets[0] ?? '';
      setDefaultSheet(found);
      setSelectedSheet(sheetToLoad);

      // Estrazione dati e riconoscimento colonne
      if (sheetToLoad) {
        const data = extractSheetData(workbook, sheetToLoad);
        setTableData(data);
        setDetectedColumns(detectColumns(data.headers));
      }

      setPhase('loaded');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Errore durante la lettura del file',
      );
      setPhase('error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSheetChange = useCallback((sheetName: string) => {
    if (!workbookRef.current) return;
    setSelectedSheet(sheetName);
    const data = extractSheetData(workbookRef.current, sheetName);
    setTableData(data);
    setDetectedColumns(detectColumns(data.headers));
  }, []);

  const handleReset = useCallback(() => {
    workbookRef.current = null;
    geocodingStopRef.current = true;
    setPhase('upload');
    setIsLoading(false);
    setError(null);
    setFileInfo(null);
    setDefaultSheet(null);
    setSelectedSheet('');
    setTableData(null);
    setDetectedColumns(null);
    setGeocodingPhase('idle');
    setGeocodingProgress(0);
    setGeocodingCompleted(0);
    setGeocodingResults([]);
  }, []);

  const handleGeocode = useCallback(async () => {
    if (!tableData || !detectedColumns) return;

    geocodingStopRef.current = false;
    setGeocodingPhase('running');
    setGeocodingProgress(0);
    setGeocodingCompleted(0);
    setGeocodingResults([]);

    const rows = tableData.rows;
    const total = rows.length;
    const accumulated: GeocodingRowResult[] = [];

    for (let i = 0; i < rows.length; i++) {
      if (geocodingStopRef.current) break;

      const row = rows[i];
      const address = buildAddressFromRow(row, tableData.headers, detectedColumns);
      const fullAddress = buildSearchQuery(address);

      let lat: number | null = null;
      let lng: number | null = null;
      let status: GeocodingRowResult['status'] = 'failed';
      let error: string | undefined;

      try {
        // ── Step 1: chiedi candidati a Nominatim ────────────────────────
        const candResp = await fetchWithRetry('/api/geocode', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ address, candidates: true }),
        }, 3, 2000);
        const candData = (await candResp.json()) as {
          candidates?: GeocodingCandidate[];
          error?: string;
        };
        const candidates = candData.candidates ?? [];

        if (candidates.length === 0) {
          // Nessun candidato: usa la modalità fallback (tentativo 2 e 3)
          const response = await fetchWithRetry('/api/geocode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
          }, 3, 2000);
          const data = (await response.json()) as { result: GeocodingResult | null; error?: string };
          if (!response.ok) {
            error = data.error ?? `HTTP ${response.status}`;
          } else if (data.result) {
            lat = data.result.coordinates?.lat ?? null;
            lng = data.result.coordinates?.lng ?? null;
            status = data.result.status;
            error = data.result.error;
          } else {
            error = 'Nessun risultato trovato';
          }
        } else if (candidates.length === 1 || candidates[0].confidence === 'high') {
          // Un solo risultato o alta confidenza: usa automaticamente
          lat = candidates[0].coordinates.lat;
          lng = candidates[0].coordinates.lng;
          status = 'success';
        } else {
          // ── Più candidati con confidenza media/bassa: mostra popup ─────
          const chosenIdx = await new Promise<number>((resolve) => {
            selectionResolverRef.current = resolve;
            setPendingSelection({ rowIndex: i + 1, address: fullAddress, candidates });
          });
          setPendingSelection(null);
          const chosen = candidates[chosenIdx];
          lat = chosen.coordinates.lat;
          lng = chosen.coordinates.lng;
          status = 'success';
        }
      } catch (err) {
        status = 'failed';
        error = err instanceof Error ? err.message : 'Errore di rete';
      }

      const sparo = extractSparoCoords(row, tableData.headers, detectedColumns);
      const hasGeocode = lat !== null && lng !== null;
      const hasSparo = sparo.lat !== null && sparo.lng !== null;

      // ── Distanza stradale via OSRM ─────────────────────────────────────
      let distanceKm: number | undefined;
      if (hasGeocode && hasSparo) {
        try {
          const routeResp = await fetchWithRetry('/api/route-distance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              from: { lat: sparo.lat, lng: sparo.lng },
              to:   { lat, lng },
            }),
          }, 3, 1000);
          const routeData = (await routeResp.json()) as {
            result: { distanceKm: number } | null;
            error?: string;
          };
          distanceKm = routeData.result?.distanceKm;
        } catch {
          // fallback silenzioso dopo i retry: la cella mostrerà il warning appropriato
        }
      }

      accumulated.push({
        rowIndex: i + 1,
        fullAddress,
        lat,
        lng,
        status,
        error,
        distanceKm,
        distanceNote: !hasGeocode
          ? 'no_geocode'
          : !hasSparo
            ? 'no_sparo'
            : undefined,
        sparoLat: sparo.lat,
        sparoLng: sparo.lng,
      });
      // Aggiorno lo stato con una copia per garantire re-render
      setGeocodingResults(accumulated.slice());
      setGeocodingCompleted(i + 1);
      setGeocodingProgress(Math.round(((i + 1) / total) * 100));

      // Rate limiting Nominatim: 1 req/s
      if (i < rows.length - 1 && !geocodingStopRef.current) {
        await new Promise<void>((resolve) => setTimeout(resolve, 1100));
      }
    }

    setGeocodingPhase('done');
    setShowCompletionModal(true);
  }, [tableData, detectedColumns]);

  const handleGeocodingStop = useCallback(() => {
    geocodingStopRef.current = true;
  }, []);

  const handleExport = useCallback(async () => {
    if (!tableData) return;
    await exportToExcel(
      tableData.headers,
      tableData.rows,
      geocodingResults,
      'KmC_risultati',
    );
  }, [tableData, geocodingResults]);

  // ── Valori derivati ──────────────────────────────────────

  const workflowSteps = buildWorkflowSteps(phase, tableData, detectedColumns, geocodingPhase);
  const missingRequired =
    detectedColumns !== null
      ? getMissingRequiredColumns(detectedColumns)
      : [];
  const canGeocode =
    phase === 'loaded' &&
    tableData !== null &&
    detectedColumns !== null &&
    missingRequired.length === 0;

  // ── Render ───────────────────────────────────────────────

  return (
    <div className="flex flex-col gap-5">

      {/* ① Step Indicator - sticky sotto l'header */}
      <div
        className="rounded-xl border bg-white px-6 py-4 sticky top-14 z-10 shadow-sm flex items-center gap-4"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex-1">
          <StepIndicator steps={workflowSteps} />
        </div>

        {/* Pulsante Azzera tutto — visibile solo quando c'è un file caricato */}
        {phase === 'loaded' && (
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-red-200 bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 transition-colors flex-shrink-0 text-sm font-semibold whitespace-nowrap"
            title="Azzera tutto e carica un nuovo file"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
              <path d="M3 3v5h5"/>
            </svg>
            Azzera tutto
          </button>
        )}
      </div>

      {/* ② Upload phase ──────────────────────────────────────────── */}
      {phase === 'upload' && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              Importa il file Excel
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Carica il file contenente le spedizioni. Il foglio{' '}
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-xs">
                DB DATI
              </span>{' '}
              verrà selezionato automaticamente se presente.
            </p>
          </div>

          <FileDropzone
            onFileSelect={handleFileSelect}
            isLoading={isLoading}
          />

          {/* Schede funzionalità */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-1">
            {FEATURE_CARDS.map((card) => (
              <div
                key={card.title}
                className="rounded-xl border bg-white p-4"
                style={{ borderColor: 'var(--border)' }}
              >
                <p className="text-xl mb-2">{card.emoji}</p>
                <p className="text-xs font-semibold text-gray-800 mb-1">
                  {card.title}
                </p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ③ Error state ───────────────────────────────────────────── */}
      {phase === 'error' && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 text-xl">
            ⚠
          </div>
          <div className="flex-1">
            <p className="font-semibold text-red-800 text-sm">
              Errore durante il caricamento
            </p>
            <p className="text-red-600 text-xs mt-1">{error}</p>
            <button
              onClick={handleReset}
              className="mt-3 text-xs font-medium text-red-700 hover:text-red-900 underline underline-offset-2"
            >
              Riprova con un altro file
            </button>
          </div>
        </div>
      )}

      {/* ④ Loaded phase ──────────────────────────────────────────── */}
      {phase === 'loaded' && fileInfo && (
        <div className="flex flex-col gap-4">
          {/* Info file caricato */}
          <FileInfoCard fileInfo={fileInfo} onReset={handleReset} />

          {/* Selezione foglio */}
          <SheetSelector
            sheets={fileInfo.sheets}
            selectedSheet={selectedSheet}
            defaultSheet={defaultSheet}
            onChange={handleSheetChange}
          />

          {/* Divisore sezione analisi */}
          <div className="flex items-center gap-4 mt-1">
            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">
              Analisi dati
            </p>
            <div className="h-px flex-1" style={{ background: 'var(--border)' }} />
          </div>

          {/* Riconoscimento colonne */}
          {detectedColumns && (
            <ColumnMapDisplay detectedColumns={detectedColumns} />
          )}

          {/* Preview tabella */}
          {tableData && (
            <DataTable
              headers={tableData.headers}
              rows={tableData.rows}
              totalRows={tableData.totalRows}
              detectedColumns={detectedColumns ?? undefined}
            />
          )}

          {/* Geocoding results */}
          {(geocodingPhase === 'running' || geocodingPhase === 'done') && (
            <GeocodeResults
              phase={geocodingPhase}
              progress={geocodingProgress}
              completed={geocodingCompleted}
              total={tableData?.totalRows ?? 0}
              results={geocodingResults}
              onStop={geocodingPhase === 'running' ? handleGeocodingStop : undefined}
              onExport={geocodingPhase === 'done' ? handleExport : undefined}
            />
          )}

          {/* Action bar */}
          {tableData && (
            <div
              className="rounded-xl border bg-white p-4 flex items-center justify-between gap-4"
              style={{ borderColor: 'var(--border)' }}
            >
              <div>
                <p className="text-sm font-semibold text-gray-800">
                  {formatNumber(tableData.totalRows)} righe pronte
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {canGeocode
                    ? 'Tutte le colonne obbligatorie sono state riconosciute.'
                    : missingRequired.length > 0
                      ? `Colonne mancanti: ${missingRequired.map((d) => d.label).join(', ')}`
                      : 'Verifica il mapping delle colonne prima di procedere.'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  disabled={!canGeocode || geocodingPhase === 'running'}
                  onClick={handleGeocode}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'var(--primary)' }}
                >
                  <MapPin className="w-4 h-4" />
                  {geocodingPhase === 'running'
                    ? 'Geocoding…'
                    : geocodingPhase === 'done'
                      ? 'Ripeti Geocoding'
                      : 'Geocodifica Indirizzi'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
      {/* Modal completamento elaborazione */}
      {showCompletionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Overlay */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          {/* Card */}
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">Elaborazione completata!</p>
              <p className="text-sm text-gray-500 mt-1">
                {geocodingResults.filter(r => r.status === 'success' || r.status === 'cached').length} indirizzi trovati
                {geocodingResults.filter(r => r.status === 'failed').length > 0 && (
                  <span className="text-red-500">
                    {' '}· {geocodingResults.filter(r => r.status === 'failed').length} non trovati
                  </span>
                )}
                {' '}su {geocodingResults.length} totali
              </p>
            </div>
            <button
              onClick={() => setShowCompletionModal(false)}
              className="mt-2 w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--primary)' }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Popup selezione manuale indirizzo */}
      {pendingSelection && (
        <AddressSelectionModal
          originalAddress={pendingSelection.address}
          rowIndex={pendingSelection.rowIndex}
          candidates={pendingSelection.candidates}
          onSelect={(idx) => {
            selectionResolverRef.current?.(idx);
            selectionResolverRef.current = null;
          }}
          onSkip={() => {
            selectionResolverRef.current?.(0);
            selectionResolverRef.current = null;
          }}
        />
      )}
    </div>
  );
}

// ─── Dati statici ─────────────────────────────────────────────────────────────

const FEATURE_CARDS = [
  {
    emoji: '📍',
    title: 'Geocoding automatico',
    desc: 'Ogni indirizzo viene convertito in coordinate GPS tramite OpenStreetMap Nominatim.',
  },
  {
    emoji: '🛣️',
    title: 'Distanze stradali reali',
    desc: 'Calcolo km con percorso stradale effettivo tramite OSRM — nessuna API a pagamento.',
  },
  {
    emoji: '📊',
    title: 'Export Excel + Maps',
    desc: 'Il file risultante include distanze, coordinate e link Google Maps per ogni riga.',
  },
] as const;
