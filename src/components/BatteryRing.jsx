/** utils.js:60 — نفس الأرقام ونفس عتبات الألوان */
const R = 20;
const C = 2 * Math.PI * R;

export default function BatteryRing({ value }) {
  const n = parseInt(value) || 0;

  if (n <= 0) {
    return (
      <div className="relative grid size-[46px] place-items-center">
        <svg viewBox="0 0 46 46" className="absolute size-full -rotate-90">
          <circle cx="23" cy="23" r={R} fill="none" strokeWidth="3.5"
                  stroke="var(--border)" />
        </svg>
        <span className="num text-xs font-black text-muted">—</span>
      </div>
    );
  }

  const pct = Math.max(0, Math.min(100, n));
  const col = pct >= 80 ? '#2ecc71' : pct >= 60 ? '#f5c842' : '#e74c3c';
  const off = C * (1 - pct / 100);

  return (
    <div className="relative grid size-[46px] place-items-center" title={`البطارية ${pct}%`}>
      <svg viewBox="0 0 46 46" className="absolute size-full -rotate-90">
        <circle cx="23" cy="23" r={R} fill="none" strokeWidth="3.5" stroke="var(--border)" />
        <circle
          cx="23" cy="23" r={R} fill="none" strokeWidth="3.5" strokeLinecap="round"
          stroke={col}
          strokeDasharray={C.toFixed(2)}
          strokeDashoffset={off.toFixed(2)}
        />
      </svg>
      <span className="num text-xs font-black" style={{ color: col }}>{pct}</span>
    </div>
  );
}
