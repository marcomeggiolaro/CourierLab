/**
 * CourierLab — Application Header
 *
 * Header sticky con logo, nome applicazione e tagline.
 * Componente server-side (nessun interattività richiesta).
 */
import { Package } from 'lucide-react';

export default function Header() {
  return (
    <header
      className="border-b bg-white sticky top-0 z-50"
      style={{ borderColor: 'var(--border)' }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white shadow-sm"
            style={{ background: 'var(--primary)' }}
          >
            <Package className="w-4 h-4" />
          </div>
          <div className="leading-none">
            <p className="font-bold text-sm tracking-tight text-gray-900">
              CourierLab
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              Pianificazione giri corrieri
            </p>
          </div>
        </div>

        {/* Info tecnologie */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-400">
          <span className="px-2 py-1 rounded bg-gray-50 border border-gray-100 font-mono">
            OpenStreetMap
          </span>
          <span className="text-gray-300">·</span>
          <span className="px-2 py-1 rounded bg-gray-50 border border-gray-100 font-mono">
            OSRM
          </span>
        </div>
      </div>
    </header>
  );
}
