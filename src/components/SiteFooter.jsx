import { useState } from 'react';
import PolicyModal from './PolicyModal';
import { PRIVACY, RETURNS } from '../lib/policies';

/** فوتر واحد لكل الصفحات العامة — اللاندينج وصفحة الأجهزة.
 *  قبل كده كان في اللاندينج بس، فالعميل اللي بيتصفّح الأجهزة
 *  ما كانش بيلاقي السياسات أصلاً. */
export default function SiteFooter() {
  const [policy, setPolicy] = useState(null);

  const linkCls =
    'rounded-lg px-2 py-1 text-xs font-bold text-muted underline decoration-border ' +
    'underline-offset-4 transition hover:text-accent hover:decoration-accent';

  return (
    <>
      <footer className="mt-10 border-t border-border py-7 text-center">
        <div className="mb-3.5 flex flex-wrap items-center justify-center gap-1">
          <button type="button" className={linkCls} onClick={() => setPolicy(PRIVACY)}>
            🔒 سياسة الخصوصية
          </button>
          <span className="text-border">·</span>
          <button type="button" className={linkCls} onClick={() => setPolicy(RETURNS)}>
            ↩️ سياسة الاسترجاع
          </button>
        </div>

        <p className="text-xs font-bold text-muted">MTC Group — بنها، مصر</p>
        <p className="mt-1 text-[10px] text-muted opacity-60">
          أجهزة موبايل · إكسسوارات · صيانة
        </p>
      </footer>

      <PolicyModal policy={policy} onClose={() => setPolicy(null)} />
    </>
  );
}
