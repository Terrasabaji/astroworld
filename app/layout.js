import './globals.css';
import { Inter } from 'next/font/google';
import AppShell from '@/components/layout/AppShell';
import ClientProviders from '@/components/providers/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Astro World — Complete Vedic & KP Astrology Suite',
  description: 'Astro World: Swiss Ephemeris powered Vedic + KP astrology — Chart Engine, Prashna, Marriage, BTR, Health & Career modules',
  icons: {
    icon: '/astro-world-icon.svg',
    apple: '/astro-world-icon.svg',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <ClientProviders>
          <AppShell>{children}</AppShell>
        </ClientProviders>
      </body>
    </html>
  );
}
