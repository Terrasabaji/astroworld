'use client';

import ModuleIframe from '@/components/modules/ModuleIframe';
import { useModuleBirth } from '@/components/birth/BirthSessionProvider';
import { nativeBirth } from '@/lib/birth-session';

export default function BTRPage() {
  const { birth, hydrated } = useModuleBirth();

  const getPayload = () => {
    if (!hydrated) return null;
    return { native: nativeBirth(birth), autoRun: false };
  };

  return (
    <ModuleIframe
      title="Birth Time Rectification"
      description="Full BTR module — KP ruling planets, life-event scoring, candidate ranking, chart preview, HTML/PDF export."
      src="/modules/btr/index.html"
      module="btr"
      getPayload={getPayload}
    />
  );
}
