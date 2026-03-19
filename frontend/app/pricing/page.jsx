'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const features = [
  'Backtesting up to 30 years',
  'S&P 500 benchmark comparison',
  'Dollar-cost averaging simulation',
  'Save up to 10 portfolios',
  'Annual & quarterly rebalancing',
  'Up to 10 assets per portfolio',
  'Monte Carlo simulation',
  'CSV data export',
];

export default function PricingPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-lg mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-3">Pricing</h1>
            <p className="text-text-secondary">Simple, transparent pricing.</p>
          </div>

          <div className="terminal-card p-6" style={{ borderColor: 'rgba(0, 229, 255, 0.2)', boxShadow: '0 0 40px rgba(0, 229, 255, 0.05)' }}>
            <div className="mb-4">
              <h3 className="text-lg font-bold">Full Access</h3>
              <p className="text-3xl font-mono font-bold text-accent-cyan mt-1">$0</p>
              <p className="text-xs text-text-tertiary">All features included</p>
            </div>
            <ul className="space-y-2.5 mb-6">
              {features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-text-secondary">
                  <svg className="w-4 h-4 text-accent-green shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <a href="/signup" className="btn-primary block text-center w-full no-underline">Get Started</a>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
