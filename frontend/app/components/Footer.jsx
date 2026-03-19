import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-border-primary mt-auto" style={{ background: 'rgba(17, 24, 39, 0.5)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <span className="font-mono text-lg font-bold text-accent-cyan" style={{ textShadow: '0 0 15px rgba(0, 229, 255, 0.3)' }}>
              PB
            </span>
            <p className="mt-2 text-sm text-text-tertiary leading-relaxed">
              Historical portfolio backtesting with dollar-cost averaging simulation.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-text-tertiary uppercase tracking-widest mb-3">Product</h4>
            <div className="space-y-2">
              <Link href="/backtester" className="block text-sm text-text-secondary hover:text-accent-cyan transition-colors no-underline">Backtester</Link>
              <Link href="/pricing" className="block text-sm text-text-secondary hover:text-accent-cyan transition-colors no-underline">Pricing</Link>
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-text-tertiary uppercase tracking-widest mb-3">Legal</h4>
            <div className="space-y-2">
              <Link href="/privacy-policy" className="block text-sm text-text-secondary hover:text-accent-cyan transition-colors no-underline">Privacy Policy</Link>
              <Link href="/terms-of-service" className="block text-sm text-text-secondary hover:text-accent-cyan transition-colors no-underline">Terms of Service</Link>
            </div>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-xs font-mono font-semibold text-text-tertiary uppercase tracking-widest mb-3">Company</h4>
            <div className="space-y-2">
              <Link href="/about" className="block text-sm text-text-secondary hover:text-accent-cyan transition-colors no-underline">About</Link>
              <Link href="/blog" className="block text-sm text-text-secondary hover:text-accent-cyan transition-colors no-underline">Blog</Link>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-border-primary flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-text-tertiary">
            &copy; {new Date().getFullYear()} portfoliobacktesting.com
          </p>
          <p className="text-xs text-text-tertiary">
            Past performance does not guarantee future results.
          </p>
        </div>
      </div>
    </footer>
  );
}
