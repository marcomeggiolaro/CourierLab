/**
 * CourierLab — Column Map Display
 *
 * Mostra il risultato del riconoscimento automatico delle colonne:
 * - Colonne obbligatorie per il geocoding (con stato ok/mancante)
 * - Colonne opzionali (trovate / non presenti)
 * - Badge di stato complessivo
 */
import { CheckCircle2, AlertCircle, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  COLUMN_DEFINITIONS,
  getMissingRequiredColumns,
  type DetectedColumnMap,
  type ColumnType,
  type ColumnDefinition,
} from '@/lib/parser/column-detector';

interface ColumnMapDisplayProps {
  detectedColumns: DetectedColumnMap;
}

export default function ColumnMapDisplay({
  detectedColumns,
}: ColumnMapDisplayProps) {
  const requiredDefs = COLUMN_DEFINITIONS.filter((d) => d.required);
  const optionalDefs = COLUMN_DEFINITIONS.filter((d) => !d.required);
  const missing = getMissingRequiredColumns(detectedColumns);
  const isComplete = missing.length === 0;

  const detectedCount = Object.values(detectedColumns).filter(Boolean).length;
  const totalPossible = COLUMN_DEFINITIONS.length;

  return (
    <div
      className="rounded-xl border bg-white overflow-hidden"
      style={{ borderColor: 'var(--border)' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div
        className="flex items-center justify-between px-5 py-3.5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <p className="text-sm font-semibold text-gray-900">
            Riconoscimento colonne
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            Mappatura automatica dei campi ·{' '}
            {detectedCount}/{totalPossible} colonne trovate
          </p>
        </div>

        {/* Badge stato globale */}
        <div
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
            isComplete
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-amber-50 text-amber-700 border border-amber-200',
          )}
        >
          {isComplete ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              Pronto per il geocoding
            </>
          ) : (
            <>
              <AlertCircle className="w-3.5 h-3.5" />
              {missing.length}{' '}
              {missing.length === 1 ? 'campo richiesto' : 'campi richiesti'}{' '}
              mancante{missing.length > 1 ? 'i' : ''}
            </>
          )}
        </div>
      </div>

      <div className="p-5 flex flex-col gap-5">
        {/* ── Colonne obbligatorie ─────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Colonne richieste per il geocoding
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {requiredDefs.map((def) => (
              <ColumnCard
                key={def.type}
                definition={def}
                mappedHeader={detectedColumns[def.type]}
                variant={
                  detectedColumns[def.type] !== undefined
                    ? 'success'
                    : 'error'
                }
              />
            ))}
          </div>
        </section>

        {/* ── Colonne opzionali ────────────────────────────────────────────── */}
        <section>
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Colonne opzionali
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {optionalDefs.map((def) => (
              <ColumnCard
                key={def.type}
                definition={def}
                mappedHeader={detectedColumns[def.type]}
                variant={
                  detectedColumns[def.type] !== undefined
                    ? 'info'
                    : 'neutral'
                }
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Sub-component ─────────────────────────────────────────────────────────────

type CardVariant = 'success' | 'error' | 'info' | 'neutral';

interface ColumnCardProps {
  definition: ColumnDefinition;
  mappedHeader: string | undefined;
  variant: CardVariant;
}

const VARIANT_STYLES: Record<
  CardVariant,
  {
    container: string;
    icon: React.ReactNode;
    labelColor: string;
    valueColor: string;
    emptyLabel: string;
  }
> = {
  success: {
    container: 'border-green-200 bg-green-50',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-green-600 mt-0.5 flex-shrink-0" />,
    labelColor: 'text-green-800',
    valueColor: 'text-green-600',
    emptyLabel: '',
  },
  error: {
    container: 'border-red-200 bg-red-50',
    icon: <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 flex-shrink-0" />,
    labelColor: 'text-red-700',
    valueColor: 'text-red-400',
    emptyLabel: 'Non trovata',
  },
  info: {
    container: 'border-blue-200 bg-blue-50',
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 mt-0.5 flex-shrink-0" />,
    labelColor: 'text-blue-800',
    valueColor: 'text-blue-600',
    emptyLabel: '',
  },
  neutral: {
    container: 'border-gray-100 bg-gray-50',
    icon: <Minus className="w-3.5 h-3.5 text-gray-300 mt-0.5 flex-shrink-0" />,
    labelColor: 'text-gray-500',
    valueColor: 'text-gray-400',
    emptyLabel: 'Non presente',
  },
};

function ColumnCard({ definition, mappedHeader, variant }: ColumnCardProps) {
  const s = VARIANT_STYLES[variant];
  const found = mappedHeader !== undefined;

  return (
    <div
      className={cn(
        'flex items-start gap-2.5 px-3 py-2.5 rounded-lg border text-xs',
        s.container,
      )}
    >
      {s.icon}
      <div className="min-w-0 flex-1">
        <p className={cn('font-semibold truncate', s.labelColor)}>
          {definition.label}
        </p>
        {found ? (
          <p className={cn('mt-0.5 font-mono truncate text-[11px]', s.valueColor)}>
            → &quot;{mappedHeader}&quot;
          </p>
        ) : (
          <p className={cn('mt-0.5 text-[11px]', s.valueColor)}>
            {s.emptyLabel}
          </p>
        )}
      </div>
    </div>
  );
}
