/**
 * GeocodingService — punto di ingresso unico per il geocoding nell'app.
 *
 * ─── Responsabilità ───────────────────────────────────────────────────────────
 *
 * 1. Orchestrare il flusso: cache → provider → cache write → risultato
 * 2. Gestire retry con backoff esponenziale in caso di errori temporanei
 * 3. Eseguire il geocoding batch in sequenza (rispetta i rate limit dei provider)
 * 4. Notificare la UI tramite callback di progresso
 * 5. Esporre informazioni diagnostiche (cache size, provider name)
 *
 * ─── Cosa NON fa ──────────────────────────────────────────────────────────────
 *
 * - Non conosce Nominatim né nessun altro provider
 * - Non gestisce il rate limiting (responsabilità del provider in M3)
 * - Non conosce l'implementazione della cache
 *
 * ─── Utilizzo tipico ──────────────────────────────────────────────────────────
 *
 *   import { GeocodingService } from '@/lib/geocoding/service';
 *   import { NominatimProvider } from '@/lib/geocoding/providers/nominatimProvider';
 *
 *   const service = new GeocodingService(new NominatimProvider());
 *
 *   // Singolo indirizzo
 *   const result = await service.geocodeOne({ street: 'Via Roma', city: 'Milano' });
 *
 *   // Batch con progresso
 *   const results = await service.geocodeMany(addresses, ({ completed, total }) => {
 *     console.log(`${completed}/${total}`);
 *   });
 */

import type { IGeocodingProvider } from './providers/IGeocodingProvider';
import type { IGeocodingCache } from './cache';
import { InMemoryGeocodingCache } from './cache';
import type {
  GeocodingAddress,
  GeocodingResult,
  GeocodingServiceOptions,
  GeocodingProgressCallback,
} from './types';
import { isGeocodeableAddress } from './utils';

// ─── Classe ───────────────────────────────────────────────────────────────────

export class GeocodingService {
  private readonly provider: IGeocodingProvider;
  private readonly cache: IGeocodingCache;
  private readonly opts: Required<GeocodingServiceOptions>;

  /**
   * @param provider - Implementazione concreta del geocoding (es. NominatimProvider).
   * @param options  - Opzioni di configurazione del servizio.
   * @param cache    - Implementazione della cache. Default: InMemoryGeocodingCache.
   */
  constructor(
    provider: IGeocodingProvider,
    options: GeocodingServiceOptions = {},
    cache: IGeocodingCache = new InMemoryGeocodingCache(),
  ) {
    this.provider = provider;
    this.cache = cache;
    this.opts = {
      enableCache: options.enableCache ?? true,
      maxRetries: options.maxRetries ?? 2,
    };
  }

  // ─── Proprietà diagnostiche ─────────────────────────────────────────────────

  /** Nome del provider attivo. Usato per attribuzioni e logging nella UI. */
  get providerName(): string {
    return this.provider.name;
  }

  /** Numero di voci attualmente in cache. */
  get cacheSize(): number {
    return this.cache.size;
  }

  // ─── Geocoding singolo ──────────────────────────────────────────────────────

  /**
   * Geocodifica un singolo indirizzo.
   *
   * Flusso:
   *   1. Se l'indirizzo è vuoto/insufficiente → restituisce `status: 'skipped'`
   *   2. Se la cache è abilitata → controlla la cache (cache hit → ritorna subito)
   *   3. Chiama il provider (con retry + backoff esponenziale)
   *   4. Salva il risultato in cache (anche i fallimenti evitano retry inutili)
   *   5. Restituisce il risultato
   *
   * Non lancia mai eccezioni — gli errori sono incapsulati nel risultato
   * con `status: 'failed'` e `error: <messaggio>`.
   */
  async geocodeOne(address: GeocodingAddress): Promise<GeocodingResult> {
    // ── Indirizzo insufficiente ───────────────────────────────────────────
    if (!isGeocodeableAddress(address)) {
      return {
        input: address,
        coordinates: null,
        status: 'skipped',
        fromCache: false,
        provider: this.provider.name,
        error: 'Indirizzo insufficiente: mancano comune e CAP',
      };
    }

    // ── Cache hit ─────────────────────────────────────────────────────────
    if (this.opts.enableCache) {
      const cached = await this.cache.get(address);
      if (cached !== null) {
        return cached; // già con fromCache: true, status: 'cached'
      }
    }

    // ── Chiamata al provider (con retry) ──────────────────────────────────
    let result: GeocodingResult;
    let lastError: unknown;

    for (let attempt = 0; attempt < this.opts.maxRetries; attempt++) {
      try {
        const providerResult = await this.provider.geocode(address);

        if (providerResult === null) {
          // Il provider non ha trovato risultati (non è un errore recuperabile)
          result = {
            input: address,
            coordinates: null,
            status: 'failed',
            fromCache: false,
            provider: this.provider.name,
            error: 'Nessun risultato trovato per questo indirizzo',
          };
        } else {
          result = {
            ...providerResult,
            status: 'success',
            fromCache: false,
            provider: this.provider.name,
          };
        }

        // ── Cache write ─────────────────────────────────────────────────
        if (this.opts.enableCache) {
          await this.cache.set(address, result);
        }

        return result;
      } catch (err) {
        lastError = err;
        const isLastAttempt = attempt === this.opts.maxRetries - 1;
        if (!isLastAttempt) {
          // Backoff esponenziale: 500ms → 1000ms → 2000ms → …
          await sleep(500 * Math.pow(2, attempt));
        }
      }
    }

    // ── Fallimento definitivo ─────────────────────────────────────────────
    result = {
      input: address,
      coordinates: null,
      status: 'failed',
      fromCache: false,
      provider: this.provider.name,
      error:
        lastError instanceof Error
          ? lastError.message
          : 'Errore sconosciuto durante il geocoding',
    };

    if (this.opts.enableCache) {
      await this.cache.set(address, result);
    }

    return result;
  }

  // ─── Geocoding batch ────────────────────────────────────────────────────────

  /**
   * Geocodifica una lista di indirizzi in sequenza.
   *
   * L'elaborazione sequenziale (non parallela) è deliberata:
   * i provider free-tier come Nominatim limitano a 1 req/s.
   * Il rate limiting effettivo (sleep tra richieste) sarà gestito
   * dal provider in Milestone 3.
   *
   * @param addresses  - Lista di indirizzi da geocodificare.
   * @param onProgress - Callback opzionale chiamata dopo ogni indirizzo.
   *                     Usata per aggiornare barre di avanzamento nella UI.
   * @returns Lista di risultati nello stesso ordine degli input.
   */
  async geocodeMany(
    addresses: GeocodingAddress[],
    onProgress?: GeocodingProgressCallback,
  ): Promise<GeocodingResult[]> {
    const results: GeocodingResult[] = [];

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];
      const result = await this.geocodeOne(address);
      results.push(result);

      onProgress?.({
        completed: i + 1,
        total: addresses.length,
        current: address,
        result,
      });
    }

    return results;
  }

  // ─── Gestione cache ─────────────────────────────────────────────────────────

  /** Svuota la cache corrente (utile per forzare un nuovo geocoding). */
  async clearCache(): Promise<void> {
    await this.cache.clear();
  }
}

// ─── Helpers interni ──────────────────────────────────────────────────────────

/** Attende `ms` millisecondi. Usato per il backoff esponenziale nei retry. */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
