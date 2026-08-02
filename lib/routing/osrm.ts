/**
 * CourierLab — OSRM Routing Service
 *
 * Calcola distanze stradali tramite OSRM (Open Source Routing Machine).
 * Endpoint pubblico: https://router.project-osrm.org
 *
 * @see http://project-osrm.org/docs/v5.5.1/api/
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
}

export interface RoutingOptions {
  /** Endpoint OSRM (default: https://router.project-osrm.org) */
  endpoint?: string;
  /** Profilo di routing (default: 'driving') */
  profile?: 'driving' | 'cycling' | 'walking';
}

// ─── Tipi risposta OSRM ───────────────────────────────────────────────────────

interface OsrmRoute {
  distance: number;   // metri
  duration: number;   // secondi
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
}

// ─── Implementazione ──────────────────────────────────────────────────────────

const DEFAULT_ENDPOINT = 'https://router.project-osrm.org';
const DEFAULT_PROFILE  = 'driving';

/**
 * Calcola il percorso stradale tra due punti tramite OSRM.
 * Restituisce null se OSRM non trova un percorso.
 *
 * @throws Error in caso di errore HTTP o di rete.
 */
export async function calculateRoute(
  from: Coordinates,
  to: Coordinates,
  options?: RoutingOptions,
): Promise<RouteResult | null> {
  const endpoint = options?.endpoint ?? DEFAULT_ENDPOINT;
  const profile  = options?.profile  ?? DEFAULT_PROFILE;

  // OSRM vuole le coordinate in formato lng,lat (longitudine prima)
  const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
  const url = `${endpoint}/route/v1/${profile}/${coords}?overview=false`;

  const response = await fetch(url, {
    headers: { 'User-Agent': 'CourierLab/1.0 (courier-route-planner)' },
  });

  if (!response.ok) {
    throw new Error(`OSRM HTTP ${response.status}: ${response.statusText}`);
  }

  const data = (await response.json()) as OsrmResponse;

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    return null;
  }

  const route = data.routes[0];
  return {
    distanceKm:      route.distance / 1000,
    durationMinutes: route.duration / 60,
  };
}
