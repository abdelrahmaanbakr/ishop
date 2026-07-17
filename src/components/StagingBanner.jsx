import { isProdOrigin } from '../lib/supabase';

/** بيختفي تلقائيًا على الدومين النهائي.
 *  النص عام عن قصد — ما بيلمّحش لوجود حسابات أو تسجيل دخول. */
export default function StagingBanner() {
  if (isProdOrigin()) return null;

  return (
    <div className="relative z-20 bg-[var(--mtc-warning)] px-3 py-1 text-center text-[11px] font-black text-black">
      ⚠️ نسخة تجربة
    </div>
  );
}
