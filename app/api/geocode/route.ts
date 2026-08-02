/**
 * POST /api/geocode
 *
 * Proxy server-side per Nominatim con:
 * 1. Pulizia indirizzo (rimozione "SNC", virgole ridondanti)
 * 2. Strategia di fallback progressivo per massimizzare le corrispondenze:
 *    Tentativo 1 → indirizzo completo ripulito
 *    Tentativo 2 → senza numero civico
 *    Tentativo 3 → solo CAP + comune
 *
 * Il delay di 1,1s tra i tentativi rispetta la policy di Nominatim (1 req/s).
 */

import { NextRequest, NextResponse } from 'next/server';
import { NominatimProvider } from '@/lib/geocoding/providers/nominatimProvider';
import type { GeocodingAddress } from '@/lib/geocoding/types';

const provider = new NominatimProvider();

interface RequestBody {
  address: GeocodingAddress;
  /** Se true, restituisce fino a 5 candidati invece del singolo risultato migliore */
  candidates?: boolean;
}

// Ritardo minimo tra chiamate Nominatim (policy: 1 req/s)
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Rimuove dall'indirizzo elementi che confondono Nominatim:
 * - "SNC" (Senza Numero Civico) — abbreviazione postale italiana sconosciuta a OSM
 * - Spazi ridondanti
 */
function cleanStreet(street?: string): string | undefined {
  if (!street) return undefined;
  const cleaned = street
    .replace(/\bSNC\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  return cleaned || undefined;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── Parsing body ────────────────────────────────────────────────────────
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  if (!body?.address || typeof body.address !== 'object') {
    return NextResponse.json(
      { error: 'Campo "address" mancante o non valido' },
      { status: 400 },
    );
  }

  const addr = body.address;
  const cleaned: GeocodingAddress = { ...addr, street: cleanStreet(addr.street) };

  // ── Modalità candidates: restituisce più opzioni per la selezione manuale ───
  if (body.candidates) {
    try {
      const candidates = await provider.geocodeCandidates(cleaned, 5);
      return NextResponse.json({ candidates });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Errore provider';
      return NextResponse.json({ error: msg }, { status: 502 });
    }
  }

  // ── Tentativo 1: indirizzo completo (pulito) ─────────────────────────────
  try {
    const result = await provider.geocode(cleaned);
    if (result !== null) return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore provider';
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  // ── Tentativo 2: senza numero civico ─────────────────────────────────────
  if (cleaned.streetNumber) {
    await sleep(1100);
    try {
      const result = await provider.geocode({ ...cleaned, streetNumber: undefined });
      if (result !== null) return NextResponse.json({ result });
    } catch { /* ignora, prova fallback successivo */ }
  }

  // ── Tentativo 3: solo CAP + comune ───────────────────────────────────────
  if (cleaned.postalCode || cleaned.city) {
    await sleep(1100);
    try {
      const result = await provider.geocode({
        postalCode: cleaned.postalCode,
        city: cleaned.city,
        country: cleaned.country ?? 'Italy',
      });
      if (result !== null) return NextResponse.json({ result });
    } catch { /* fallback esaurito */ }
  }

  return NextResponse.json({ result: null });
}
