/**
 * Tipi condivisi per il sistema di geocoding.
 *
 * IMPORTANTE: questo file non deve importare nulla dall'esterno del modulo.
 * Il resto dell'app dipende da questi tipi — qualsiasi provider o implementazione
 * li usa come contratto comune.
 */

// ─── Input ────────────────────────────────────────────────────────────────────

/**
 * Indirizzo strutturato in input al sistema di geocoding.
 * Tutti i campi sono opzionali per massima flessibilità con dati reali
 * (i file Excel raramente hanno tutti i campi compilati).
 */
export interface GeocodingAddress {
  /** Via / Corso / Piazza / Strada */
  street?: string;
  /** Numero civico */
  streetNumber?: string;
  /** CAP (Codice di Avviamento Postale) */
  postalCode?: string;
  /** Comune / Città */
  city?: string;
  /** Provincia — sigla (es. "RM") o nome esteso (es. "Roma") */
  province?: string;
  /** Paese. Default: "Italy" */
  country?: string;
}

// ─── Output ───────────────────────────────────────────────────────────────────

/** Coordinate geografiche WGS84. */
export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Livello di confidenza del risultato di geocoding.
 * - `high`: corrispondenza esatta su via + numero civico
 * - `medium`: corrispondenza su via senza numero, o CAP + comune
 * - `low`: corrispondenza solo su comune o area generica
 */
export type GeocodingConfidence = 'high' | 'medium' | 'low';

/**
 * Stato di una singola operazione di geocoding.
 * - `success`: coordinate trovate con successo dal provider
 * - `cached`: coordinate recuperate dalla cache (nessuna chiamata al provider)
 * - `failed`: nessun risultato trovato o errore definitivo
 * - `skipped`: elaborazione saltata (es. indirizzo vuoto)
 */
export type GeocodingStatus = 'success' | 'cached' | 'failed' | 'skipped';

/**
 * Candidato restituito da una ricerca multi-risultato.
 * Usato dal popup di selezione manuale dell'indirizzo.
 */
export interface GeocodingCandidate {
  displayName: string;
  coordinates: Coordinates;
  confidence: GeocodingConfidence;
}

/** Risultato completo di una singola operazione di geocoding. */
export interface GeocodingResult {
  /** Indirizzo originale fornito in input. */
  input: GeocodingAddress;
  /** Coordinate geografiche trovate. `null` se il geocoding è fallito. */
  coordinates: Coordinates | null;
  /** Indirizzo normalizzato restituito dal provider (display name). */
  displayName?: string;
  /** Livello di confidenza del risultato. */
  confidence?: GeocodingConfidence;
  /** Stato dell'operazione. */
  status: GeocodingStatus;
  /** Nome del provider che ha prodotto il risultato. */
  provider?: string;
  /** `true` se il risultato proviene dalla cache (nessuna chiamata di rete). */
  fromCache: boolean;
  /** Messaggio di errore, presente solo quando `status === 'failed'`. */
  error?: string;
}

// ─── Configurazione del servizio ──────────────────────────────────────────────

/** Opzioni di configurazione per GeocodingService. */
export interface GeocodingServiceOptions {
  /**
   * Abilita la cache in-memory per evitare richieste duplicate.
   * Default: `true`
   */
  enableCache?: boolean;
  /**
   * Numero massimo di tentativi per ogni indirizzo prima di
   * considerare il geocoding fallito.
   * Default: `2`
   */
  maxRetries?: number;
}

// ─── Callback di progresso ────────────────────────────────────────────────────

/**
 * Parametri passati alla callback di progresso durante il geocoding batch.
 * Permette alla UI di aggiornare barre di avanzamento e log in tempo reale.
 */
export interface GeocodingProgressParams {
  /** Numero di indirizzi elaborati finora (incluso quello corrente). */
  completed: number;
  /** Numero totale di indirizzi da elaborare. */
  total: number;
  /** Indirizzo appena elaborato. */
  current: GeocodingAddress;
  /** Risultato dell'elaborazione corrente. */
  result: GeocodingResult;
}

/** Callback da passare a `GeocodingService.geocodeMany()`. */
export type GeocodingProgressCallback = (
  params: GeocodingProgressParams,
) => void;
