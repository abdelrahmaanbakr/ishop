import { useEffect } from 'react';
import { createPortal } from 'react-dom';

/** شرح شارة — بطاقة أنيقة تفتح بالضغط، تُغلق بالضغط بره أو Esc. */
export default function BadgeModal({ badge, onClose }) {
  useEffect(() => {
    if (!badge) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [badge, onClose]);

  if (!badge) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-3xl border border-accent-line bg-card p-6 text-center
                      shadow-2xl animate-[fadeUp_.25s_ease]">
        <span className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl
                         border border-accent-line bg-accent-soft text-2xl text-accent">
          {badge.icon}
        </span>
        <h3 className="text-lg font-black text-text">{badge.title}</h3>
        <div className="mt-3 space-y-2.5 text-start text-[13px] leading-relaxed text-muted">
          {badge.body.split('\n\n').map((para, i) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl bg-accent py-2.5 text-sm font-bold text-on-accent
                     transition hover:brightness-110"
        >
          تمام
        </button>
      </div>
    </div>,
    document.body
  );
}
