const TONES = {
  ok: 'bg-[var(--mtc-success)]/15 text-[var(--mtc-success)] border-[var(--mtc-success)]/30',
  warn: 'bg-[var(--mtc-warning)]/15 text-[var(--mtc-warning)] border-[var(--mtc-warning)]/30',
  info: 'bg-[var(--mtc-info)]/15 text-[var(--mtc-info)] border-[var(--mtc-info)]/30',
  danger: 'bg-danger/15 text-danger border-danger/30',
  muted: 'bg-surface text-muted border-border',
  accent: 'bg-accent-soft text-accent border-accent-line',
};

/** بيحلّ محل yesNo / repairB / taxB / warrantyB / lockB من data.js */
export default function Badge({ tone = 'muted', children, className = '' }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5
                  text-[11px] font-bold whitespace-nowrap ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
