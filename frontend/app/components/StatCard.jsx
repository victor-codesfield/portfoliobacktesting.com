export default function StatCard({ label, value, delta, prefix = '', color, active, onClick }) {
  const isPositive = delta > 0;
  const isNegative = delta < 0;

  return (
    <div
      onClick={onClick}
      className={`terminal-card px-4 py-3 transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:border-text-tertiary' : ''
      } ${active ? '!border-opacity-60 ring-1 ring-inset' : ''}`}
      style={active && color ? { borderColor: color, boxShadow: `0 0 16px ${color}22`, '--tw-ring-color': color } : undefined}
    >
      <p className="text-xs text-text-tertiary font-medium mb-1 uppercase tracking-wider">{label}</p>
      <p
        className="text-xl font-mono font-bold"
        style={{ color: color || '#00e5ff', textShadow: `0 0 12px ${color || 'rgba(0, 229, 255, 0.15)'}33` }}
      >
        {prefix}{typeof value === 'number' ? value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : value}
      </p>
      {delta !== undefined && delta !== null && (
        <p className={`text-xs font-mono mt-0.5 ${isPositive ? 'text-accent-green' : isNegative ? 'text-accent-red' : 'text-text-tertiary'}`}>
          {isPositive ? '\u25B2' : isNegative ? '\u25BC' : '\u2014'}{' '}
          {Math.abs(delta).toFixed(1)}%
        </p>
      )}
    </div>
  );
}
