'use client';
import { useState, useEffect, useRef } from 'react';
import { portfolioAPI } from '../lib/api';

export default function TickerSearch({ onSelect, excludeTickers = [] }) {
  const [query, setQuery] = useState('');
  const [assets, setAssets] = useState({});
  const [searching, setSearching] = useState(false);
  const [customResult, setCustomResult] = useState(null);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    portfolioAPI.getAssets().then((data) => setAssets(data.assets || {})).catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    if (!query.trim()) { setCustomResult(null); return; }
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const result = await portfolioAPI.searchTicker(query.trim().toUpperCase());
        setCustomResult(result);
      } catch {
        setCustomResult(null);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [query]);

  const filtered = {};
  const q = query.toLowerCase();
  for (const [cat, items] of Object.entries(assets)) {
    const matches = items.filter(
      (a) =>
        !excludeTickers.includes(a.ticker) &&
        (a.ticker.toLowerCase().includes(q) || a.name.toLowerCase().includes(q))
    );
    if (matches.length > 0) filtered[cat] = matches;
  }

  const categoryLabels = {
    tech_stocks: 'Tech',
    established_stocks: 'Blue Chip',
    pharma_stocks: 'Pharma',
    crypto: 'Crypto',
    commodities: 'Commodities',
    metals: 'Metals',
    etfs: 'ETFs',
  };

  const handleSelect = (ticker, name) => {
    onSelect(ticker, name);
    setQuery('');
    setOpen(false);
    setCustomResult(null);
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          placeholder="Search ticker or name..."
          className="!pl-10"
        />
        {searching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && (query || Object.keys(assets).length > 0) && (
        <div
          className="absolute z-50 mt-1 w-full max-h-72 overflow-y-auto rounded-xl border border-border-primary"
          style={{ background: '#0f1520', boxShadow: '0 12px 40px rgba(0,0,0,0.5)' }}
        >
          {/* Custom search result */}
          {customResult?.found && !excludeTickers.includes(customResult.ticker) && (
            <div className="p-2 border-b border-border-primary">
              <button
                onClick={() => handleSelect(customResult.ticker, customResult.name)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent-cyan/5 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <span className="font-mono text-sm font-semibold text-accent-cyan">{customResult.ticker}</span>
                  <span className="text-xs text-text-tertiary ml-2">{customResult.name}</span>
                </div>
                <span className="text-[10px] font-mono text-text-tertiary bg-bg-tertiary px-1.5 py-0.5 rounded group-hover:text-accent-cyan">
                  + ADD
                </span>
              </button>
            </div>
          )}

          {/* Categorized list */}
          {Object.entries(filtered).map(([cat, items]) => (
            <div key={cat}>
              <div className="px-4 py-1.5 text-[10px] font-mono font-bold text-text-tertiary uppercase tracking-widest sticky top-0" style={{ background: '#0f1520' }}>
                {categoryLabels[cat] || cat}
              </div>
              {items.slice(0, 8).map((asset) => (
                <button
                  key={asset.ticker}
                  onClick={() => handleSelect(asset.ticker, asset.name)}
                  className="w-full text-left px-4 py-2 hover:bg-accent-cyan/5 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono text-sm font-medium text-text-primary">{asset.ticker}</span>
                    <span className="text-xs text-text-tertiary truncate">{asset.name}</span>
                  </div>
                </button>
              ))}
            </div>
          ))}

          {Object.keys(filtered).length === 0 && !customResult?.found && query && !searching && (
            <div className="px-4 py-6 text-center text-sm text-text-tertiary">
              No matching tickers found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
