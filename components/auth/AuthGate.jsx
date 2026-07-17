'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

const TOKEN_KEY = 'astro-world-token';
const USER_KEY = 'astro-world-user';

// Mask an email for display, e.g. priya@example.com -> pr***@example.com
function maskEmail(email) {
  if (!email || !email.includes('@')) return email || '';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return `${local[0] || ''}***@${domain}`;
  return `${local.slice(0, 2)}***@${domain}`;
}

export default function AuthGate({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ name: '', mobile: '', email: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Two-step flow state
  const [step, setStep] = useState('details'); // 'details' | 'otp'
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [bypassOn, setBypassOn] = useState(false);

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
    setStep('details');
    setOtp('');
    setOtpError('');
    setBypassOn(false);
    // Fire and forget
    fetch('/api/auth/logout', { method: 'POST' }).catch(() => {});
  }, []);

  // Store token + user and open the app.
  const openApp = useCallback((verData) => {
    localStorage.setItem(TOKEN_KEY, verData.token);
    localStorage.setItem(USER_KEY, JSON.stringify(verData.user));
    setToken(verData.token);
    setUser(verData.user);
  }, []);

  // POST /api/auth/verify-otp and open the app on success.
  const verify = useCallback(async (code) => {
    const verRes = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: formData.email, otp: code }),
    });
    const verData = await verRes.json();
    if (!verRes.ok || !verData.success) {
      return { ok: false, error: verData.error || 'Login failed' };
    }
    openApp(verData);
    return { ok: true };
  }, [formData.email, openApp]);

  // Step 1: register and either auto-login (bypass) or advance to the OTP step.
  const handleRegisterAndLogin = async (e) => {
    e.preventDefault();
    setError('');
    if (!formData.name.trim() || !formData.email.trim() || !formData.mobile.trim()) {
      setError('Name, Mobile Number and Email are required');
      return;
    }
    setSubmitting(true);
    try {
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
      if (regData.otp_bypass === true) {
        // Dev bypass on — preserve the frictionless flow: auto-verify.
        setBypassOn(true);
        const res = await verify('000000');
        if (!res.ok) {
          setError(res.error);
        }
        return;
      }
      // Bypass off — advance to the OTP entry step.
      setBypassOn(false);
      setOtp('');
      setOtpError('');
      setStep('otp');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Step 2: verify the entered OTP.
  const handleVerifyOtp = useCallback(async (codeArg) => {
    const code = codeArg ?? otp;
    if (verifying) return;
    if (!code || code.length < 6) {
      setOtpError('Invalid or expired code. Please try again.');
      return;
    }
    setOtpError('');
    setVerifying(true);
    try {
      const res = await verify(code);
      if (!res.ok) {
        setOtpError('Invalid or expired code. Please try again.');
      }
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setVerifying(false);
    }
  }, [otp, verifying, verify]);

  // Resend: re-POST register to issue a fresh OTP.
  const handleResend = async () => {
    if (resending) return;
    setResending(true);
    setOtpError('');
    setOtp('');
    try {
      const regRes = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const regData = await regRes.json();
      if (!regRes.ok || !regData.success) {
        setOtpError(regData.error || 'Could not resend code. Please try again.');
        return;
      }
      setBypassOn(regData.otp_bypass === true);
    } catch {
      setOtpError('Network error. Please try again.');
    } finally {
      setResending(false);
    }
  };

  const handleBack = () => {
    setStep('details');
    setOtp('');
    setOtpError('');
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

  // Shared card chrome (header) matches AuthGate design tokens.
  const Header = (
    <div className="bg-gradient-to-r from-saffron-600/20 to-saffron-800/20 border-b border-saffron/20 px-6 py-5 text-center">
      <h1 className="text-2xl font-bold text-saffron-300">Astro World</h1>
      <p className="text-sm text-slate-400 mt-1">Complete Vedic &amp; KP Astrology Suite</p>
    </div>
  );

  // OTP entry step
  if (step === 'otp') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
          {Header}
          <div className="p-6">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Back to sign in"
              className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-saffron-300 transition-colors mb-4"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="m15 18-6-6 6-6" /></svg>
              Back
            </button>

            <h2 className="text-lg font-semibold text-slate-200 mb-1.5">Enter verification code</h2>
            <p className="text-sm text-slate-400 mb-5">
              We sent a 6-digit code to <span className="text-saffron-300 font-medium">{maskEmail(formData.email)}</span>
            </p>

            <label className="block text-sm text-slate-400 mb-2">Verification code</label>
            <InputOTP
              maxLength={6}
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (otpError) setOtpError('');
              }}
              onComplete={(v) => handleVerifyOtp(v)}
              disabled={verifying}
              containerClassName="justify-between"
            >
              <InputOTPGroup className="flex items-center gap-2 w-full">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <InputOTPSlot
                    key={i}
                    index={i}
                    className={`flex-1 h-14 rounded-lg border bg-slate-800 text-slate-100 text-[22px] font-semibold shadow-none ${
                      otpError
                        ? 'border-red-400 text-red-400'
                        : 'border-slate-600 first:rounded-lg last:rounded-lg'
                    }`}
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {otpError && (
              <p className="flex items-center gap-1.5 mt-3 text-red-400 text-sm">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[15px] h-[15px] flex-none"><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></svg>
                {otpError}
              </p>
            )}

            {/* Dev hint. Only show the literal 000000 hint when bypass is ON;
                otherwise show a neutral hint about the server log. */}
            {bypassOn ? (
              <div className="flex items-center gap-2 mt-3.5 bg-slate-800 border border-saffron/20 rounded-lg px-3 py-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-saffron-300 flex-none"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                <span className="text-xs text-slate-400">
                  Dev / bypass mode — use code <b className="text-saffron-300 font-mono tracking-widest">000000</b>
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-3.5 bg-slate-800 border border-saffron/20 rounded-lg px-3 py-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 text-saffron-300 flex-none"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                <span className="text-xs text-slate-400">In development, your code is printed to the server log.</span>
              </div>
            )}

            <button
              type="button"
              onClick={() => handleVerifyOtp()}
              disabled={verifying}
              className="w-full mt-5 py-3 bg-gradient-to-r from-saffron-500 to-saffron-700 text-slate-900 font-semibold rounded-lg hover:from-saffron-400 hover:to-saffron-600 transition-all disabled:opacity-80 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {verifying ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-900/35 border-t-slate-900 rounded-full animate-spin" aria-hidden="true" />
                  Verifying…
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <p className={`mt-4 text-center text-sm text-slate-500 ${verifying ? 'opacity-50 pointer-events-none' : ''}`}>
              Didn&apos;t get the code?{' '}
              <button
                type="button"
                onClick={handleResend}
                disabled={resending || verifying}
                className="inline-flex items-center gap-1.5 text-saffron-300 font-medium disabled:opacity-50"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" /><path d="M21 3v5h-5" /><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" /><path d="M8 16H3v5" /></svg>
                {resending ? 'Resending…' : 'Resend code'}
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Step 1: details form
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {Header}

        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-[18px]" aria-label="Step 1 of 2">
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-none bg-gradient-to-r from-saffron-500 to-saffron-700 text-slate-900">1</span>
            <span className="flex-1 h-0.5 bg-slate-700 rounded" />
            <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-none bg-slate-800 border border-slate-600 text-slate-500">2</span>
            <span className="text-xs text-slate-500">Step <b className="text-saffron-300 font-medium">1</b> of 2 · Your details</span>
          </div>

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
              className="w-full py-3 bg-gradient-to-r from-saffron-500 to-saffron-700 text-slate-900 font-semibold rounded-lg hover:from-saffron-400 hover:to-saffron-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {submitting ? (
                'Sending…'
              ) : (
                <>
                  Send verification code
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
                </>
              )}
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
