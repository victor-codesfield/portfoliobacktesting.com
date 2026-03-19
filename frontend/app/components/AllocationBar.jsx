import { ALLOCATION_COLORS } from '../lib/constants';

export default function AllocationBar({ tickers = [], ratios = [] }) {
  if (tickers.length === 0) return null;

  return (
    <div className="w-full">
      <div className="flex h-8 rounded-lg overflow-hidden border border-border-primary">
        {tickers.map((ticker, i) => {
          const pct = (ratios[i] || 0) * 100;
          if (pct <= 0) return null;
          const color = ALLOCATION_COLORS[i % ALLOCATION_COLORS.length];
          return (
            <div
              key={ticker}
              className="flex items-center justify-center overflow-hidden transition-all duration-300"
              style={{
                width: `${pct}%`,
                backgroundColor: color,
                minWidth: pct > 0 ? '2px' : 0,
              }}
            >
              {pct >= 10 && (
                <span className="text-[10px] font-mono font-bold text-bg-primary truncate px-1">
                  {ticker} {pct.toFixed(0)}%
                </span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
        {tickers.map((ticker, i) => (
          <div key={ticker} className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length] }}
            />
            <span className="text-xs font-mono text-text-secondary">
              {ticker} <span className="text-text-tertiary">{((ratios[i] || 0) * 100).toFixed(0)}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
