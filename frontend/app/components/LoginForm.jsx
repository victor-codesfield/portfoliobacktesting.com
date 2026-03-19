'use client';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { userAPI } from '../lib/api';
import { useAuthContext } from '../context/AuthContext';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuthContext();
  const searchParams = useSearchParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await userAPI.login(email, password);
      login(data);
      const redirect = searchParams.get('redirect') || '/backtester';
      window.location.href = redirect;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="terminal-card p-6 sm:p-8 w-full max-w-md animate-fade-in">
      <div className="flex items-center gap-1.5 mb-6">
        <span className="w-2.5 h-2.5 rounded-full bg-accent-red/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-accent-amber/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-accent-green/70" />
        <span className="ml-2 text-xs font-mono text-text-tertiary">auth://login</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Welcome back</h1>
      <p className="text-sm text-text-secondary mb-6">Log in to access your portfolios</p>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
        </div>
        <div>
          <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1.5">Password</label>
          <div className="relative">
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary transition-colors cursor-pointer"
              tabIndex={-1}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {showPw ? (
                  <>
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                    <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </>
                ) : (
                  <>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'Logging in...' : 'Log in'}
        </button>
      </form>

      <div className="mt-5 text-center space-y-2">
        <p className="text-sm text-text-tertiary">
          No account?{' '}
          <Link href="/signup" className="text-accent-cyan hover:underline">Sign up</Link>
        </p>
        <p className="text-sm text-text-tertiary">
          <Link href="/reset" className="text-text-secondary hover:text-accent-cyan">Forgot password?</Link>
        </p>
      </div>
    </div>
  );
}
