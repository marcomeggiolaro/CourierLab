/**
 * POST /api/route-distance
 *
 * Proxy server-side per OSRM: calcola la distanza stradale (percorso più breve)
 * tra due punti GPS tramite l'API pubblica di router.project-osrm.org.
 *
 * Restituisce i km stradali reali, NON la distanza in linea d'aria.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateRoute } from '@/lib/routing/osrm';

interface RequestBody {
  from: { lat: number; lng: number };
  to:   { lat: number; lng: number };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: 'Body JSON non valido' }, { status: 400 });
  }

  const { from, to } = body;
  if (
    typeof from?.lat !== 'number' || typeof from?.lng !== 'number' ||
    typeof to?.lat   !== 'number' || typeof to?.lng   !== 'number'
  ) {
    return NextResponse.json({ error: 'Coordinate non valide' }, { status: 400 });
  }

  try {
    const result = await calculateRoute(from, to);
    return NextResponse.json({ result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Errore OSRM';
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
