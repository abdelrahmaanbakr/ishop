import { useRef, useState } from 'react';

/**
 * صورة واحدة في المرة + سحب للجانب.
 *
 * بيستخدم scroll-snap الأصلي للمتصفح — مش سحب يدوي بـ transform.
 * السبب: الدرج نفسه بيتمرّر رأسيًا، والسحب اليدوي كان بيتخانق معاه
 * (بتحاول تنزل تحت فتتحرك الصورة، وبالعكس). المتصفح بيعرف يفصل
 * بين المحورين لوحده، وكمان بيظبط الاتجاه في RTL من غير حسابات.
 */
export default function ImageCarousel({ images, alt, onOpen }) {
  const [i, setI] = useState(0);
  const ref = useRef(null);
  const moved = useRef(false);

  function onScroll() {
    const el = ref.current;
    if (!el) return;
    moved.current = true;
    // الشريط بيتمرّر بالسالب في RTL — الـ abs بيحيّد الاتجاه
    const idx = Math.round(Math.abs(el.scrollLeft) / el.clientWidth);
    setI(Math.max(0, Math.min(images.length - 1, idx)));
  }

  function goTo(n) {
    const el = ref.current;
    if (!el) return;
    const dir = getComputedStyle(el).direction === 'rtl' ? -1 : 1;
    el.scrollTo({ left: dir * n * el.clientWidth, behavior: 'smooth' });
  }

  if (!images?.length) return null;

  const single = images.length === 1;

  return (
    <div>
      <div
        ref={ref}
        onScroll={single ? undefined : onScroll}
        className={`flex aspect-3/4 overflow-x-auto overflow-y-hidden rounded-2xl
                    border border-border bg-surface
                    [-ms-overflow-style:none] [scrollbar-width:none]
                    [&::-webkit-scrollbar]:hidden
                    ${single ? '' : 'snap-x snap-mandatory'}`}
        style={{ overscrollBehaviorX: 'contain', WebkitOverflowScrolling: 'touch' }}
      >
        {images.map((src, n) => (
          <img
            key={src}
            src={src}
            alt={`${alt} — صورة ${n + 1}`}
            draggable={false}
            loading={n === 0 ? 'eager' : 'lazy'}
            onPointerDown={() => { moved.current = false; }}
            onClick={() => { if (!moved.current) onOpen?.(n); }}
            className="h-full w-full shrink-0 basis-full cursor-zoom-in snap-center object-cover"
          />
        ))}
      </div>

      {!single && (
        <>
          <span className="num mt-2 block text-center text-[11px] font-bold text-muted">
            {i + 1} / {images.length}
          </span>

          <div className="mt-1.5 flex justify-center gap-1.5">
            {images.map((src, n) => (
              <button
                key={src}
                type="button"
                onClick={() => goTo(n)}
                aria-label={`صورة ${n + 1}`}
                aria-current={n === i}
                className={`h-1.5 rounded-full transition-all ${
                  n === i ? 'w-5 bg-accent' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
