import { APP_NAME, DEVELOPER_CREDIT_FULL, DEVELOPER_EMAIL, DEVELOPER_NAME } from '@/lib/branding';

export default function DeveloperCredit({ className = '' }) {
  return (
    <p className={`text-center text-[11px] text-slate-500 ${className}`}>
      <span className="text-slate-400 font-medium">{APP_NAME}</span>
      {' · '}
      Developed by{' '}
      <span className="text-slate-400">{DEVELOPER_NAME}</span>
      {' · '}
      <a href={`mailto:${DEVELOPER_EMAIL}`} className="text-amber-500/80 hover:text-amber-400 transition-colors">
        {DEVELOPER_EMAIL}
      </a>
    </p>
  );
}
