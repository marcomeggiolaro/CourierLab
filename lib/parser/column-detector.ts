/**
 * CourierLab — Column Detector
 *
 * Rileva automaticamente il tipo di ogni colonna dal nome dell'intestazione
 * usando un algoritmo di fuzzy matching basato su keyword normalizzate.
 *
 * ─── Come estendere ───────────────────────────────────────────────────────
 * Per aggiungere un nuovo tipo di colonna:
 *   1. Aggiungi il tipo a `ColumnType`
 *   2. Aggiungi la definizione in `COLUMN_DEFINITIONS`
 * ─────────────────────────────────────────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────────────────

/** Tutti i tipi di colonna supportati */
export type ColumnType =
  | 'address'
  | 'sparoLat'
  | 'sparoLng'
  | 'streetNumber'
  | 'cap'
  | 'city'
  | 'province'
  | 'recipient'
  | 'companyName'
  | 'phone'
  | 'notes';

export interface ColumnDefinition {
  /** Identificatore interno */
  type: ColumnType;
  /** Label human-readable per la UI */
  label: string;
  /** Se true, questa colonna è necessaria per il geocoding */
  required: boolean;
  /** Keyword normalizzate per il matching (case/accent-insensitive) */
  keywords: string[];
}

/** Mappa tipo → nome originale della colonna nell'Excel */
export type DetectedColumnMap = Partial<Record<ColumnType, string>>;

// ─── Column Definitions ───────────────────────────────────────────────────────

export const COLUMN_DEFINITIONS: ColumnDefinition[] = [
  {
    type: 'address',
    label: 'Indirizzo',
    required: true,
    keywords: [
      'indirizzo',
      'indirizzo consegna',
      'indirizzo destinatario',
      'indirizzo dest',
      'indirizzo spedizione',
      'via',
      'via consegna',
      'viale',
      'piazza',
      'corso',
      'strada',
      'localizzazione',
      'addr',
      'address',
      'delivery address',
      'ship to address',
    ],
  },
  {
    // Latitudine del punto SPARO/Palmare già presente nel file Excel.
    // Viene rilevata PRIMA di streetNumber per evitare che colonne "N"
    // (convenzione GIS italiana per latitudine Nord) vengano confuse
    // con il numero civico.
    type: 'sparoLat',
    label: 'Lat SPARO',
    required: false,
    keywords: [
      'n',           // convenzione italiana latitudine Nord (es. colonna "N")
      'lat',
      'latitudine',
      'latitude',
      'latit',
      'lat sparo',
      'latitude sparo',
      'coord n',
      'coordinata n',
      'y',
    ],
  },
  {
    // Longitudine del punto SPARO/Palmare già presente nel file Excel.
    type: 'sparoLng',
    label: 'Lng SPARO',
    required: false,
    keywords: [
      'e',           // convenzione italiana longitudine Est (es. colonna "E")
      'lon',
      'lng',
      'longitudine',
      'longitude',
      'longit',
      'lon sparo',
      'lng sparo',
      'longitude sparo',
      'coord e',
      'coordinata e',
      'x',
    ],
  },
  {
    type: 'streetNumber',
    label: 'Numero Civico',
    required: false,
    keywords: [
      'civico',
      'n civico',
      'numero civico',
      'ncivico',
      'num civico',
      'n.',
      'num',
      'snc',
      'house number',
      'housenumber',
    ],
  },
  {
    type: 'cap',
    label: 'CAP',
    required: true,
    keywords: [
      'cap',
      'cap destinazione',
      'cap dest',
      'c.a.p',
      'c a p',
      'codice postale',
      'codice avviamento',
      'postal code',
      'postcode',
      'zip',
      'zip code',
      'zipcode',
      'codigo postal',
    ],
  },
  {
    type: 'city',
    label: 'Città',
    required: true,
    keywords: [
      'citta',
      'città',
      'comune',
      'localita',
      'località',
      'luogo',
      'town',
      'city',
      'paese',
      'borgo',
      'municipio',
      'comune destinatario',
      'citta destinatario',
      'citta dest',
    ],
  },
  {
    type: 'province',
    label: 'Provincia',
    required: false,
    keywords: [
      'provincia',
      'prov',
      'pr',
      'sigla provincia',
      'sigla prov',
      'province',
      'region',
      'regione',
      'stato',
    ],
  },
  {
    type: 'recipient',
    label: 'Destinatario',
    required: false,
    keywords: [
      'destinatario',
      'dest',
      'nome destinatario',
      'cognome destinatario',
      'nome e cognome',
      'nome',
      'nominativo',
      'cognome',
      'intestatario',
      'consegnatario',
      'recipient',
      'name',
      'cliente',
      'beneficiario',
    ],
  },
  {
    type: 'companyName',
    label: 'Ragione Sociale',
    required: false,
    keywords: [
      'ragione sociale',
      'rag soc',
      'ragsoc',
      'azienda',
      'societa',
      'società',
      'ditta',
      'impresa',
      'denominazione',
      'company',
      'firm',
      'business name',
    ],
  },
  {
    type: 'phone',
    label: 'Telefono',
    required: false,
    keywords: [
      'telefono',
      'tel',
      'cellulare',
      'cell',
      'mobile',
      'phone',
      'numero telefono',
      'tel destinatario',
      'contatto telefonico',
      'recapito',
    ],
  },
  {
    type: 'notes',
    label: 'Note',
    required: false,
    keywords: [
      'note',
      'annotazioni',
      'memo',
      'info',
      'informazioni',
      'osservazioni',
      'descrizione',
      'commento',
      'istruzioni consegna',
      'notes',
      'remarks',
    ],
  },
];

