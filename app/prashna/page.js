'use client';

import ModuleIframe from '@/components/modules/ModuleIframe';
import { useModuleBirth } from '@/components/birth/BirthSessionProvider';
import { nativeBirth } from '@/lib/birth-session';

export default function PrashnaPage() {
  const { birth, hydrated } = useModuleBirth();

  const getPayload = () => {
    if (!hydrated) return null;
    return { native: nativeBirth(birth), autoRun: false };
  };

  return (
    <ModuleIframe
      title="Prashna (KP Horary)"
      description="Full KP Prashna module — manual, instant, and mooka prashna with complete interpretation and print report."
      src="/modules/prashna.html"
      module="prashna"
      getPayload={getPayload}
    />
  );
}
