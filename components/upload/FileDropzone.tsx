'use client';
/**
 * CourierLab — File Dropzone
 *
 * Area drag-and-drop con supporto click-to-browse.
 * Valida il tipo di file prima di chiamare onFileSelect.
 * Accessibile via tastiera (Enter / Space).
 */

import {
  useRef,
  useState,
  useCallback,
  type DragEvent,
  type ChangeEvent,
  type KeyboardEvent,
} from 'react';
import { UploadCloud, FileSpreadsheet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isValidExcelFile } from '@/lib/excel/reader';

interface FileDropzoneProps {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export default function FileDropzone({
  onFileSelect,
  isLoading = false,
  error = null,
}: FileDropzoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Drag handlers ─────────────────────────────────────────────────────────

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Ignora eventi di drag-leave su elementi figli
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);
      setLocalError(null);

      const file = e.dataTransfer.files[0];
      if (!file) return;

      if (!isValidExcelFile(file)) {
        setLocalError('Formato non supportato. Carica un file .xlsx o .xls');
        return;
      }
      onFileSelect(file);
    },
    [onFileSelect],
  );

  // ── File input handler ────────────────────────────────────────────────────

  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      setLocalError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      if (!isValidExcelFile(file)) {
        setLocalError('Formato non supportato. Carica un file .xlsx o .xls');
      } else {
        onFileSelect(file);
      }
      // Reset dell'input per permettere di ricaricare lo stesso file
      e.target.value = '';
    },
    [onFileSelect],
  );

  // ── Keyboard handler ──────────────────────────────────────────────────────

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLDivElement>) => {
      if ((e.key === 'Enter' || e.key === ' ') && !isLoading) {
        e.preventDefault();
        inputRef.current?.click();
      }
    },
    [isLoading],
  );

  // ── Render ────────────────────────────────────────────────────────────────

  const displayError = error ?? localError;
  const hasError = displayError !== null;

  return (
    <div className="flex flex-col gap-2">
      <div
        role="button"
        tabIndex={isLoading ? -1 : 0}
        aria-label="Carica file Excel — trascina o clicca per sfogliare"
        className={cn(
          'relative border-2 border-dashed rounded-xl transition-all duration-200 select-none',
          // Stati interattivi
          !isLoading && 'cursor-pointer',
          isDragging && 'border-blue-500 bg-blue-50/80 scale-[1.005]',
          !isDragging &&
            !hasError &&
            !isLoading &&
            'border-gray-200 bg-gray-50/60 hover:border-blue-300 hover:bg-blue-50/20',
          hasError &&
            !isDragging &&
            'border-red-300 bg-red-50/30 hover:border-red-400',
          isLoading && 'opacity-60 cursor-wait pointer-events-none',
        )}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isLoading && inputRef.current?.click()}
        onKeyDown={handleKeyDown}
      >
        {/* Input file nascosto */}
        <input
          ref={inputRef}
          type="file"
          className="sr-only"
          accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
          onChange={handleFileChange}
          aria-hidden="true"
          tabIndex={-1}
        />

        <div className="flex flex-col items-center justify-center gap-5 py-14 px-8 text-center">
          {/* Icona centrale */}
          <div
            className={cn(
              'w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200',
              isDragging ? 'bg-blue-100 scale-110' : '',
              hasError && !isDragging ? 'bg-red-100' : '',
              !isDragging && !hasError ? 'bg-white shadow-sm' : '',
            )}
          >
            {isLoading ? (
              <div className="w-7 h-7 border-[3px] border-blue-600 border-t-transparent rounded-full animate-spin" />
            ) : isDragging ? (
              <UploadCloud className="w-8 h-8 text-blue-500" />
            ) : (
              <FileSpreadsheet
                className={cn(
                  'w-8 h-8',
                  hasError ? 'text-red-500' : 'text-blue-600',
                )}
              />
            )}
          </div>

          {/* Testo principale */}
          <div className="space-y-1.5">
            <p className="font-semibold text-sm text-gray-800">
              {isLoading
                ? 'Lettura del file in corso…'
                : isDragging
                  ? 'Rilascia qui il file'
                  : 'Trascina il file Excel qui'}
            </p>
            {!isLoading && (
              <p className="text-xs text-gray-500">
                oppure{' '}
                <span className="text-blue-600 font-medium hover:underline">
                  clicca per sfogliare
                </span>
              </p>
            )}
          </div>

          {/* Badge formati supportati */}
          {!isLoading && (
            <div className="flex items-center gap-2">
              {['.xlsx', '.xls'].map((ext) => (
                <span
                  key={ext}
                  className="px-2.5 py-1 bg-white border border-gray-200 rounded-md text-xs font-mono text-gray-500 shadow-sm"
                >
                  {ext}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Messaggio di errore */}
      {displayError && (
        <p className="text-xs text-red-600 flex items-center gap-1.5 px-1" role="alert">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  );
}
