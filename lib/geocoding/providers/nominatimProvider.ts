/**
 * NominatimProvider — implementazione di IGeocodingProvider per Nominatim.
 *
 * Nominatim è il geocoder gratuito di OpenStreetMap.
 * Non richiede API key, ma impone un rate limit di 1 richiesta/secondo
 * e richiede l'identificazione tramite User-Agent.
 *
 * Documentazione ufficiale: https://nominatim.org/release-docs/develop/api/Search/
 * Policy d'uso: https://operations.osmfoundation.org/policies/nominatim/
 *
 * ─── Come usarlo ──────────────────────────────────────────────────────────────
 *
 *   import { NominatimProvider } from '@/lib/geocoding/providers/nominatimProvider';
 *   import { GeocodingService } from '@/lib/geocoding/service';
 *
 *   const service = new GeocodingService(new NominatimProvider());
 *
 * ─── Come sostituirlo ─────────────────────────────────────────────────────────
 *
 *   Creare un nuovo file `providers/myProvider.ts` che implementa IGeocodingProvider,
 *   poi passare la nuova istanza al costruttore di GeocodingService.
 *   Nessun'altra modifica è necessaria.
 *
 * ─── Istanza self-hosted ──────────────────────────────────────────────────────
 *
 *   new NominatimProvider({ baseUrl: 'http://my-nominatim-server:8080' })
 *
 * ─── Implementazione ─────────────────────────────────────────────────────────
 *
 *   L'implementazione HTTP reale è prevista nella Milestone 3.
 *   Questa classe definisce già la struttura, la configurazione e le
 *   firme dei metodi — pronti per essere completati.
 */

import type { IGeocodingProvider } from './IGeocodingProvider';
import type { GeocodingAddress, GeocodingResult, GeocodingConfidence, GeocodingCandidate } from '../types';
import { buildSearchQuery } from '../utils';

// ─── Nominatim response type ─────────────────────────────────────────────────

interface NominatimSearchResult {
  lat: string;
  lon: string;
  display_name: string;
  importance: number;
  /** Precisione del risultato: 30 = edificio, 28 = via, 26 = località, <25 = quartiere/città */
  place_rank?: number;
}

// ─── Configurazione ───────────────────────────────────────────────────────────

export interface NominatimProviderConfig {
  /**
   * URL base dell'API Nominatim.
   * Utile per usare un'istanza self-hosted o un mirror.
   * Default: "https://nominatim.openstreetmap.org"
   */
  baseUrl?: string;

  /**
   * User-Agent HTTP da inviare nelle richieste.
   * Nominatim richiede che identifichi l'applicazione e includa
   * un contatto (email o URL del progetto).
   * Default: "CourierLab/1.0 (courier-route-planner)"
   */
  userAgent?: string;

  /**
   * Codice paese da passare al parametro `countrycodes` di Nominatim
   * per restringere i risultati a un paese specifico (ISO 3166-1 alpha-2).
   * Default: "it" (Italia)
   */
  countryCode?: string;
}

const DEFAULT_CONFIG: Required<NominatimProviderConfig> = {
  baseUrl: 'https://nominatim.openstreetmap.org',
  userAgent: 'CourierLab/1.0 (courier-route-planner)',
  countryCode: 'it',
};

// ─── Provider ─────────────────────────────────────────────────────────────────

export class NominatimProvider implements IGeocodingProvider {
  readonly name = 'Nominatim / OpenStreetMap';
  readonly supportsBatch = false;

  private readonly config: Required<NominatimProviderConfig>;

  constructor(config: NominatimProviderConfig = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Geocodifica un indirizzo tramite l'API Nominatim Search.
   *
   * Chiamata: GET /search?q=...&format=jsonv2&limit=1&countrycodes=it
   *
   * @throws Error in caso di errore HTTP o di rete (gestito da GeocodingService con retry).
   * @returns Il risultato del geocoding, oppure `null` se nessun risultato trovato.
   */
  async geocode(address: GeocodingAddress): Promise<GeocodingResult | null> {
    const query = buildSearchQuery(address);

    const url = new URL(`${this.config.baseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', '1');
    url.searchParams.set('countrycodes', this.config.countryCode);
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as NominatimSearchResult[];

    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    const first = data[0];

    // Scarta risultati troppo generici (quartiere, città, provincia…):
    // place_rank < 25 indica che Nominatim ha trovato solo un'area, non una via/civico.
    if ((first.place_rank ?? 0) < 25) {
      return null;
    }

    const lat = parseFloat(first.lat);
    const lng = parseFloat(first.lon);

    if (isNaN(lat) || isNaN(lng)) {
      return null;
    }

    const importance = first.importance ?? 0;
    const confidence: GeocodingConfidence =
      importance >= 0.7 ? 'high' : importance >= 0.4 ? 'medium' : 'low';

    return {
      input: address,
      coordinates: { lat, lng },
      displayName: first.display_name,
      confidence,
      status: 'success',
      fromCache: false,
      provider: this.name,
    };
  }

  /**
   * Restituisce fino a `limit` candidati per un indirizzo.
   * Usato dal popup di selezione manuale.
   */
  async geocodeCandidates(address: GeocodingAddress, limit = 5): Promise<GeocodingCandidate[]> {
    const query = buildSearchQuery(address);

    const url = new URL(`${this.config.baseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'jsonv2');
    url.searchParams.set('limit', String(limit));
    url.searchParams.set('countrycodes', this.config.countryCode);
    url.searchParams.set('addressdetails', '0');

    const response = await fetch(url.toString(), {
      headers: {
        'User-Agent': this.config.userAgent,
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as NominatimSearchResult[];
    if (!Array.isArray(data)) return [];

    return data
      .map((item) => {
        // Stessa soglia di place_rank applicata a geocode(): scarta risultati generici
        if ((item.place_rank ?? 0) < 25) return null;
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        if (isNaN(lat) || isNaN(lng)) return null;
        const importance = item.importance ?? 0;
        const confidence: GeocodingConfidence =
          importance >= 0.7 ? 'high' : importance >= 0.4 ? 'medium' : 'low';
        return { displayName: item.display_name, coordinates: { lat, lng }, confidence };
      })
      .filter((c): c is GeocodingCandidate => c !== null);
  }

  /**
   * URL dell'endpoint di geocoding costruita dai parametri di configurazione.
   * Esposta come getter per facilitare il testing e il logging.
   */
  get searchEndpoint(): string {
    return `${this.config.baseUrl}/search`;
  }
}
