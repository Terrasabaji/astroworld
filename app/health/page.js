'use client';

import ModuleIframe from '@/components/modules/ModuleIframe';
import { useModuleBirth } from '@/components/birth/BirthSessionProvider';
import { nativeBirth } from '@/lib/birth-session';

export default function HealthPage() {
  const { birth, hydrated } = useModuleBirth();

  const getPayload = () => {
    if (!hydrated) return null;
    return { native: nativeBirth(birth), autoRun: false };
  };

  return (
    <ModuleIframe
      title="Astrological Health Screener"
      description="Full Parashara & KP health screening — charts, dashas, D6, shadbala, accident risk, 20-year timeline, Q&A, and printable report."
      src="/modules/health/index.html"
      module="health"
      getPayload={getPayload}
    />
  );
}
