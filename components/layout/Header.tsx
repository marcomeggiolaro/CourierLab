/**
 * KmC — Application Header
 */
import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="max-w-7xl mx-auto px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Image
            src="/icon.png"
            alt="KmC"
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
        </Link>

        {/* Destra */}
        <div className="flex items-center gap-4">
          <Link
            href="/manuale"
            className="text-[11px] text-gray-500 hover:text-blue-600 font-medium transition-colors"
          >
            Manuale
          </Link>
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
      </div>
    </header>
  );
}
