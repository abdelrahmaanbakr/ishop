import { forwardRef, useId, useState } from 'react';

/** type="password" بيجيب زر الإظهار تلقائيًا — بيلغي toggleEye/togglePassVis/toggleUfPass */
const Input = forwardRef(function Input(
  { label, type = 'text', error, className = '', ...rest },
  ref
) {
  const id = useId();
  const [reveal, setReveal] = useState(false);
  const isPass = type === 'password';
  const actualType = isPass && reveal ? 'text' : type;

  return (
    <div className="flex w-full flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-xs font-bold text-muted">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          id={id}
          type={actualType}
          className={`w-full rounded-xl border bg-input px-3.5 py-2.5 text-sm text-text
                      transition outline-none placeholder:text-muted
                      focus:border-accent focus:ring-3 focus:ring-[var(--focus-ring)]
                      ${error ? 'border-danger' : 'border-border'}
                      ${isPass ? 'pe-11' : ''} ${className}`}
          {...rest}
        />
        {isPass && (
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute inset-y-0 end-0 flex w-11 items-center justify-center
                       text-muted transition hover:text-accent"
            aria-label={reveal ? 'إخفاء' : 'إظهار'}
          >
            {reveal ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <span className="text-xs font-bold text-danger">{error}</span>}
    </div>
  );
});

export default Input;
