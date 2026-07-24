'use client';
/**
 * CourierLab — Data Preview Table
 *
 * Tabella dati con:
 * - Header sticky al top durante lo scroll
 * - Righe zebrate (alternanza sfondo)
 * - Scroll orizzontale per tabelle larghe
 * - Evidenziazione delle colonne riconosciute automaticamente
 * - Prima N righe con espansione opzionale
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/utils/format';
import type { CellValue } from '@/lib/excel/reader';
import type { DetectedColumnMap } from '@/lib/parser/column-detector';

const DEFAULT_VISIBLE_ROWS = 10;

interface DataTableProps {
  headers: string[];
  rows: CellValue[][];
  totalRows: number;
  detectedColumns?: DetectedColumnMap;
}

/** Formatta un valore cella per la visualizzazione */
function formatCellValue(value: CellValue): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) {
    return new Intl.DateTimeFormat('it-IT').format(value);
  }
  return String(value);
}

export default function DataTable({
  headers,
  rows,
  totalRows,
  detectedColumns,
}: DataTableProps) {
  const [expanded, setExpanded] = useState(false);

  // Set di header riconosciuti per evidenziazione rapida
  const detectedSet = new Set(
    Object.values(detectedColumns ?? {}).filter(Boolean) as string[],
  );

  const visibleRows = expanded ? rows : rows.slice(0, DEFAULT_VISIBLE_ROWS);
  const hasMore = totalRows > DEFAULT_VISIBLE_ROWS;

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">Anteprima dati</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {expanded
              ? `${formatNumber(totalRows)} righe`
              : `Prime ${formatNumber(Math.min(DEFAULT_VISIBLE_ROWS, totalRows))} di ${formatNumber(totalRows)} righe`}
            {' · '}
            {headers.length} colonne
            {detectedSet.size > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ·{' '}
                <span className="inline-flex items-center gap-1">
                  {detectedSet.size} riconosciute
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block" />
                </span>
              </span>
            )}
          </p>
        </div>

        {hasMore && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50"
          >
            {expanded ? '↑ Comprimi' : `Mostra tutte (${formatNumber(totalRows)})`}
          </button>
        )}
      </div>

      {/* ── Tabella con scroll orizzontale ──────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          {/* Header sticky */}
          <thead>
            <tr>
              {/* Colonna numero riga */}
              <th
                className="sticky top-0 z-10 w-10 px-3 py-3 text-center font-medium text-gray-400 bg-gray-50 border-b border-r"
                style={{ borderColor: 'var(--border)' }}
              >
                #
              </th>

              {headers.map((header, i) => {
                const isDetected = detectedSet.has(header);
                return (
                  <th
                    key={i}
                    className={cn(
                      'sticky top-0 z-10 px-3 py-3 text-left font-semibold whitespace-nowrap border-b',
                      isDetected
                        ? 'bg-blue-50 text-blue-700'
                        : 'bg-gray-50 text-gray-600',
                    )}
                    style={{ borderColor: 'var(--border)' }}
                    title={
                      isDetected
                        ? 'Colonna riconosciuta automaticamente'
                        : header
                    }
                  >
                    <div className="flex items-center gap-1.5">
                      {header || (
                        <em className="text-gray-300 font-normal not-italic">
                          senza nome
                        </em>
                      )}
                      {isDetected && (
                        <span
                          className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0"
                          aria-label="Riconosciuta"
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Righe dati */}
          <tbody>
            {visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headers.length + 1}
                  className="px-5 py-10 text-center text-sm text-gray-400"
                >
                  Nessun dato nel foglio selezionato
                </td>
              </tr>
            ) : (
              visibleRows.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  className={cn(
                    'border-b last:border-0 hover:bg-blue-50/20 transition-colors duration-100',
                    rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50/40',
                  )}
                  style={{ borderColor: 'var(--border)' }}
                >
                  {/* Numero riga */}
                  <td
                    className="px-3 py-2.5 text-center text-gray-300 font-mono text-[11px] border-r"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    {rowIndex + 1}
                  </td>

                  {headers.map((_, colIndex) => {
                    const cell = row[colIndex] ?? null;
                    const cellStr = formatCellValue(cell);
                    return (
                      <td
                        key={colIndex}
                        className="px-3 py-2.5 text-gray-700 whitespace-nowrap max-w-[240px] truncate"
                        title={cellStr || undefined}
                      >
                        {cellStr || (
                          <span className="text-gray-200 select-none">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con indicazione righe non mostrate */}
      {hasMore && !expanded && (
        <div
          className="px-5 py-2.5 border-t text-center"
          style={{ borderColor: 'var(--border)' }}
        >
          <p className="text-xs text-gray-400">
            …{' '}
            <span className="font-semibold text-gray-500">
              {formatNumber(totalRows - DEFAULT_VISIBLE_ROWS)}
            </span>{' '}
            righe aggiuntive non visualizzate
          </p>
        </div>
      )}
    </div>
  );
}
