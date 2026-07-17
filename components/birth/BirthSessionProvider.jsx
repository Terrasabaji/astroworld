'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_BIRTH,
  applyMarriageSide,
  loadBirthSession,
  nativeBirth,
  normalizeBirth,
  saveBirthSession,
  splitMarriageBirths,
} from '@/lib/birth-session';

const BirthSessionContext = createContext(null);

export function BirthSessionProvider({ children }) {
  const [birth, setBirthState] = useState(DEFAULT_BIRTH);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setBirthState(loadBirthSession());
    setHydrated(true);

    const refresh = () => setBirthState(loadBirthSession());
    window.addEventListener('siddhanta-birth-update', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('siddhanta-birth-update', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const setBirth = useCallback((next) => {
    const current = loadBirthSession();
    const merged = typeof next === 'function' ? normalizeMerge(next, current) : { ...current, ...next };
    const saved = saveBirthSession(merged);
    setBirthState(saved);
    return saved;
  }, []);

  const setPartner = useCallback((next) => {
    const current = loadBirthSession();
    const partner = current.partner || normalizeBirth(current).partner;
    const mergedPartner = typeof next === 'function'
      ? { ...partner, ...next(partner) }
      : { ...partner, ...next };
    const saved = saveBirthSession({ ...current, partner: mergedPartner });
    setBirthState(saved);
    return saved;
  }, []);

  return (
    <BirthSessionContext.Provider value={{ birth, setBirth, setPartner, hydrated }}>
      {children}
    </BirthSessionContext.Provider>
  );
}

function normalizeMerge(fn, current) {
  const result = fn(current);
  return { ...current, ...result };
}

export function useBirthSession() {
  const ctx = useContext(BirthSessionContext);
  if (!ctx) throw new Error('useBirthSession must be used within BirthSessionProvider');
  return ctx;
}

/** Bind module form state to the shared Chart Engine birth record. */
export function useModuleBirth(overrides = {}) {
  const { birth, setBirth, hydrated } = useBirthSession();
  const [local, setLocal] = useState(() => ({ ...DEFAULT_BIRTH, ...overrides }));

  useEffect(() => {
    if (hydrated) setLocal({ ...nativeBirth(birth), ...overrides });
  }, [hydrated, birth]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateBirth = (next) => {
    const merged = typeof next === 'function'
      ? { ...local, ...next(local) }
      : { ...local, ...next };
    setLocal(merged);
    setBirth(merged);
  };

  return { birth: local, setBirth: updateBirth, hydrated };
}

/** Groom/bride forms routed from Chart Engine gender + partner birth. */
export function useMarriageBirths() {
  const { birth, setBirth, hydrated } = useBirthSession();
  const roles = useMemo(() => splitMarriageBirths(birth), [birth]);

  const setGroom = useCallback((next) => {
    const current = loadBirthSession();
    const saved = saveBirthSession(applyMarriageSide(current, 'groom', next));
    return saved;
  }, []);

  const setBride = useCallback((next) => {
    const current = loadBirthSession();
    const saved = saveBirthSession(applyMarriageSide(current, 'bride', next));
    return saved;
  }, []);

  return {
    groom: roles.groom,
    bride: roles.bride,
    nativeGender: roles.native.gender,
    setGroom,
    setBride,
    setBirth,
    hydrated,
  };
}
