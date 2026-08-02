/**
 * CourierLab — Root Layout
 */
import type { Metadata } from 'next';
import Header from '@/components/layout/Header';
import './globals.css';

export const metadata: Metadata = {
  title: 'CourierLab — Calcolo distanze sparo/destinatario',
  description:
    'Calcolo distanze tra sparo spedizione e indirizzo destinatario tramite OpenStreetMap.',
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

