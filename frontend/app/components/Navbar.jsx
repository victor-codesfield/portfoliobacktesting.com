'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuthContext } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuthContext();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = [
    { href: '/backtester', label: 'Backtester' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/about', label: 'About' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50" style={{
      background: 'rgba(10, 14, 23, 0.82)',
      backdropFilter: 'blur(20px) saturate(1.4)',
      WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
      borderBottom: '1px solid rgba(0, 229, 255, 0.07)',
    }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group no-underline">
            <span className="font-mono text-xl font-bold tracking-tight" style={{
              color: '#00e5ff',
              textShadow: '0 0 20px rgba(0, 229, 255, 0.4)',
              transition: 'text-shadow 0.3s',
            }}>PB</span>
            <span className="hidden sm:inline text-text-secondary text-sm font-medium tracking-wide group-hover:text-text-primary transition-colors">
              Portfolio Backtester
            </span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3.5 py-2 text-sm text-text-secondary hover:text-accent-cyan transition-colors rounded-lg hover:bg-white/[0.03] no-underline"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth section */}
          <div className="hidden md:flex items-center gap-3">
            {user === undefined ? (
              <div className="w-20 h-8 rounded-lg bg-bg-tertiary animate-pulse" />
            ) : user ? (
              <>
                <span className="text-sm text-text-secondary font-mono">
                  {user.name}
                </span>
                {user.subscribed && (
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-accent-amber/10 text-accent-amber border border-accent-amber/20">
                    PRO
                  </span>
                )}
                <button
                  onClick={() => { logout(); window.location.href = '/'; }}
                  className="text-sm text-text-tertiary hover:text-accent-red transition-colors cursor-pointer"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors no-underline">
                  Log in
                </Link>
                <Link href="/signup" className="btn-primary text-sm !py-2 !px-4 no-underline">
                  Sign up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 text-text-secondary hover:text-accent-cyan transition-colors cursor-pointer"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-border-primary animate-fade-in" style={{ background: 'rgba(10, 14, 23, 0.96)' }}>
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2.5 text-sm text-text-secondary hover:text-accent-cyan transition-colors rounded-lg no-underline"
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-3 mt-3 border-t border-border-primary">
              {user ? (
                <div className="flex items-center justify-between px-3">
                  <span className="text-sm text-text-secondary font-mono">{user.name}</span>
                  <button
                    onClick={() => { logout(); setMobileOpen(false); window.location.href = '/'; }}
                    className="text-sm text-accent-red cursor-pointer"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 px-3">
                  <Link href="/login" onClick={() => setMobileOpen(false)} className="btn-secondary flex-1 text-center text-sm no-underline">Log in</Link>
                  <Link href="/signup" onClick={() => setMobileOpen(false)} className="btn-primary flex-1 text-center text-sm no-underline">Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
