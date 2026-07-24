/**
 * CourierLab — Root Layout
 */
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'CourierLab — Pianificazione giri corrieri',
  description:
    'Geocodifica indirizzi, calcola distanze stradali e ottimizza i giri dei corrieri.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it">
      <body>
        <Header />
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}

