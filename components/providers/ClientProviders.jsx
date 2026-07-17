'use client';

import { BirthSessionProvider } from '@/components/birth/BirthSessionProvider';
import { Providers } from '@/app/providers';
import AuthGate from '@/components/auth/AuthGate';

export default function ClientProviders({ children }) {
  return (
    <Providers>
      <AuthGate>
        <BirthSessionProvider>{children}</BirthSessionProvider>
      </AuthGate>
    </Providers>
  );
}
