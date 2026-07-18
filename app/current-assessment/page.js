'use client';

import { useState, useEffect, useCallback } from 'react';
import { useBirthSession } from '@/components/birth/BirthSessionProvider';
import { nativeBirth } from '@/lib/birth-session';
import { birthFormToPayload } from '@/components/birth/BirthForm';
import ComprehensiveStatusPanel from '@/components/astrology/ComprehensiveStatusPanel';
import { Button } from '@/components/ui/button';
import { Loader2, Printer } from 'lucide-react';
import { printAssessmentReport } from '@/lib/assessment-print';

export default function CurrentAssessmentPage() {
  const { birth, hydrated } = useBirthSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAssessment = useCallback(async () => {
    if (!hydrated || !birth?.latitude) return;
    setLoading(true);
    setError(null);
    setData(null);
    try {
      const native = nativeBirth(birth);
      const payload = birthFormToPayload(native);
      const now = new Date();
      const compPayload = {
        ...payload,
        name: native.name || 'Native',
        cast_moment: {
          year: now.getFullYear(),
          month: now.getMonth() + 1,
          day: now.getDate(),
          hour: now.getHours(),
          minute: now.getMinutes(),
          second: now.getSeconds(),
          tz_offset: payload.tz_offset,
          tz_name: payload.tz_name,
          latitude: payload.latitude,
          longitude: payload.longitude,
        },
      };
      const res = await fetch('/api/comprehensive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(compPayload),
      });
      const result = await res.json();
      if (!res.ok || result.error) throw new Error(result.error || 'Assessment failed');
      setData(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [birth, hydrated]);

  useEffect(() => {
    if (hydrated && birth?.latitude) fetchAssessment();
  }, [hydrated, birth?.latitude, birth?.longitude, fetchAssessment]);

  return (
    <main className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-slate-100 min-h-screen">
      <div className="container py-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-100">Current Assessment</h1>
            <p className="text-xs text-slate-400">Comprehensive status for the active birth at the current moment</p>
          </div>
          <div className="flex gap-2 print:hidden">
            {data && (
              <Button
                onClick={() => printAssessmentReport(data)}
                variant="outline"
                className="border-slate-600 text-slate-200 hover:bg-slate-800"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
            )}
            <Button
              onClick={fetchAssessment}
              disabled={loading}
              variant="outline"
              className="border-slate-600 text-slate-200 hover:bg-slate-800"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh
            </Button>
          </div>
        </div>

        <ComprehensiveStatusPanel
          data={data}
          loading={loading}
          error={error}
        />
      </div>
    </main>
  );
}
