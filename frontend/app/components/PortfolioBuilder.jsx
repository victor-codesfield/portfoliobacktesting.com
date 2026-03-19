'use client';
import { useState, useEffect } from 'react';
import { useAuthContext } from '../context/AuthContext';
import { portfolioAPI } from '../lib/api';
import { VALID_YEARS, ALLOCATION_COLORS, MAX_TICKERS } from '../lib/constants';
import TerminalCard from './TerminalCard';
import TickerSearch from './TickerSearch';
import AllocationBar from './AllocationBar';

const REBALANCE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'annual', label: 'Annual' },
  { value: 'quarterly', label: 'Quarterly' },
];

export default function PortfolioBuilder({ existingData, editingId, onAnalysisComplete }) {
  const { user } = useAuthContext();
  const [tickers, setTickers] = useState([]);
  const [ratios, setRatios] = useState([]);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
  const [periodMode, setPeriodMode] = useState('years'); // 'years' or 'dateRange'
  const [years, setYears] = useState(2);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [rebalanceFrequency, setRebalanceFrequency] = useState('none');
  const [monteCarlo, setMonteCarlo] = useState(false);
  const [name, setName] = useState('');
  const [validated, setValidated] = useState(false);
  const [validating, setValidating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingData) {
      setTickers(existingData.tickers || []);
      setRatios(existingData.allocation_ratios || []);
      setMonthlyInvestment(existingData.monthly_investment || 1000);
      // Support legacy rebalance_annually field
      if (existingData.rebalance_frequency) {
        setRebalanceFrequency(existingData.rebalance_frequency);
      } else if (existingData.rebalance_annually) {
        setRebalanceFrequency('annual');
      }
      setName(existingData.name || '');
      if (existingData.years) {
        setPeriodMode('years');
        setYears(existingData.years);
      } else if (existingData.start_date) {
        setPeriodMode('dateRange');
        setStartDate(existingData.start_date?.split('T')[0] || '');
        setEndDate(existingData.end_date?.split('T')[0] || '');
      }
      // Existing portfolios already have validated tickers — skip validation step
      if (existingData.analysis_data) {
        setValidated(true);
      }
    }
  }, [existingData]);

  const addTicker = (ticker) => {
    if (tickers.length >= MAX_TICKERS || tickers.includes(ticker)) return;
    const newTickers = [...tickers, ticker];
    const newRatios = newTickers.map(() => 1 / newTickers.length);
    setTickers(newTickers);
    setRatios(newRatios);
    setValidated(false);
  };

  const removeTicker = (idx) => {
    const newTickers = tickers.filter((_, i) => i !== idx);
    const newRatios = newTickers.length > 0
      ? newTickers.map(() => 1 / newTickers.length)
      : [];
    setTickers(newTickers);
    setRatios(newRatios);
    setValidated(false);
  };

  const updateRatio = (idx, val) => {
    const newRatios = [...ratios];
    newRatios[idx] = Math.max(0, Math.min(100, val)) / 100;
    setRatios(newRatios);
    setValidated(false);
  };

  const ratioSum = ratios.reduce((a, b) => a + b, 0);
  const ratiosValid = Math.abs(ratioSum - 1.0) < 0.01;

  const handleYearClick = (y) => {
    setYears(y);
    setPeriodMode('years');
    setValidated(false);
  };

  const handleValidate = async () => {
    setError('');
    setValidating(true);
    try {
      const params = periodMode === 'years'
        ? { tickers, years }
        : { tickers, dateRange: { startDate, endDate } };
      const result = await portfolioAPI.validateTickers(params.tickers, params.years, params.dateRange);
      if (result.valid) {
        setValidated(true);
      } else {
        const reasons = (result.invalidTickers || []).map((t) => `${t.ticker}: ${t.reason}`).join('\n');
        setError(`Validation failed:\n${reasons}`);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setValidating(false);
    }
  };

  const handleAnalyze = async () => {
    setError('');
    setAnalyzing(true);
    try {
      const payload = {
        tickers,
        allocation_ratios: ratios,
        monthly_investment: monthlyInvestment,
        rebalance_frequency: rebalanceFrequency,
        monte_carlo: monteCarlo,
        name: name || undefined,
      };
      if (periodMode === 'years') {
        payload.years = years;
      } else {
        payload.dateRange = { startDate, endDate };
      }
      let result;
      if (editingId) {
        // Update existing generation instead of creating a new one
        const updated = await portfolioAPI.updateGeneration(editingId, payload);
        // Normalize response: updateGeneration returns { generation: {...} }
        // where analysis is inside generation.analysis_data
        result = {
          analysis: updated.generation?.analysis_data || updated.generation?.AnalysisData,
          generation: updated.generation,
        };
      } else {
        result = await portfolioAPI.analyzePortfolio(payload);
      }
      onAnalysisComplete(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const canValidate = tickers.length > 0 && ratiosValid && monthlyInvestment > 0 && (periodMode === 'years' || (startDate && endDate));

  return (
    <TerminalCard title="portfolio-builder" className="animate-fade-in">
      {/* Portfolio name */}
      <div className="mb-5">
        <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1.5">Portfolio Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Portfolio"
          className="max-w-xs"
        />
      </div>

      {/* Ticker search */}
      <div className="mb-5">
        <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1.5">
          Assets <span className="text-text-tertiary">({tickers.length}/{MAX_TICKERS})</span>
        </label>
        {tickers.length < MAX_TICKERS && (
          <TickerSearch onSelect={addTicker} excludeTickers={tickers} />
        )}
      </div>

      {/* Ticker list with allocation inputs */}
      {tickers.length > 0 && (
        <div className="mb-5 space-y-2">
          {tickers.map((ticker, i) => (
            <div key={ticker} className="flex items-center gap-3 p-2.5 rounded-lg bg-bg-primary/50 border border-border-primary">
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
              />
              <span className="font-mono text-sm font-semibold text-text-primary min-w-[70px]">{ticker}</span>
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  value={Math.round(ratios[i] * 100)}
                  onChange={(e) => updateRatio(i, Number(e.target.value))}
                  className="!w-16 text-center text-sm font-mono !py-1.5"
                />
                <span className="text-xs text-text-tertiary font-mono">%</span>
              </div>
              <button
                onClick={() => removeTicker(i)}
                className="text-text-tertiary hover:text-accent-red transition-colors cursor-pointer p-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}

          {/* Ratio sum indicator */}
          <div className={`text-xs font-mono text-right ${ratiosValid ? 'text-accent-green' : 'text-accent-red'}`}>
            Total: {(ratioSum * 100).toFixed(0)}% {ratiosValid ? '\u2713' : '(must equal 100%)'}
          </div>

          <AllocationBar tickers={tickers} ratios={ratios} />
        </div>
      )}

      {/* Monthly investment */}
      <div className="mb-5">
        <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-1.5">Monthly Investment (USD)</label>
        <div className="relative max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary font-mono text-sm">$</span>
          <input
            type="number"
            min="1"
            value={monthlyInvestment}
            onChange={(e) => { setMonthlyInvestment(Number(e.target.value)); setValidated(false); }}
            className="!pl-7 max-w-xs font-mono"
          />
        </div>
      </div>

      {/* Time period */}
      <div className="mb-5">
        <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-2">Time Period</label>

        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setPeriodMode('years')}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border cursor-pointer transition-all ${periodMode === 'years' ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5' : 'border-border-primary text-text-tertiary hover:text-text-secondary'}`}
          >
            Preset Years
          </button>
          <button
            onClick={() => { setPeriodMode('dateRange'); setValidated(false); }}
            className={`text-xs font-mono px-3 py-1.5 rounded-md border cursor-pointer transition-all ${periodMode === 'dateRange' ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/5' : 'border-border-primary text-text-tertiary hover:text-text-secondary'}`}
          >
            Custom Range
          </button>
        </div>

        {periodMode === 'years' ? (
          <div className="flex flex-wrap gap-2">
            {VALID_YEARS.map((y) => (
              <button
                key={y}
                onClick={() => handleYearClick(y)}
                className={`px-4 py-2 rounded-lg text-sm font-mono font-medium border cursor-pointer transition-all ${
                  years === y && periodMode === 'years'
                    ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                    : 'border-border-primary text-text-secondary hover:border-text-tertiary hover:text-text-primary'
                }`}
              >
                {y}Y
              </button>
            ))}
          </div>
        ) : (
          <div className="flex gap-3 max-w-md">
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-text-tertiary mb-1">Start Date</label>
              <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setValidated(false); }} />
            </div>
            <div className="flex-1">
              <label className="block text-[10px] font-mono text-text-tertiary mb-1">End Date</label>
              <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setValidated(false); }} />
            </div>
          </div>
        )}
      </div>

      {/* Rebalance frequency */}
      <div className="mb-5">
        <label className="block text-xs font-mono text-text-tertiary uppercase tracking-wider mb-2">Rebalancing</label>
        <div className="flex flex-wrap gap-2">
          {REBALANCE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { setRebalanceFrequency(opt.value); setValidated(false); }}
              className={`px-4 py-2 rounded-lg text-sm font-mono font-medium border cursor-pointer transition-all ${
                rebalanceFrequency === opt.value
                  ? 'border-accent-cyan text-accent-cyan bg-accent-cyan/10 shadow-[0_0_12px_rgba(0,229,255,0.15)]'
                  : 'border-border-primary text-text-secondary hover:border-text-tertiary hover:text-text-primary'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Monte Carlo toggle */}
      <div className="mb-6">
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={monteCarlo}
            onChange={(e) => { setMonteCarlo(e.target.checked); setValidated(false); }}
            className="!w-4 !h-4 rounded accent-accent-cyan cursor-pointer"
          />
          <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
            Monte Carlo simulation
          </span>
          <span className="text-[10px] font-mono text-text-tertiary">(1,000 bootstrap simulations)</span>
        </label>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-accent-red/10 border border-accent-red/20 text-sm text-accent-red whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {!validated ? (
          <button onClick={handleValidate} disabled={!canValidate || validating} className="btn-primary">
            {validating ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                Validating...
              </span>
            ) : 'Validate Tickers'}
          </button>
        ) : (
          <button onClick={handleAnalyze} disabled={analyzing} className="btn-primary animate-glow">
            {analyzing ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-bg-primary/30 border-t-bg-primary rounded-full animate-spin" />
                {editingId ? 'Updating...' : 'Analyzing...'}
              </span>
            ) : (editingId ? 'Re-run Analysis' : 'Run Analysis')}
          </button>
        )}
      </div>
    </TerminalCard>
  );
}
