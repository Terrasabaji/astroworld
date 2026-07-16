'use client';
import { useState, useEffect } from 'react';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';

function PanchangaItem({ label, value }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="text-saffron-400 font-medium">{label}:</span>
      <span className="text-slate-200">{value || '—'}</span>
    </span>
  );
}

export default function PanchangaBar() {
  const [data, setData] = useState(null);
  const { birth } = useBirthSession();

  useEffect(() => {
    const fetchPanchanga = async () => {
      const lat = birth?.latitude || 12.9716;
      const lon = birth?.longitude || 77.5946;
      const tz = birth?.tz_offset ?? 5.5;
      try {
        const res = await fetch(`/api/panchanga?lat=${lat}&lon=${lon}&tz_offset=${tz}`);
        if (res.ok) setData(await res.json());
      } catch {}
    };
    fetchPanchanga();
    const interval = setInterval(fetchPanchanga, 60000);
    return () => clearInterval(interval);
  }, [birth?.latitude, birth?.longitude, birth?.tz_offset]);

  if (!data) return null;

  return (
    <div className="bg-saffron-900/20 border-y border-saffron-800/30 overflow-hidden">
      <div className="animate-marquee whitespace-nowrap py-1.5 text-xs">
        <span className="inline-flex items-center gap-6 px-4">
          <PanchangaItem label="Vara" value={data.vara} />
          <span className="text-saffron-800">•</span>
          <PanchangaItem label="Tithi" value={data.tithi} />
          <span className="text-saffron-800">•</span>
          <PanchangaItem label="Nakshatra" value={data.nakshatra} />
          <span className="text-saffron-800">•</span>
          <PanchangaItem label="Yoga" value={data.yoga} />
          <span className="text-saffron-800">•</span>
          <PanchangaItem label="Karana" value={data.karana} />
          <span className="text-saffron-800">•</span>
          <PanchangaItem label="Sunrise" value={data.sunrise} />
          <span className="text-saffron-800">•</span>
          <PanchangaItem label="Sunset" value={data.sunset} />
        </span>
      </div>
    </div>
  );
}
