const VARIANTS = {
  primary: 'bg-accent text-on-accent hover:brightness-110',
  ghost: 'bg-accent-soft text-accent border border-accent-line hover:bg-accent hover:text-on-accent',
  danger: 'bg-danger/10 text-danger border border-danger/25 hover:bg-danger/25',
  plain: 'bg-surface text-muted border border-border hover:text-text',
};

export default function Button({
  variant = 'primary',
  className = '',
  loading = false,
  disabled,
  children,
  ...rest
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5
                  text-sm font-bold transition active:scale-95
                  disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100
                  ${VARIANTS[variant]} ${className}`}
      {...rest}
    >
      {loading && <span className="animate-spin" aria-hidden="true">◌</span>}
      {children}
    </button>
  );
}
