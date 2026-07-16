'use client';

import { useCallback, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import AstroWorldLogo from '@/components/layout/AstroWorldLogo';
import DeveloperCredit from '@/components/layout/DeveloperCredit';
import { APP_NAME } from '@/lib/branding';

export default function ModuleIframe({
  title,
  description,
  src,
  module,
  getPayload,
  height = 'calc(100vh - 200px)',
}) {
  const iframeRef = useRef(null);
  const readyRef = useRef(false);

  const postBirth = useCallback(() => {
    const win = iframeRef.current?.contentWindow;
    if (!win || !getPayload) return;
    const payload = getPayload();
    if (!payload) return;
    win.postMessage({ type: 'siddhanta-birth', module, ...payload }, '*');
  }, [getPayload, module]);

  useEffect(() => {
    const onMessage = (event) => {
      if (event.data?.type === 'siddhanta-module-ready' && event.data.module === module) {
        readyRef.current = true;
        postBirth();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [module, postBirth]);

  useEffect(() => {
    postBirth();
  }, [postBirth]);

  return (
    <div className="flex flex-col min-h-0">
      <div className="container py-4 shrink-0">
        <div className="flex items-start gap-3">
          <AstroWorldLogo size={32} showName={false} className="mt-1 shrink-0" />
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-wider text-saffron/80 font-medium">{APP_NAME}</p>
            <h1 className="text-2xl font-bold text-slate-100">{title}</h1>
            {description && <p className="text-slate-400 text-sm mt-1">{description}</p>}
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Button type="button" variant="outline" size="sm" className="border-slate-600 text-slate-300" onClick={postBirth}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Sync from Chart Engine
          </Button>
          <span className="text-xs text-slate-500">Full module UI — all analysis tabs and reports</span>
        </div>
      </div>
      <iframe
        ref={iframeRef}
        src={src}
        title={`${APP_NAME} — ${title}`}
        onLoad={postBirth}
        className="w-full border-0 bg-slate-900 flex-1"
        style={{ height, minHeight: 640 }}
      />
      <div className="container py-2 shrink-0">
        <DeveloperCredit />
      </div>
    </div>
  );
}
