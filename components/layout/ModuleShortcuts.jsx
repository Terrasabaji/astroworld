'use client';

import Link from 'next/link';
import {
  Sparkles, CalendarClock, HelpCircle, Heart, Clock, Stethoscope, GraduationCap,
} from 'lucide-react';

const LINKS = [
  { href: '/yoga-dosha', label: 'Yogas & Doshas', icon: Sparkles },
  { href: '/muhurta', label: 'Muhurta', icon: CalendarClock },
  { href: '/adviser', label: 'Education and Career', icon: GraduationCap },
  { href: '/marriage', label: 'Marriage & Children', icon: Heart },
  { href: '/health', label: 'Health', icon: Stethoscope },
  { href: '/btr', label: 'BTR', icon: Clock },
  { href: '/prashna', label: 'Prashna', icon: HelpCircle },
];

export default function ModuleShortcuts({ title = 'Open modules with active birth', className = '' }) {
  return (
    <div className={className}>
      <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-2">{title}</p>
      <div className="flex flex-wrap gap-2">
        {LINKS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="inline-flex items-center gap-1.5 px-3 min-h-[44px] py-1.5 rounded-md border border-slate-700 bg-slate-900/50 text-xs text-slate-300 hover:border-saffron/40 hover:text-saffron-200 transition-colors"
          >
            <Icon className="h-3.5 w-3.5 text-saffron/80" />
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
