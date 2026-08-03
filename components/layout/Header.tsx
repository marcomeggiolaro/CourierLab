/**
 * CourierLab — Application Header
 *
 * Header sticky con logo, nome applicazione e tagline.
 * Componente server-side (nessun interattività richiesta).
 */
import Image from 'next/image';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Image
            src="/icon.png"
            alt="CourierLab"
            width={40}
            height={40}
            className="rounded-xl shadow-sm"
            priority
          />
          <div className="leading-none">
            <p className="font-bold text-base tracking-tight text-gray-900">
              KmC
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Distance Check
            </p>
          </div>
        </div>

        {/* Info tecnologie */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-gray-400">
          <span className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 font-mono font-medium">
            OpenStreetMap
          </span>
          <span className="text-gray-300">·</span>
          <span className="px-2.5 py-1 rounded-md bg-gray-50 border border-gray-100 font-mono font-medium">
            OSRM
          </span>
        </div>
      </div>
    </header>
  );
}
