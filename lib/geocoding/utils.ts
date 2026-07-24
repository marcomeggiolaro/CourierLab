/**
 * Funzioni di utilità per il sistema di geocoding.
 *
 * Responsabilità:
 * - Normalizzazione degli indirizzi (garantisce chiavi di cache coerenti
 *   anche con varianti di maiuscole, diacritici o spazi ridondanti)
 * - Costruzione della query testuale per i provider (formato libero)
 * - Validazione delle coordinate WGS84
 *
 * Queste funzioni sono pure (nessun side-effect, nessuna dipendenza esterna)
 * e possono essere usate sia da GeocodingService sia da NominatimProvider.
 */

import type { GeocodingAddress, Coordinates } from './types';

// ─── Normalizzazione ──────────────────────────────────────────────────────────

/**
 * Normalizza una stringa per la comparazione:
 * - rimuove diacritici (à → a, é → e, …)
 * - converte in minuscolo
 * - collassa spazi multipli e rimuove spazi iniziali/finali
 *
 * @example
 *   normalise("Via Città d'Aosta") → "via citta d'aosta"
 */
function normalise(s: string): string {
  return s
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '') // rimuove combining diacritical marks
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Chiave di cache ──────────────────────────────────────────────────────────

/**
 * Genera una chiave di cache univoca e normalizzata per un indirizzo.
 *
 * I componenti usati per la chiave sono: street, streetNumber, postalCode, city.
 * Province e country sono omessi perché ridondanti per la deduplication
 * (due indirizzi con stessa via/CAP/città ma province diverse sono lo stesso luogo).
 *
 * La chiave è separata da `|` per evitare collisioni tra campi adiacenti.
 *
 * @example
 *   buildCacheKey({ street: "Via Roma", streetNumber: "1", postalCode: "00100", city: "Roma" })
 *   → "via roma|1|00100|roma"
 */
export function buildCacheKey(address: GeocodingAddress): string {
  return [
    address.street,
    address.streetNumber,
    address.postalCode,
    address.city,
  ]
    .filter(Boolean)
    .map((part) => normalise(part!))
    .join('|');
}

// ─── Query testuale ───────────────────────────────────────────────────────────

/**
 * Costruisce una stringa di ricerca in formato libero da inviare
 * a un provider di geocoding (Nominatim, Photon, ecc.).
 *
 * Il formato segue la convenzione italiana:
 * "[Via] [N°], [CAP] [Comune], [Provincia], [Paese]"
 *
 * @example
 *   buildSearchQuery({ street: "Via Roma", streetNumber: "1", postalCode: "00100", city: "Roma" })
 *   → "Via Roma 1, 00100 Roma, Italy"
 *
 *   buildSearchQuery({ city: "Milano", province: "MI" })
 *   → "Milano, MI, Italy"
 */
export function buildSearchQuery(address: GeocodingAddress): string {
  const parts: string[] = [];

  if (address.street) {
    parts.push(
      address.streetNumber
        ? `${address.street} ${address.streetNumber}`
        : address.street,
    );
  }

  if (address.postalCode && address.city) {
    parts.push(`${address.postalCode} ${address.city}`);
  } else if (address.city) {
    parts.push(address.city);
  } else if (address.postalCode) {
    parts.push(address.postalCode);
  }

  if (address.province) {
    parts.push(address.province);
  }

  parts.push(address.country ?? 'Italy');

  return parts.join(', ');
}

// ─── Validazione coordinate ───────────────────────────────────────────────────

/**
 * Verifica che le coordinate rientrino nei range validi WGS84.
 *
 * - Latitudine: [-90, +90]
 * - Longitudine: [-180, +180]
 */
export function isValidCoordinates(coords: Coordinates): boolean {
  return (
    Number.isFinite(coords.lat) &&
    Number.isFinite(coords.lng) &&
    coords.lat >= -90 &&
    coords.lat <= 90 &&
    coords.lng >= -180 &&
    coords.lng <= 180
  );
}

/**
 * Verifica se un indirizzo ha abbastanza informazioni per essere geocodificato.
 * Un indirizzo minimale richiede almeno un comune o un CAP.
 */
export function isGeocodeableAddress(address: GeocodingAddress): boolean {
  return Boolean(address.city || address.postalCode);
}
