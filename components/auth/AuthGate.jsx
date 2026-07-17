'use client';

import { createContext, useContext, useCallback } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

/** Local guest identity — sign-in UI has been removed. */
const GUEST_USER = {
  name: 'Guest',
  email: 'guest@local',
};

export default function AuthGate({ children }) {
  const logout = useCallback(() => {
    // No-op: there is no sign-in session to clear.
  }, []);

  return (
    <AuthContext.Provider value={{ user: GUEST_USER, token: null, logout, isGuest: true }}>
      {children}
    </AuthContext.Provider>
  );
}
