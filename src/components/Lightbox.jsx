import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export default function Lightbox({ images, index, onClose }) {
  const [i, setI] = useState(index);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') setI((v) => (v + 1) % images.length);
      if (e.key === 'ArrowRight') setI((v) => (v - 1 + images.length) % images.length);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [images.length, onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-9999 flex items-center justify-center bg-black/95 p-4"
      onClick={onClose}
    >
      <img
        src={images[i]}
        alt={`صورة ${i + 1} من ${images.length}`}
        className="max-h-full max-w-full object-contain"
        onClick={(e) => e.stopPropagation()}
      />

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setI((v) => (v - 1 + images.length) % images.length); }}
            className="absolute start-4 grid size-11 place-items-center rounded-full
                       bg-white/10 text-2xl text-white transition hover:bg-white/20"
            aria-label="السابق"
          >‹</button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setI((v) => (v + 1) % images.length); }}
            className="absolute end-4 grid size-11 place-items-center rounded-full
                       bg-white/10 text-2xl text-white transition hover:bg-white/20"
            aria-label="التالي"
          >›</button>
          <span className="num absolute bottom-6 rounded-full bg-white/10 px-3 py-1
                           text-xs font-bold text-white">
            {i + 1} / {images.length}
          </span>
        </>
      )}

      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 end-4 grid size-10 place-items-center rounded-full
                   bg-white/10 text-xl text-white transition hover:bg-white/20"
        aria-label="إغلاق"
      >✕</button>
    </div>,
    document.body
  );
}
