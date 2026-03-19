import './globals.css';
import { AuthContextProvider } from './context/AuthContext';

export const metadata = {
  title: 'Portfolio Backtester | Test Your Investment Strategy',
  description: 'Backtest portfolio allocations using historical data. Simulate dollar-cost averaging with S&P 500 benchmarks. Free portfolio backtesting tool.',
  keywords: 'portfolio backtester, investment backtest, DCA simulator, S&P 500 benchmark, stock portfolio analysis',
  openGraph: {
    title: 'Portfolio Backtester',
    description: 'Backtest your investment portfolio with historical data',
    url: 'https://portfoliobacktesting.com',
    siteName: 'Portfolio Backtester',
    type: 'website',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <AuthContextProvider>
          {children}
        </AuthContextProvider>
      </body>
    </html>
  );
}
