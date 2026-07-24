/**
 * CourierLab — File Info Card
 *
 * Mostra i metadati del file Excel caricato:
 * nome, dimensione, data/ora caricamento, numero di fogli.
 */
import { FileSpreadsheet, Clock, HardDrive, Layers, CheckCircle2 } from 'lucide-react';
import { formatFileSize, formatDateTime } from '@/lib/utils/format';
import type { FileInfo } from '@/lib/excel/reader';

interface FileInfoCardProps {
  fileInfo: FileInfo;
  /** Callback per caricare un altro file */
  onReset?: () => void;
}

export default function FileInfoCard({ fileInfo, onReset }: FileInfoCardProps) {
  const stats = [
    {
      icon: HardDrive,
      label: 'Dimensione',
      value: formatFileSize(fileInfo.size),
    },
    {
      icon: Clock,
      label: 'Caricato il',
      value: formatDateTime(fileInfo.uploadedAt),
    },
    {
      icon: Layers,
      label: fileInfo.sheetCount === 1 ? 'Foglio' : 'Fogli',
      value: String(fileInfo.sheetCount),
    },
  ] as const;

  return (
    <div
      className="rounded-xl border bg-white p-5 flex items-start gap-4"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* Icona file */}
      <div className="w-11 h-11 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
        <FileSpreadsheet className="w-5 h-5 text-green-600" />
      </div>

      {/* Dettagli */}
      <div className="flex-1 min-w-0">
        {/* Nome file + badge status */}
        <div className="flex items-start justify-between gap-3">
          <p
            className="font-semibold text-sm text-gray-900 truncate"
            title={fileInfo.name}
          >
            {fileInfo.name}
          </p>
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium flex-shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Caricato
          </span>
        </div>

        {/* Statistiche */}
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2">
          {stats.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-1.5">
              <Icon className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
              <span className="text-xs text-gray-500">{label}:</span>
              <span className="text-xs font-semibold text-gray-700">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pulsante reset */}
      {onReset && (
        <button
          onClick={onReset}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors flex-shrink-0 mt-0.5 underline underline-offset-2"
          title="Carica un altro file"
        >
          Cambia
        </button>
      )}
    </div>
  );
}
