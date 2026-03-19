'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-8">About</h1>

          <div className="terminal-card p-6 space-y-5 text-text-secondary leading-relaxed">
            <p>
              Portfolio Backtester was built to answer a simple question:{' '}
              <span className="text-text-primary font-medium">
                "What if I had invested differently?"
              </span>
            </p>

            <p>
              Most backtesting tools are either locked behind expensive paywalls
              or too complex for everyday investors. This tool is different — it
              gives you historical performance data for any portfolio allocation,
              with dollar-cost averaging simulation, S&amp;P 500 benchmarking,
              and annual rebalancing built in.
            </p>

            <p>
              Enter your tickers, set your allocation, pick a time period, and
              see exactly how your portfolio would have performed using real
              market data.
            </p>

            <div className="border-t border-border-primary pt-5">
              <h2 className="text-lg font-bold text-text-primary mb-3">How it works</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-accent-cyan font-mono shrink-0">01</span>
                  Choose up to 10 tickers and set your allocation percentages
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-cyan font-mono shrink-0">02</span>
                  Set a monthly investment amount and time period
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-cyan font-mono shrink-0">03</span>
                  The engine simulates monthly purchases using historical closing prices
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent-cyan font-mono shrink-0">04</span>
                  Compare your portfolio against the S&amp;P 500 and plain USD savings
                </li>
              </ul>
            </div>

            <div className="border-t border-border-primary pt-5 text-sm">
              <p>
                Built and maintained as a solo project. Questions or feedback?
                Reach out at{' '}
                <a
                  href="mailto:hello@portfoliobacktesting.com"
                  className="text-accent-cyan hover:underline"
                >
                  hello@portfoliobacktesting.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
