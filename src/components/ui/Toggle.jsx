/**
 * مفتاح تبديل بشكل iOS (أخضر = ON، رمادي = OFF).
 * المقبض متموضع فيزيائيًا بـ left عشان يفضل صح في RTL.
 */
export default function Toggle({ checked = false, onChange, disabled = false, label, busy = false }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled || busy}
      onClick={() => !(disabled || busy) && onChange?.(!checked)}
      className={`relative inline-flex h-8 w-14 shrink-0 items-center rounded-full outline-none
                  transition-colors duration-200
                  focus-visible:ring-3 focus-visible:ring-[var(--focus-ring)]
                  disabled:cursor-not-allowed disabled:opacity-60
                  ${checked ? 'bg-[var(--mtc-success)]' : 'bg-[var(--muted)]/40'}`}
    >
      <span
        className={`absolute top-1 grid size-6 place-items-center rounded-full bg-white shadow-md
                    transition-all duration-200 ${checked ? 'left-7' : 'left-1'}`}
      >
        {busy && <span className="animate-spin text-[10px] text-muted" aria-hidden="true">◌</span>}
      </span>
    </button>
  );
}
