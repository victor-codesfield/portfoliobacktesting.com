'use client';
import { useState } from 'react';
import { userAPI } from '../lib/api';
import { useAuthContext } from '../context/AuthContext';

export default function UpgradeModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { refreshUser } = useAuthContext();

  if (!isOpen) return null;

  const handleActivate = async () => {
    setLoading(true);
    try {
      await userAPI.subscribe();
      await refreshUser();
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 2000);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="terminal-card p-6 sm:p-8 w-full max-w-md relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{ boxShadow: '0 0 60px rgba(0, 229, 255, 0.08)' }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-text-tertiary hover:text-text-primary transition-colors cursor-pointer"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-accent-green/10 border border-accent-green/30 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-accent-green">Premium Activated</h2>
            <p className="text-sm text-text-secondary mt-1">You now have full access</p>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent-amber/10 border border-accent-amber/20 text-xs font-mono text-accent-amber mb-3">
                PRO
              </div>
              <h2 className="text-2xl font-bold">Unlock Premium</h2>
              <p className="text-sm text-text-secondary mt-1">Access all backtesting features</p>
            </div>

            <ul className="space-y-3 mb-6">
              {[
                'Backtest up to 30 years of data',
                'Export portfolio data as CSV',
                'Extended historical analysis',
                'Priority data processing',
              ].map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 text-sm text-text-secondary">
                  <svg className="w-4 h-4 mt-0.5 text-accent-green shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>

            <div className="text-center mb-4">
              <p className="text-xs text-text-tertiary">First 100 users get it free</p>
            </div>

            <button onClick={handleActivate} disabled={loading} className="btn-primary w-full">
              {loading ? 'Activating...' : 'Activate Free Trial'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
