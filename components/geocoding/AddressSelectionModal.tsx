'use client';
/**
 * AddressSelectionModal — Popup che mostra i candidati trovati da Nominatim
 * e consente all'utente di scegliere quello corretto prima di proseguire.
 */

import type { GeocodingCandidate } from '@/lib/geocoding/types';
import { MapPin, SkipForward } from 'lucide-react';

interface AddressSelectionModalProps {
  /** Testo dell'indirizzo originale della riga Excel */
  originalAddress: string;
  /** Numero di riga (1-based) per contestualizzare il popup */
  rowIndex: number;
  /** Candidati restituiti da Nominatim */
  candidates: GeocodingCandidate[];
  /** Chiamata quando l'utente seleziona un candidato (indice 0-based) */
  onSelect: (index: number) => void;
  /** Chiamata quando l'utente sceglie di usare il primo risultato automaticamente */
  onSkip: () => void;
}

const confidenceLabel: Record<string, { label: string; color: string }> = {
  high:   { label: 'Alta', color: 'text-green-700 bg-green-50 border-green-200' },
  medium: { label: 'Media', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  low:    { label: 'Bassa', color: 'text-red-700 bg-red-50 border-red-200' },
};

export default function AddressSelectionModal({
  originalAddress,
  rowIndex,
  candidates,
  onSelect,
  onSkip,
}: AddressSelectionModalProps) {
  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(3px)' }}>

      {/* Pannello */}
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border overflow-hidden"
        style={{ borderColor: 'var(--border)' }}>

        {/* Header */}
        <div className="px-6 py-4 border-b flex items-start gap-3"
          style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--primary-light, #EEF2FF)' }}>
            <MapPin className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">
              Riga {rowIndex} — Seleziona l&apos;indirizzo corretto
            </p>
            <p className="text-xs text-gray-500 mt-0.5 truncate" title={originalAddress}>
              {originalAddress}
            </p>
          </div>
        </div>

        {/* Lista candidati */}
        <div className="px-4 py-3 flex flex-col gap-2 max-h-72 overflow-y-auto">
          {candidates.map((candidate, idx) => {
            const conf = confidenceLabel[candidate.confidence] ?? confidenceLabel.low;
            return (
              <button
                key={idx}
                onClick={() => onSelect(idx)}
                className="w-full text-left rounded-xl border px-4 py-3 hover:border-indigo-400 hover:bg-indigo-50 transition-colors group"
                style={{ borderColor: 'var(--border)' }}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-gray-800 leading-relaxed flex-1">
                    {candidate.displayName}
                  </p>
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border flex-shrink-0 ${conf.color}`}>
                    {conf.label}
                  </span>
                </div>
                <p className="text-[10px] text-gray-400 mt-1 font-mono">
                  {candidate.coordinates.lat.toFixed(5)}, {candidate.coordinates.lng.toFixed(5)}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t flex items-center justify-between gap-3"
          style={{ borderColor: 'var(--border)' }}>
          <p className="text-[11px] text-gray-400">
            {candidates.length} risultat{candidates.length === 1 ? 'o' : 'i'} trovati
          </p>
          <button
            onClick={onSkip}
            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 font-medium transition-colors"
          >
            <SkipForward className="w-3.5 h-3.5" />
            Usa il primo automaticamente
          </button>
        </div>
      </div>
    </div>
  );
}
