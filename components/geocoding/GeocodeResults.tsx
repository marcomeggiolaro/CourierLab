'use client';
/**
 * GeocodeResults — Mostra la barra di avanzamento e la tabella dei risultati
 * durante e dopo il geocoding degli indirizzi.
 *
 * Struttura della tabella:
 *   # | Indirizzo | Latitudine | Longitudine | Stato | Errore
 *
 * Le righe fallite sono evidenziate in rosso.
 */

import { Download } from 'lucide-react';
import type { GeocodingStatus } from '@/lib/geocoding/types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GeocodingRowResult {
  /** Indice 1-based della riga nell'Excel originale */
  rowIndex: number;
  /** Indirizzo completo costruito per la query */
  fullAddress: string;
  lat: number | null;
  lng: number | null;
  status: GeocodingStatus;
  error?: string;
  /** Distanza in km tra l'indirizzo geocodificato e il punto SPARO/Palmare */
  distanceKm?: number;
  /** Motivo per cui la distanza non è calcolabile (anche se il geocoding è riuscito) */
  distanceNote?: 'no_sparo' | 'no_geocode';
}

interface GeocodeResultsProps {
  phase: 'running' | 'done';
  /** Avanzamento 0–100 */
  progress: number;
  completed: number;
  total: number;
  results: GeocodingRowResult[];
  onStop?: () => void;
  onExport?: () => void;
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function GeocodeResults({
  phase,
  progress,
  completed,
  total,
  results,
  onStop,
  onExport,
}: GeocodeResultsProps) {
  const successCount = results.filter(
    (r) => r.status === 'success' || r.status === 'cached',
  ).length;
  const failedCount = results.filter((r) => r.status === 'failed').length;
  const skippedCount = results.filter((r) => r.status === 'skipped').length;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Barra di avanzamento ─────────────────────────────────────── */}
      {phase === 'running' && (
        <div
          className="rounded-xl border bg-white p-5"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Geocoding in corso…
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Rispetta la policy Nominatim: 1 richiesta / secondo
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-mono text-gray-600 tabular-nums">
                {completed} / {total}
              </span>
              {onStop && (
                <button
                  onClick={onStop}
                  className="text-xs text-red-600 hover:text-red-800 font-medium underline underline-offset-2"
                >
                  Interrompi
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'var(--primary)',
              }}
            />
          </div>

          <p className="text-xs text-gray-400 mt-2 text-right">{progress}%</p>
        </div>
      )}

      {/* ── Tabella risultati ─────────────────────────────────────────── */}
      {results.length > 0 && (
        <div
          className="rounded-xl border bg-white overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Toolbar */}
          <div
            className="flex items-center justify-between px-5 py-3.5 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Risultati Geocoding
              </p>
              {phase === 'done' && (
                <p className="text-xs text-gray-500 mt-0.5">
                  <span className="text-green-600 font-medium">
                    {successCount} trovati
                  </span>
                  {failedCount > 0 && (
                    <>
                      {' '}
                      ·{' '}
                      <span className="text-red-600 font-medium">
                        {failedCount} non trovati
                      </span>
                    </>
                  )}
                  {skippedCount > 0 && (
                    <>
                      {' '}
                      ·{' '}
                      <span className="text-yellow-600 font-medium">
                        {skippedCount} saltati
                      </span>
                    </>
                  )}
                </p>
              )}
            </div>

            {phase === 'done' && failedCount > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-700 text-xs font-medium">
                ⚠ {failedCount} indirizzi non geocodificati
              </span>
            )}

            {phase === 'done' && onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Download className="w-4 h-4" />
                Esporta Excel
              </button>
            )}
          </div>

          {/* Tabella */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr
                  className="border-b text-gray-400 uppercase text-[10px] tracking-wide bg-gray-50"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <th className="px-4 py-2.5 text-left font-semibold w-10">
                    #
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Indirizzo
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold w-28">
                    Latitudine
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold w-28">
                    Longitudine
                  </th>
                  <th className="px-4 py-2.5 text-right font-semibold w-28">
                    Distanza (km)
                  </th>
                  <th className="px-4 py-2.5 text-center font-semibold w-24">
                    Stato
                  </th>
                  <th className="px-4 py-2.5 text-left font-semibold">
                    Errore
                  </th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr
                    key={r.rowIndex}
                    className={
                      r.status === 'failed'
                        ? 'bg-red-50 border-l-2 border-red-300'
                        : r.status === 'skipped'
                          ? 'bg-yellow-50'
                          : 'even:bg-gray-50/50'
                    }
                  >
                    <td className="px-4 py-2 text-gray-400 tabular-nums">
                      {r.rowIndex}
                    </td>
                    <td
                      className="px-4 py-2 text-gray-700 max-w-xs truncate"
                      title={r.fullAddress}
                    >
                      {r.fullAddress || '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-600 tabular-nums">
                      {r.lat !== null ? r.lat.toFixed(6) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-gray-600 tabular-nums">
                      {r.lng !== null ? r.lng.toFixed(6) : '—'}
                    </td>
                    <td className="px-4 py-2 text-right font-mono tabular-nums">
                      {r.distanceKm !== undefined ? (
                        <span className="font-semibold text-blue-700">
                          {r.distanceKm.toFixed(2)}
                        </span>
                      ) : r.distanceNote === 'no_sparo' ? (
                        <span className="text-amber-600 text-[10px] font-medium whitespace-nowrap">
                          ⚠ Manca coord. sparo
                        </span>
                      ) : r.distanceNote === 'no_geocode' ? (
                        <span className="text-red-400 text-[10px] font-medium whitespace-nowrap">
                          ⚠ Manca coord. destinatario
                        </span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <StatusBadge status={r.status} />
                    </td>
                    <td
                      className="px-4 py-2 text-red-600 max-w-xs truncate"
                      title={r.error}
                    >
                      {r.error ?? ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Badge stato ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: GeocodingStatus }) {
  if (status === 'success' || status === 'cached') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-semibold">
        ✓ OK
      </span>
    );
  }
  if (status === 'failed') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-semibold">
        ✗ Errore
      </span>
    );
  }
  // skipped
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-semibold">
      — Skip
    </span>
  );
}
