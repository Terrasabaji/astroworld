'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = 'astro-world-token';
const USER_KEY = 'astro-world-user';

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check for existing token on mount
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser = localStorage.getItem(USER_KEY);
    if (savedToken && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsed);
      } catch {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      }
    }
    setLoading(false);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    setFormData({ name: '', mobile: '', email: '' });
    setError('');
    // Fire and forget
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  const handleRegisterAndLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      setError('Name, Mobile Number and Email are required');
      return;
    }
    setSubmitting(true);
    try {
      // Step 1: Register the user
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        setError(regData.error || 'Registration failed');
        return;
      }
      // Step 2: Immediately verify (OTP bypassed) and get token
      const verRes = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: '000000' }),
      });
      const verData = await verRes.json();
      if (!verRes.ok || !verData.success) {
        setError(verData.error || 'Login failed');
        return;
      }
      // Store token and user — open the app
      localStorage.setItem(TOKEN_KEY, verData.token);
      localStorage.setItem(USER_KEY, JSON.stringify(verData.user));
      setToken(verData.token);
      setUser(verData.user);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (user && token) {
    return (
      <AuthContext.Provider value={{ user, token, logout }}>
        {children}
      </AuthContext.Provider>
    );
  }

  // Login/Register Modal
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-saffron-600/20 to-saffron-800/20 border-b border-saffron/20 px-6 py-5 text-center">
          <h1 className="text-2xl font-bold text-saffron-300">Astro World</h1>
          <p className="text-sm text-slate-400 mt-1">Complete Vedic & KP Astrology Suite</p>
        </div>

        <div className="p-6">
          <form onSubmit={handleRegisterAndLogin} className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Sign In / Register</h2>
            
            <div>
              <label className="block text-sm text-slate-400 mb-1">Name *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/50"
                placeholder="Enter your name"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Mobile Number *</label>
              <input
                type="tel"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/50"
                placeholder="Enter mobile number"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-slate-400 mb-1">Email ID *</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2.5 bg-slate-800 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-saffron focus:ring-1 focus:ring-saffron/50"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && <p className="text-red-400 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-saffron-500 to-saffron-700 text-slate-900 font-semibold rounded-lg hover:from-saffron-400 hover:to-saffron-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? 'Registering...' : 'Register and Log in'}
            </button>

            <p className="text-xs text-slate-500 text-center mt-2">
              If you have already registered, enter the same email to log in.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
