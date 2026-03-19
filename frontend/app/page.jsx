import Link from 'next/link';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

const faqs = [
  { q: 'What is portfolio backtesting?', a: 'Portfolio backtesting simulates how your investment strategy would have performed using real historical market data. You define your asset allocation and monthly investment, and we calculate exactly what your portfolio would be worth today.' },
  { q: 'What is Dollar-Cost Averaging (DCA)?', a: 'DCA is an investment strategy where you invest a fixed amount at regular intervals (monthly). This reduces the impact of market volatility by buying more shares when prices are low and fewer when prices are high.' },
  { q: 'Where does the historical data come from?', a: 'We use Yahoo Finance for all historical price data. This includes stocks, ETFs, cryptocurrencies, commodities, and more \u2014 covering decades of market history.' },
  { q: 'What does "rebalance annually" do?', a: 'Annual rebalancing adjusts your portfolio back to target allocations at the end of each year. Over time, some assets grow faster than others, causing your allocation to drift. Rebalancing sells overweight assets and buys underweight ones.' },
  { q: 'Is this free?', a: 'Yes! All features are currently available at no cost, including backtesting up to 30 years, Monte Carlo simulations, and CSV export.' },
  { q: 'How many assets can I include?', a: 'Each portfolio can include up to 10 different assets. You can save up to 10 different portfolio configurations.' },
  { q: 'Is this financial advice?', a: 'No. This tool is for educational and informational purposes only. Past performance does not guarantee future results. Always consult a qualified financial advisor before making investment decisions.' },
];

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main className="pt-16">
        {/* Hero */}
        <section className="relative min-h-[85vh] flex items-center justify-center px-4 overflow-hidden">
          {/* Background grid effect */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'linear-gradient(rgba(0, 229, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 229, 255, 0.03) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }} />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-bg-primary" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
              Backtest Your Portfolio{' '}
              <span className="text-accent-cyan" style={{ textShadow: '0 0 40px rgba(0, 229, 255, 0.25)' }}>
                Before You Invest
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed mb-8">
              Simulate dollar-cost averaging with real historical data. Compare your portfolio against the S&P 500. Make informed decisions.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Link href="/backtester" className="btn-primary text-base !px-8 !py-3 no-underline">
                Start Backtesting
              </Link>
              <Link href="/pricing" className="btn-secondary text-base !px-6 !py-3 no-underline">
                View Pricing
              </Link>
            </div>

            {/* Terminal preview mockup */}
            <div className="mt-16 terminal-card p-4 text-left max-w-2xl mx-auto" style={{ boxShadow: '0 0 80px rgba(0, 229, 255, 0.04)' }}>
              <div className="flex items-center gap-1.5 mb-3">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-red/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent-amber/70" />
                <span className="w-2.5 h-2.5 rounded-full bg-accent-green/70" />
                <span className="ml-2 text-[10px] font-mono text-text-tertiary">portfolio-analysis</span>
              </div>
              <div className="font-mono text-xs sm:text-sm space-y-1 text-text-tertiary">
                <p><span className="text-accent-cyan">$</span> analyze --tickers AAPL,MSFT,VOO --years 5</p>
                <p className="text-text-tertiary/60">Fetching historical data...</p>
                <p className="text-text-tertiary/60">Running DCA simulation @ $1,000/mo...</p>
                <p className="text-text-tertiary/60">Comparing against S&P 500 benchmark...</p>
                <p className="mt-2"><span className="text-accent-green">Portfolio Value:</span> <span className="text-accent-cyan">$82,437.21</span></p>
                <p><span className="text-accent-red">S&P 500:</span> <span className="text-text-primary">$74,892.55</span></p>
                <p><span className="text-text-tertiary">USD Savings:</span> <span className="text-text-secondary">$60,000.00</span></p>
                <p className="text-accent-green mt-1">Your portfolio outperformed S&P 500 by +10.1%</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Built for <span className="text-accent-cyan">serious</span> investors
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.5">
                      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                    </svg>
                  ),
                  title: 'Historical Data',
                  desc: 'Access decades of real market data from Yahoo Finance. Stocks, ETFs, crypto, commodities, and more.',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ff3366" strokeWidth="1.5">
                      <path d="M18 20V10M12 20V4M6 20v-6" />
                    </svg>
                  ),
                  title: 'S&P 500 Benchmark',
                  desc: 'See exactly how your strategy compares to the market index. Measure your alpha over any time period.',
                },
                {
                  icon: (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#00ff88" strokeWidth="1.5">
                      <path d="M23 4v6h-6M1 20v-6h6" />
                      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                    </svg>
                  ),
                  title: 'Annual Rebalancing',
                  desc: 'Toggle annual rebalancing to see how maintaining target allocations affects long-term performance.',
                },
              ].map((f) => (
                <div key={f.title} className="terminal-card p-6 text-center">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-bg-tertiary mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 border-t border-border-primary">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">FAQ</h2>
            <div className="space-y-3">
              {faqs.map((faq) => (
                <details key={faq.q} className="terminal-card group">
                  <summary className="px-5 py-4 cursor-pointer list-none flex items-center justify-between text-text-primary font-medium hover:text-accent-cyan transition-colors">
                    {faq.q}
                    <svg className="w-4 h-4 text-text-tertiary shrink-0 ml-2 transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </summary>
                  <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed border-t border-border-primary pt-3">
                    {faq.a}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* JSON-LD FAQ Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: faqs.map((f) => ({
              '@type': 'Question',
              name: f.q,
              acceptedAnswer: { '@type': 'Answer', text: f.a },
            })),
          }),
        }}
      />
    </>
  );
}
