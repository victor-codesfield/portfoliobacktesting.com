export default function TerminalCard({ title, children, className = '' }) {
  return (
    <div className={`terminal-card p-5 ${className}`}>
      {/* Terminal window dots */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-accent-red/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent-amber/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-accent-green/70" />
        </div>
        {title && (
          <span className="text-xs font-mono text-text-tertiary tracking-wide">
            {title}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
