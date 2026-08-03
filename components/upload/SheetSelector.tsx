/**
 * CourierLab — Sheet Selector
 *
 * Mostra la lista dei fogli disponibili e permette di selezionarne uno.
 * Indica visivamente se "DB DATI" è stato rilevato automaticamente.
 */
import { Layers, CheckCircle2, AlertTriangle } from 'lucide-react';
import { DEFAULT_SHEET_NAME } from '@/lib/excel/reader';

interface SheetSelectorProps {
  sheets: string[];
  selectedSheet: string;
  /** Nome del foglio auto-rilevato (null se non trovato) */
  defaultSheet: string | null;
  onChange: (sheet: string) => void;
}

export default function SheetSelector({
  sheets,
  selectedSheet,
  defaultSheet,
  onChange,
}: SheetSelectorProps) {
  const isAutoDetected = defaultSheet !== null;

  return (
    <div
      className="rounded-xl border bg-white p-5"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="flex items-start gap-3">
        {/* Icona */}
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
            isAutoDetected ? 'bg-green-50' : 'bg-amber-50'
          }`}
        >
          <Layers
            className={`w-4 h-4 ${
              isAutoDetected ? 'text-green-600' : 'text-amber-600'
            }`}
          />
        </div>

        <div className="flex-1">
          {/* Titolo + badge */}
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-gray-900">
              Foglio di lavoro
            </p>
            {isAutoDetected ? (
              <span className="flex items-center gap-1 text-xs text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                <CheckCircle2 className="w-3 h-3" />
                Rilevato automaticamente
              </span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-medium">
                <AlertTriangle className="w-3 h-3" />
                Seleziona manualmente
              </span>
            )}
          </div>

          {/* Messaggio contestuale */}
          {isAutoDetected ? (
            <p className="text-xs text-gray-500 mt-1.5">
              Il foglio{' '}
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                {DEFAULT_SHEET_NAME}
              </span>{' '}
              è stato selezionato automaticamente. Se il file contiene più fogli,
              puoi sceglierne un altro dal menù a tendina sottostante.
            </p>
          ) : (
            <p className="text-xs text-gray-500 mt-1.5">
              Il foglio{' '}
              <span className="font-mono bg-gray-100 px-1.5 py-0.5 rounded text-[11px]">
                {DEFAULT_SHEET_NAME}
              </span>{' '}
              non è stato trovato. Seleziona dal menù a tendina il foglio che
              contiene i dati da elaborare. Se è presente un solo foglio, verrà
              considerato automaticamente.
            </p>
          )}

          {/* Select foglio */}
          <div className="mt-3">
            <select
              value={selectedSheet}
              onChange={(e) => onChange(e.target.value)}
              className="text-sm rounded-lg border border-gray-200 bg-white px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full sm:w-auto sm:min-w-[260px]"
              aria-label="Seleziona foglio di lavoro"
            >
              {sheets.map((sheet) => (
                <option key={sheet} value={sheet}>
                  {sheet}
                  {sheet === defaultSheet ? '  ✓' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
