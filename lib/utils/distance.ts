/**
 * Calcolo distanze geografiche.
 *
 * Usa la formula di Haversine che restituisce la distanza in linea d'aria
 * tra due punti GPS sulla superficie terrestre.
 *
 * Precisione: ±0,5% rispetto alla distanza reale, sufficiente per
 * associare ogni spedizione al punto SPARO/Palmare più vicino.
 */

const EARTH_RADIUS_KM = 6371;

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Restituisce la distanza in km (linea d'aria) tra due coordinate GPS.
 *
 * @example
 *   haversineDistance(38.675, 15.898, 38.660, 15.900) → ~1.67 km
 */
export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}
