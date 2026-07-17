import Image from 'next/image';
import { APP_NAME, ICON_PATH } from '@/lib/branding';

export default function AstroWorldLogo({ size = 40, showName = true, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <Image
        src={ICON_PATH}
        alt=""
        width={size}
        height={size}
        className="rounded-md shrink-0"
        priority
      />
      {showName && (
        <span className="font-semibold text-slate-100 tracking-tight">{APP_NAME}</span>
      )}
    </span>
  );
}
