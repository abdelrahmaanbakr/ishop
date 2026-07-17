import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Button from './ui/Button';

/** مودال السياسات — بيتقفل بزر "موافق" أو Esc أو الضغط بره */
export default function PolicyModal({ policy, onClose }) {
  const boxRef = useRef(null);

  useEffect(() => {
    // ⚠️ الحارس ده لازم يبقى **جوّه** الـ effect.
    // الـ hooks بتشتغل قبل أي return في جسم المكوّن — فمن غيره كان
    // بيقفل تمرير الصفحة وهو مقفول، ويكسر الاسكرول في كل صفحة فيها فوتر.
    if (!policy) return undefined;

    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    boxRef.current?.focus();

    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [policy, onClose]);

  if (!policy) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-end justify-center bg-black/75 p-0
                 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        ref={boxRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={policy.title}
        className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl
                   border border-border bg-card outline-none sm:rounded-3xl"
      >
        {/* الرأس */}
        <div className="flex items-center gap-3 border-b border-border px-5 py-4">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl
                           border border-accent-line bg-accent-soft text-lg">
            {policy.icon}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-black text-text">{policy.title}</h2>
            <p className="text-[11px] text-muted">{policy.updated}</p>
          </div>
        </div>

        {/* المحتوى */}
        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5">
          {policy.sections.map((s) => (
            <section key={s.h}>
              <h3 className="mb-1 text-sm font-black text-accent">{s.h}</h3>
              <p className="text-[13px] leading-relaxed text-muted">{s.p}</p>
            </section>
          ))}
        </div>

        {/* الذيل */}
        <div className="border-t border-border p-4">
          <Button className="w-full py-3" onClick={onClose}>
            موافق
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
