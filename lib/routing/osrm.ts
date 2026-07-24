/**
 * CourierLab — OSRM Routing Service
 *
 * Calcola distanze e tempi di percorrenza su strada tramite OSRM.
 * Endpoint pubblico: https://router.project-osrm.org
 *
 * @see http://project-osrm.org/docs/v5.5.1/api/
 *
 * ─── TODO: Implementare nella Milestone 4 ────────────────────────────────────
 */

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface RouteResult {
  /** Distanza stradale in chilometri */
  distanceKm: number;
  /** Durata stimata in minuti */
  durationMinutes: number;
  /** Geometria del percorso (GeoJSON, se richiesta) */
  geometry?: string;
}

export interface RoutingOptions {
  /** Endpoint OSRM (default: https://router.project-osrm.org) */
  endpoint?: string;
  /** Profilo di routing (default: 'driving') */
  profile?: 'driving' | 'cycling' | 'walking';
}

// ─── Stubs ────────────────────────────────────────────────────────────────────

/**
 * Calcola il percorso stradale tra due punti.
 * Restituisce null se il percorso non è calcolabile.
 */
export async function calculateRoute(
  _from: Coordinates,
  _to: Coordinates,
  _options?: RoutingOptions,
): Promise<RouteResult | null> {
  throw new Error(
    'Routing non ancora implementato — disponibile nella Milestone 4.',
  );
}

/**
 * Calcola la matrice distanze tra N origini e M destinazioni.
 */
export async function calculateDistanceMatrix(
  _origins: Coordinates[],
  _destinations: Coordinates[],
  _options?: RoutingOptions,
): Promise<(RouteResult | null)[][]> {
  throw new Error(
    'Distance matrix non ancora implementata — disponibile nella Milestone 4.',
  );
}
