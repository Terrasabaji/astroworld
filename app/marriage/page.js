'use client';

import ModuleIframe from '@/components/modules/ModuleIframe';
import { useMarriageBirths } from '@/components/birth/BirthSessionProvider';

export default function MarriagePage() {
  const { groom, bride, hydrated } = useMarriageBirths();

  const getPayload = () => {
    if (!hydrated) return null;
    return { groom, bride, autoRun: false };
  };

  return (
    <ModuleIframe
      title="Marriage Matching"
      description="Full Vedic marriage module — Koota, BPHS, KP, charts, timing, 20-year forecast, health compatibility, Sarvashtakavarga, and PDF report."
      src="/modules/marriage/index.html"
      module="marriage"
      getPayload={getPayload}
    />
  );
}
