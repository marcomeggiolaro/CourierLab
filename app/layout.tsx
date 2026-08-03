/**
 * CourierLab — Root Layout
 */
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'KmC — Distance Check',
  description:
    'Distance Check: calcolo distanze tra punto di sparo e indirizzo destinatario tramite OpenStreetMap.',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
    shortcut: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="it" className={inter.variable}>
      <body>
        <Header />
        <main className="relative z-10 max-w-7xl mx-auto px-8 py-8">{children}</main>
      </body>
    </html>
  );
}

