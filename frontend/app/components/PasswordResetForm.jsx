'use client';
import { useState } from 'react';
import Link from 'next/link';
import { userAPI } from '../lib/api';
import { useAuthContext } from '../context/AuthContext';

export default function PasswordResetForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { login } = useAuthContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      const data = await userAPI.passwordReset(email, password);
      login(data);
      setSuccess(true);
      setTimeout(() => { window.location.href = '/backtester'; }, 1500);
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
        <span className="ml-2 text-xs font-mono text-text-tertiary">auth://reset</span>
      </div>

      <h1 className="text-2xl font-bold mb-1">Reset password</h1>
      <p className="text-sm text-text-secondary mb-6">Enter your email and a new password</p>

      {success ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-accent-green/10 border border-accent-green/30 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-accent-green font-medium">Password reset successfully</p>
          <p className="text-sm text-text-tertiary mt-1">Redirecting...</p>
        </div>
      ) : (
        <>
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
              <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1.5">New Password</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min 6 characters" required />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Resetting...' : 'Reset password'}
            </button>
          </form>
          <p className="mt-5 text-center text-sm text-text-tertiary">
            <Link href="/login" className="text-accent-cyan hover:underline">Back to login</Link>
          </p>
        </>
      )}
    </div>
  );
}
