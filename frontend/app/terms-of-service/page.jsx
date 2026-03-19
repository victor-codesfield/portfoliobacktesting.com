'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function TermsOfServicePage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Terms of Service</h1>
          <p className="text-sm text-text-tertiary mb-8">Last updated: March 2026</p>

          <div className="terminal-card p-6 space-y-6 text-text-secondary text-sm leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">1. Acceptance of Terms</h2>
              <p>
                By accessing or using Portfolio Backtester ("the Service"), you agree to
                be bound by these Terms of Service. If you do not agree, do not use the
                Service.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">2. Description of Service</h2>
              <p>
                Portfolio Backtester is a tool for simulating historical portfolio
                performance using dollar-cost averaging. The Service uses historical
                market data and is intended for educational and informational purposes
                only.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">3. Not Financial Advice</h2>
              <p>
                The Service does not provide financial, investment, tax, or legal advice.
                Past performance does not guarantee future results. All backtesting
                results are simulations based on historical data and should not be used
                as the sole basis for investment decisions. Consult a qualified financial
                advisor before making investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">4. User Accounts</h2>
              <p>
                You are responsible for maintaining the security of your account
                credentials. You must provide accurate information when creating an
                account. We reserve the right to suspend or terminate accounts that
                violate these terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">5. Acceptable Use</h2>
              <p>You agree not to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-text-tertiary">
                <li>Use the Service for any unlawful purpose</li>
                <li>Attempt to gain unauthorized access to the Service or its systems</li>
                <li>Abuse API rate limits or scrape data programmatically</li>
                <li>Resell or redistribute data obtained from the Service</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">6. Premium Features</h2>
              <p>
                Certain features (extended backtesting periods, CSV export) require a
                Premium subscription. Pricing and availability are subject to change.
                Free trial access for early users may be revoked at our discretion.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">7. Data Accuracy</h2>
              <p>
                Historical market data is sourced from third-party providers. While we
                strive for accuracy, we do not guarantee the completeness or correctness
                of any data. The Service is provided "as is" without warranties of any
                kind.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">8. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, Portfolio Backtester and its
                operators shall not be liable for any indirect, incidental, or
                consequential damages arising from your use of the Service, including
                but not limited to financial losses from investment decisions.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">9. Changes to Terms</h2>
              <p>
                We reserve the right to modify these terms at any time. Continued use of
                the Service after changes constitutes acceptance of the updated terms.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">10. Contact</h2>
              <p>
                Questions about these terms can be directed to{' '}
                <a href="mailto:hello@portfoliobacktesting.com" className="text-accent-cyan hover:underline">
                  hello@portfoliobacktesting.com
                </a>.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
