'use client';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthContext } from '../../context/AuthContext';
import { portfolioAPI } from '../../lib/api';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import PortfolioBuilder from '../../components/PortfolioBuilder';
import PortfolioChart from '../../components/PortfolioChart';

// Normalize analysis data keys from MongoDB's default BSON naming (e.g. "tickerresults")
// to the expected snake_case format (e.g. "ticker_results"). Needed for data saved before
// bson tags were added to the Go structs.
function normalizeAnalysis(raw) {
  if (!raw) return null;
  // Already has correct keys
  if (raw.ticker_results && raw.combined_portfolio) return raw;
  // Map old BSON keys → correct keys
  const keyMap = {
    tickerresults: 'ticker_results',
    combinedportfolio: 'combined_portfolio',
    unifiedmonths: 'unified_months',
    maxmonths: 'max_months',
    allocationratios: 'allocation_ratios',
    monthlyinvestment: 'monthly_investment',
    daterangedata: 'dateRange',
    monte_carlo: 'monte_carlo',
    montecarlo: 'monte_carlo',
  };
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    out[keyMap[k] || k] = v;
  }
  // Normalize nested combined_portfolio
  if (out.combined_portfolio && !out.combined_portfolio.portfolio_values) {
    const cp = out.combined_portfolio;
    out.combined_portfolio = {
      final_value: cp.finalvalue ?? cp.final_value ?? 0,
      portfolio_values: cp.portfoliovalues ?? cp.portfolio_values ?? [],
    };
  }
  // Normalize nested ticker_results
  if (out.ticker_results) {
    const normalized = {};
    for (const [ticker, tr] of Object.entries(out.ticker_results)) {
      if (tr && !tr.portfolio_values && tr.portfoliovalues) {
        normalized[ticker] = {
          final_value: tr.finalvalue ?? tr.final_value ?? 0,
          final_shares: tr.finalshares ?? tr.final_shares ?? 0,
          portfolio_values: tr.portfoliovalues ?? tr.portfolio_values ?? [],
          monthly_closes: tr.monthlycloses ?? tr.monthly_closes ?? [],
        };
      } else {
        normalized[ticker] = tr;
      }
    }
    out.ticker_results = normalized;
  }
  return out;
}

export default function BacktesterDetailPage() {
  const { id } = useParams();
  const { user, ready } = useAuthContext();
  const router = useRouter();
  const [existingData, setExistingData] = useState(null);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [generationId, setGenerationId] = useState(null);
  const [loading, setLoading] = useState(id !== 'new');
  const [chartKey, setChartKey] = useState(0);

  useEffect(() => {
    if (ready && !user) {
      router.push('/signup?redirect=/backtester');
    }
  }, [user, ready, router]);

  useEffect(() => {
    if (id === 'new' || !user) return;
    portfolioAPI.getGeneration(id)
      .then((data) => {
        const gen = data.generation;
        setExistingData(gen);
        setGenerationId(gen._id);
        if (gen.analysis_data) {
          setAnalysisResult({ analysis: normalizeAnalysis(gen.analysis_data) });
        }
      })
      .catch(() => router.push('/backtester'))
      .finally(() => setLoading(false));
  }, [id, user, router]);

  const handleAnalysisComplete = (result) => {
    setAnalysisResult(result);
    setChartKey((k) => k + 1);
    if (result.generation?._id) {
      setGenerationId(result.generation._id);
    }
  };

  if (!ready || !user) return null;

  return (
    <>
      <Navbar />
      <main className="pt-24 pb-16 min-h-screen px-4">
        <div className="max-w-5xl mx-auto">
          <Link href="/backtester" className="inline-flex items-center gap-1.5 text-sm text-text-tertiary hover:text-accent-cyan transition-colors mb-6 no-underline">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            All Portfolios
          </Link>

          {loading ? (
            <div className="terminal-card p-8 h-96 animate-pulse" />
          ) : (
            <>
              <PortfolioBuilder
                existingData={existingData}
                editingId={generationId}
                onAnalysisComplete={handleAnalysisComplete}
              />

              {analysisResult && (
                <div className="mt-6">
                  <PortfolioChart
                    key={chartKey}
                    analysisData={analysisResult}
                    generationId={generationId}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
