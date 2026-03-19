'use client';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-sm text-text-tertiary mb-8">Last updated: March 2026</p>

          <div className="terminal-card p-6 space-y-6 text-text-secondary text-sm leading-relaxed">
            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">1. Information We Collect</h2>
              <p>
                When you create an account, we collect your name, email address, and a
                hashed version of your password. We also store portfolio configurations
                and backtesting results that you choose to save.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">2. How We Use Your Information</h2>
              <p>Your information is used to:</p>
              <ul className="list-disc list-inside mt-2 space-y-1 text-text-tertiary">
                <li>Provide and maintain the backtesting service</li>
                <li>Authenticate your account and manage sessions</li>
                <li>Save and retrieve your portfolio configurations</li>
                <li>Send important service-related communications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">3. Data Storage</h2>
              <p>
                Your data is stored in a secured MongoDB database. Passwords are hashed
                using bcrypt and are never stored in plaintext. Authentication tokens
                (JWT) expire after 7 days.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">4. Third-Party Services</h2>
              <p>
                We use Yahoo Finance to retrieve historical market data for backtesting
                calculations. No personally identifiable information is shared with
                Yahoo Finance or any other third party.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">5. Cookies</h2>
              <p>
                We do not use tracking cookies. Authentication tokens are stored in your
                browser&apos;s localStorage and are only sent to our own API server.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">6. Data Deletion</h2>
              <p>
                You can delete individual portfolios at any time. To request full account
                deletion, contact us at{' '}
                <a href="mailto:hello@portfoliobacktesting.com" className="text-accent-cyan hover:underline">
                  hello@portfoliobacktesting.com
                </a>.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">7. Changes to This Policy</h2>
              <p>
                We may update this policy from time to time. Material changes will be
                communicated via email or a notice on the site.
              </p>
            </section>

            <section>
              <h2 className="text-base font-bold text-text-primary mb-2">8. Contact</h2>
              <p>
                For privacy-related questions, email{' '}
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