// ─── Normalisation ────────────────────────────────────────────────────────────

/**
 * Normalizza una stringa per il matching:
 * - lowercase
 * - rimuove diacritici (accenti)
 * - sostituisce caratteri non alfanumerici con spazi
 * - collassa spazi multipli
 */
function normalise(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // rimuove diacritici
    .replace(/[^a-z0-9\s]/g, ' ')   // non-alfanumerici → spazio
    .replace(/\s+/g, ' ')           // collassa spazi
    .trim();
}

// ─── Scoring ─────────────────────────────────────────────────────────────────

/**
 * Calcola il punteggio di corrispondenza tra un'intestazione e una definizione.
 *
 * Scala di punteggio:
 *   100 — corrispondenza esatta
 *    80 — header inizia con la keyword
 *    60 — header contiene la keyword (solo keyword ≥ 2 caratteri,
 *          per evitare che "n" in "destinazione" batta "cap" in "cap destinazione")
 *    40 — keyword contiene l'header (header è substring della keyword)
 *     0 — nessuna corrispondenza
 */
function scoreMatch(header: string, definition: ColumnDefinition): number {
  const normHeader = normalise(header);
  if (!normHeader) return 0;

  let best = 0;

  for (const keyword of definition.keywords) {
    const normKeyword = normalise(keyword);

    if (normHeader === normKeyword) return 100;

    if (normHeader.startsWith(normKeyword)) {
      best = Math.max(best, 80);
    } else if (
      normKeyword.length >= 2 &&   // evita che singoli caratteri come "n"
      normHeader.includes(normKeyword) //  matchino per sottostringa in parole lunghe
    ) {
      best = Math.max(best, 60);
    } else if (
      normKeyword.includes(normHeader) &&
      normHeader.length > 2 // evita false positive su stringhe corte come "n"
    ) {
      best = Math.max(best, 40);
    }
  }

  return best;
}

/** Soglia minima per considerare valida una corrispondenza */
const MATCH_THRESHOLD = 40;

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Rileva i tipi di colonna da una lista di intestazioni.
 *
 * Ogni tipo di colonna viene assegnato al massimo a un'intestazione
 * (la migliore corrispondenza sopra la soglia).
 * Ogni intestazione viene assegnata al massimo a un tipo.
 */
export function detectColumns(headers: string[]): DetectedColumnMap {
  const result: DetectedColumnMap = {};
  const assignedHeaders = new Set<string>();

  for (const definition of COLUMN_DEFINITIONS) {
    let bestScore = 0;
    let bestHeader: string | null = null;

    for (const header of headers) {
      if (!header?.trim()) continue;
      if (assignedHeaders.has(header)) continue;

      const score = scoreMatch(header, definition);
      if (score > bestScore) {
        bestScore = score;
        bestHeader = header;
      }
    }

    if (bestScore >= MATCH_THRESHOLD && bestHeader !== null) {
      result[definition.type] = bestHeader;
      assignedHeaders.add(bestHeader);
    }
  }

  return result;
}

/**
 * Restituisce le definizioni delle colonne obbligatorie non trovate.
 */
export function getMissingRequiredColumns(
  detected: DetectedColumnMap,
): ColumnDefinition[] {
  return COLUMN_DEFINITIONS.filter(
    (def) => def.required && detected[def.type] == null,
  );
}
