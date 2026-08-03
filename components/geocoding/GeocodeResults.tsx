'use client';

import { Download, CheckCircle2, XCircle, SkipForward, ListChecks } from 'lucide-react';
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
  /** Coordinate del punto SPARO/Palmare per costruire il link Maps */
  sparoLat?: number | null;
  sparoLng?: number | null;
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
  const successRate = total > 0 ? Math.round((successCount / total) * 100) : 0;

  return (
    <div className="flex flex-col gap-4">
      {/* ── Barra di avanzamento ─────────────────────────────────────── */}
      {phase === 'running' && (
        <div
          className="rounded-xl border bg-white p-6"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-base font-semibold text-gray-800">
                Geocoding in corso…
              </p>
              <p className="text-sm text-gray-400 mt-0.5">
                Rispetta la policy Nominatim: 1 richiesta / secondo
              </p>
            </div>
            <div className="flex items-center gap-5">
              <span className="text-lg font-mono font-semibold text-gray-700 tabular-nums">
                {completed} / {total}
              </span>
              {onStop && (
                <button
                  onClick={onStop}
                  className="text-sm text-red-600 hover:text-red-800 font-medium underline underline-offset-2"
                >
                  Interrompi
                </button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${progress}%`,
                background: 'var(--primary)',
              }}
            />
          </div>

          <p className="text-sm font-semibold text-gray-500 mt-2.5 text-right tabular-nums">
            {progress}%
          </p>
        </div>
      )}

      {/* ── Riepilogo risultati ───────────────────────────────────────── */}
      {phase === 'done' && results.length > 0 && (
        <div
          className="rounded-xl border bg-white overflow-hidden"
          style={{ borderColor: 'var(--border)' }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-7 py-5 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <p className="text-lg font-bold text-gray-800">Riepilogo Geocoding</p>
              <p className="text-sm text-gray-500 mt-0.5">
                Elaborazione completata · tasso di successo{' '}
                <span className="font-semibold text-gray-700">{successRate}%</span>
              </p>
            </div>
            {onExport && (
              <button
                onClick={onExport}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity"
                style={{ background: 'var(--primary)' }}
              >
                <Download className="w-4 h-4" />
                Esporta Excel
              </button>
            )}
          </div>

          {/* Stat cards */}
          <div className="grid grid-cols-4 divide-x" style={{ borderColor: 'var(--border)' }}>
            <StatCard
              icon={<ListChecks className="w-6 h-6 text-gray-400" />}
              label="Totale indirizzi"
              value={total}
              valueClass="text-gray-800"
            />
            <StatCard
              icon={<CheckCircle2 className="w-6 h-6 text-green-500" />}
              label="Geocodificati"
              value={successCount}
              valueClass="text-green-600"
            />
            <StatCard
              icon={<XCircle className="w-6 h-6 text-red-500" />}
              label="Non trovati"
              value={failedCount}
              valueClass={failedCount > 0 ? 'text-red-600' : 'text-gray-400'}
            />
            <StatCard
              icon={<SkipForward className="w-6 h-6 text-yellow-500" />}
              label="Saltati"
              value={skippedCount}
              valueClass={skippedCount > 0 ? 'text-yellow-600' : 'text-gray-400'}
            />
          </div>

          {/* Warning banner se ci sono fallimenti */}
          {failedCount > 0 && (
            <div className="mx-7 my-5 flex items-center gap-3 px-5 py-4 rounded-lg bg-red-50 border border-red-200">
              <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">{failedCount} indirizzi</span> non sono stati
                geocodificati. Verranno esportati senza coordinate.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  valueClass: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 px-6 py-8">
      {icon}
      <span className={`text-4xl font-bold tabular-nums ${valueClass}`}>{value}</span>
      <span className="text-sm text-gray-500 font-medium text-center">{label}</span>
    </div>
  );
}
