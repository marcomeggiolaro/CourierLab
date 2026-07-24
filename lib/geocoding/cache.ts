/**
 * Sistema di cache per i risultati di geocoding.
 *
 * ─── Architettura ─────────────────────────────────────────────────────────────
 *
 * L'interfaccia `IGeocodingCache` definisce il contratto che tutte le
 * implementazioni devono rispettare. GeocodingService dipende SOLO
 * dall'interfaccia — non sa né si preoccupa di dove i dati vengono salvati.
 *
 * Implementazioni previste (in ordine crescente di persistenza):
 *
 *   ① InMemoryGeocodingCache  ← implementata qui (usata ora)
 *      Scope: elaborazione corrente (si svuota al ricaricamento della pagina)
 *      Uso: evitare richieste duplicate nella stessa sessione
 *
 *   ② IndexedDBGeocodingCache  ← Milestone futura
 *      Scope: browser (persiste tra sessioni)
 *      Uso: non ricaricare coordinate già note per indirizzi frequenti
 *
 *   ③ ServerSideCache (SQLite / Redis)  ← se l'app diventa server-side
 *      Scope: server (condivisa tra tutti gli utenti)
 *
 * Per cambiare implementazione: passare la nuova istanza al costruttore
 * di GeocodingService — il resto del codice non cambia.
 */

import type { GeocodingAddress, GeocodingResult } from './types';
import { buildCacheKey } from './utils';

// ─── Interfaccia ──────────────────────────────────────────────────────────────

/**
 * Contratto che ogni implementazione di cache per il geocoding deve rispettare.
 *
 * Tutti i metodi sono asincroni per essere compatibili con implementazioni
 * che accedono a storage asincroni (IndexedDB, fetch, filesystem).
 */
export interface IGeocodingCache {
  /**
   * Recupera un risultato dalla cache dato un indirizzo.
   * @returns Il risultato con `fromCache: true`, oppure `null` se non presente.
   */
  get(address: GeocodingAddress): Promise<GeocodingResult | null>;

  /**
   * Salva un risultato in cache associandolo all'indirizzo fornito.
   * I risultati falliti vengono comunque cachati per evitare retry inutili.
   */
  set(address: GeocodingAddress, result: GeocodingResult): Promise<void>;

  /** Svuota completamente la cache. */
  clear(): Promise<void>;

  /** Numero di voci attualmente in cache. */
  readonly size: number;
}

// ─── Implementazione in-memory ────────────────────────────────────────────────

/**
 * Cache in-memory basata su `Map<string, GeocodingResult>`.
 *
 * Scope: sessione corrente (vita dell'istanza di GeocodingService).
 * Garantisce che lo stesso indirizzo non venga geocodificato più di una volta
 * nella stessa elaborazione batch.
 *
 * @example
 *   const cache = new InMemoryGeocodingCache();
 *   const service = new GeocodingService(provider, {}, cache);
 */
export class InMemoryGeocodingCache implements IGeocodingCache {
  private readonly store = new Map<string, GeocodingResult>();

  get size(): number {
    return this.store.size;
  }

  async get(address: GeocodingAddress): Promise<GeocodingResult | null> {
    const key = buildCacheKey(address);
    const cached = this.store.get(key);
    if (!cached) return null;
    // Sovrascrive fromCache e status per chiarezza al chiamante
    return { ...cached, fromCache: true, status: 'cached' };
  }

  async set(address: GeocodingAddress, result: GeocodingResult): Promise<void> {
    const key = buildCacheKey(address);
    // Salva il risultato originale (senza fromCache: true)
    // Il flag verrà impostato a true solo quando il risultato viene recuperato
    this.store.set(key, result);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }
}
