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

  // Determine if we're on the home/main page (show module grid) or inside a module (show back button)
  const isMainPage = pathname === '/';
  const activeModule = NAV.find(
    (item) => item.href !== '/' && pathname.startsWith(item.href)
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <header className="border-b border-saffron-900/40 bg-slate-950/90 backdrop-blur sticky top-0 z-50 print:hidden">
        {/* Banner row */}
        <div className="container flex items-center justify-between py-3">
          {/* Left: Logo — increased size */}
          <Link href="/" className="shrink-0">
            <AstroWorldLogo size={72} showName={false} className="hidden sm:inline-flex" />
            <AstroWorldLogo size={52} showName={false} className="inline-flex sm:hidden" />
          </Link>
          {/* Center: Title + Subtitle */}
          <div className="text-center flex-1 px-4">
            <h1 className="text-lg sm:text-2xl font-bold text-saffron">{APP_NAME}</h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">{APP_TAGLINE}</p>
          </div>
          {/* Right: Ganapati — increased size */}
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
        {/* Panchanga scrolling bar */}
        <PanchangaBar />
        {/* File Menu + User info bar */}
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
          {auth?.user && !auth?.isGuest && (
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

      <div className="flex-1">
        {/* On main page, show module grid buttons (excluding Chart Engine which IS the main page) */}
        {isMainPage && (
          <div className="container py-6">
            <h2 className="text-sm uppercase tracking-wider text-saffron/70 font-medium mb-4">Modules</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {NAV.filter((item) => item.href !== '/').map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col items-center justify-center gap-3 p-4 sm:p-6 rounded-xl border border-saffron-900/30 bg-slate-900/50 hover:bg-saffron-900/20 hover:border-saffron/40 transition-all duration-200 min-h-[120px] sm:min-h-[140px]"
                  >
                    <Icon className="h-8 w-8 sm:h-10 sm:w-10 text-saffron-400 group-hover:text-saffron-300 transition-colors" />
                    <span className="text-xs sm:text-sm font-medium text-slate-300 group-hover:text-saffron-200 text-center transition-colors">
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
        {children}
      </div>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-3 mt-auto print:hidden">
        <DeveloperCredit />
      </footer>
    </div>
  );
}
