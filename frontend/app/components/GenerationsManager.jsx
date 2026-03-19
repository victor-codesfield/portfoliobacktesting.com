'use client';
import { useState } from 'react';
import { ALLOCATION_COLORS } from '../lib/constants';

export default function GenerationsManager({ generations = [], onSelect, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(null);

  if (generations.length === 0) {
    return (
      <div className="terminal-card p-8 text-center">
        <div className="text-text-tertiary mb-2">
          <svg className="mx-auto mb-3" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <path d="M8 7h8M8 12h4" />
          </svg>
        </div>
        <p className="text-text-secondary font-medium">No portfolios yet</p>
        <p className="text-sm text-text-tertiary mt-1">Create your first portfolio to get started</p>
      </div>
    );
  }

  const handleDelete = (id) => {
    if (confirmDelete === id) {
      onDelete(id);
      setConfirmDelete(null);
    } else {
      setConfirmDelete(id);
      setTimeout(() => setConfirmDelete(null), 3000);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {generations.map((gen) => (
        <div key={gen._id} className="terminal-card p-4 group cursor-pointer" onClick={() => onSelect(gen._id)}>
          <div className="flex items-start justify-between mb-3">
            <h3 className="font-semibold text-text-primary truncate pr-2">{gen.name || 'Unnamed'}</h3>
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(gen._id); }}
              className={`text-xs font-mono px-2 py-1 rounded transition-colors cursor-pointer shrink-0 ${
                confirmDelete === gen._id
                  ? 'bg-accent-red/20 text-accent-red border border-accent-red/30'
                  : 'text-text-tertiary hover:text-accent-red'
              }`}
            >
              {confirmDelete === gen._id ? 'Confirm?' : 'Delete'}
            </button>
          </div>

          {/* Ticker badges */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {(gen.tickers || []).map((ticker, i) => (
              <span
                key={ticker}
                className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                style={{
                  backgroundColor: `${ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]}15`,
                  color: ALLOCATION_COLORS[i % ALLOCATION_COLORS.length],
                  border: `1px solid ${ALLOCATION_COLORS[i % ALLOCATION_COLORS.length]}30`,
                }}
              >
                {ticker}
              </span>
            ))}
          </div>

          {/* Details */}
          <div className="flex items-center gap-4 text-xs text-text-tertiary font-mono">
            <span>${gen.monthly_investment?.toLocaleString()}/mo</span>
            {gen.years && <span>{gen.years}Y</span>}
            {gen.rebalance_annually && (
              <span className="text-accent-amber">Rebal</span>
            )}
          </div>

          {/* Date */}
          <div className="mt-2 text-[10px] text-text-tertiary">
            {gen.created_at ? new Date(gen.created_at).toLocaleDateString() : ''}
          </div>
        </div>
      ))}
    </div>
  );
}
