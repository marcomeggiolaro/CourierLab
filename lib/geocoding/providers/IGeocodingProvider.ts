/**
 * IGeocodingProvider — interfaccia che ogni provider di geocoding deve implementare.
 *
 * Design pattern: Strategy / Provider.
 *
 * GeocodingService dipende SOLO da questa interfaccia, mai da un provider
 * concreto. Questo garantisce che qualsiasi provider futuro (Google Maps,
 * HERE, Photon, un'istanza self-hosted, ecc.) possa essere integrato senza
 * modificare il codice del servizio o dell'app.
 *
 * Per aggiungere un nuovo provider:
 *   1. Creare un nuovo file in `providers/` (es. `photonProvider.ts`)
 *   2. Implementare questa interfaccia
 *   3. Passare il provider al costruttore di GeocodingService
 *   — Fine. Nessun'altra modifica è necessaria.
 */

import type { GeocodingAddress, GeocodingResult } from '../types';

export interface IGeocodingProvider {
  /**
   * Nome leggibile del provider.
   * Usato per logging, messaggi di errore e attribuzioni nella UI.
   *
   * @example "Nominatim / OpenStreetMap", "Google Maps Geocoding API"
   */
  readonly name: string;

  /**
   * Indica se il provider supporta chiamate batch native.
   *
   * - `true`: il provider ha un endpoint dedicato per richieste multiple
   *   → GeocodingService potrà ottimizzare le chiamate in futuro.
   * - `false`: il provider supporta solo richieste singole
   *   → GeocodingService eseguirà le richieste in sequenza.
   *
   * Nominatim non supporta batch nativi → `false`.
   */
  readonly supportsBatch: boolean;

  /**
   * Geocodifica un singolo indirizzo strutturato.
   *
   * Il provider è responsabile di:
   * - Costruire la query appropriata per la propria API
   * - Parsare la risposta nel formato GeocodingResult
   * - Lanciare un'eccezione in caso di errore non recuperabile
   *   (il GeocodingService gestirà i retry)
   *
   * @param address - Indirizzo strutturato da geocodificare.
   * @returns Il risultato del geocoding, oppure `null` se nessun risultato
   *          è stato trovato (l'indirizzo non esiste o è ambiguo).
   * @throws Error se la richiesta fallisce (errore di rete, HTTP 4xx/5xx, ecc.)
   */
  geocode(address: GeocodingAddress): Promise<GeocodingResult | null>;
}
