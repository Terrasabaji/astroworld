'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import AstroWorldLogo from '@/components/layout/AstroWorldLogo';
import DeveloperCredit from '@/components/layout/DeveloperCredit';
import { APP_NAME, APP_TAGLINE, GANAPATI_PATH } from '@/lib/branding';
import { useAuth } from '@/components/auth/AuthGate';
import FileMenu from '@/components/layout/FileMenu';
import PanchangaBar from '@/components/layout/PanchangaBar';
import { Compass, Sparkles, CalendarClock, HelpCircle, Heart, Clock, Stethoscope, GraduationCap, Activity, ArrowLeft } from 'lucide-react';

const NAV = [
  { href: '/', label: 'Chart Engine', icon: Compass },
  { href: '/yoga-dosha', label: 'Yogas & Doshas', icon: Sparkles },
  { href: '/muhurta', label: 'Muhurta', icon: CalendarClock },
  { href: '/prashna', label: 'Prashna', icon: HelpCircle },
  { href: '/marriage', label: 'Marriage & Children', icon: Heart },
  { href: '/btr', label: 'BTR', icon: Clock },
  { href: '/health', label: 'Health', icon: Stethoscope },
  { href: '/adviser', label: 'Education and Career', icon: GraduationCap },
  { href: '/current-assessment', label: 'Current Assessment', icon: Activity },
];

export default function AppShell({ children }) {
  const pathname = usePathname();
  const auth = useAuth();

  const isMainPage = pathname === '/';
  const activeModule = NAV.find(
    (item) => item.href !== '/' && pathname.startsWith(item.href)
  );

  if (isMainPage) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        <header className="print:hidden px-4 sm:px-6 pt-4 sm:pt-5">
          <div className="flex items-start justify-between gap-4">
            <Link href="/" className="shrink-0" aria-label={APP_NAME}>
              <AstroWorldLogo size={72} showName className="hidden sm:inline-flex" />
              <AstroWorldLogo size={56} showName className="inline-flex sm:hidden" />
            </Link>
            <Image
              src={GANAPATI_PATH}
              alt="Uchhishta Ganapati"
              width={72}
              height={72}
              className="rounded shrink-0 hidden sm:block"
              priority
            />
            <Image
              src={GANAPATI_PATH}
              alt="Uchhishta Ganapati"
              width={56}
              height={56}
              className="rounded shrink-0 block sm:hidden"
              priority
            />
          </div>
        </header>

        <div className="flex-1">{children}</div>

        <footer className="border-t border-slate-800 bg-slate-900/50 py-3 mt-auto print:hidden">
          <DeveloperCredit />
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-saffron-900/40 bg-slate-950/90 backdrop-blur sticky top-0 z-50 print:hidden">
        <div className="container flex items-center justify-between py-3">
          <Link href="/" className="shrink-0">
            <AstroWorldLogo size={72} showName={false} className="hidden sm:inline-flex" />
            <AstroWorldLogo size={52} showName={false} className="inline-flex sm:hidden" />
          </Link>
          <div className="text-center flex-1 px-4">
            <h1 className="text-lg sm:text-2xl font-bold text-saffron">{APP_NAME}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{APP_TAGLINE}</p>
          </div>
          <Image
            src={GANAPATI_PATH}
            alt="Uchhishta Ganapati"
            width={72}
            height={72}
            className="rounded shrink-0 hidden sm:block"
          />
          <Image
            src={GANAPATI_PATH}
            alt="Uchhishta Ganapati"
            width={52}
            height={52}
            className="rounded shrink-0 block sm:hidden"
          />
        </div>
        <PanchangaBar />
        <div className="container flex items-center justify-between py-2 border-t border-saffron-900/20">
          <div className="flex items-center gap-3">
            <FileMenu />
            {activeModule && (
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-saffron-300 hover:bg-saffron-900/20 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Main
              </Link>
            )}
          </div>
          {auth?.user && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-saffron-300/80">{auth.user.name}</span>
              <button
                onClick={auth.logout}
                className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-3 mt-auto print:hidden">
        <DeveloperCredit />
      </footer>
    </div>
  );
}
