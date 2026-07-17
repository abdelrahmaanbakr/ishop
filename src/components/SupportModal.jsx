import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../lib/supabase';
import { getContactChannel } from '../lib/api';

// رقم افتراضي احتياطي لو القناة مش متاحة
const FALLBACK_WA = '201224822220';

// المحلات (ثابتة)
const SHOPS = ['App Tech', 'MTC store', 'MTC group'];

const inputCls =
  'w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-text ' +
  'outline-none focus:border-accent focus:ring-3 focus:ring-[var(--focus-ring)]';

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold text-muted">{label}</span>
      {children}
    </label>
  );
}

export default function SupportModal({ open, onClose }) {
  const [step, setStep] = useState('choose'); // choose | have | buy | done
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [supportWa, setSupportWa] = useState(FALLBACK_WA);

  // فورم "عندي جهاز"
  const [have, setHave] = useState({
    deviceType: '', model: '', purchaseDate: '', shop: SHOPS[0],
    name: '', phone: '', message: '',
  });
  // فورم "عايز أشتري"
  const [buy, setBuy] = useState({
    deviceType: '', model: '', budgetFrom: '', budgetTo: '', name: '', phone: '',
  });

  useEffect(() => {
    if (open) {
      setStep('choose');
      setErr('');
      // نجيب رقم الدعم من الجدول (لو متاح)
      getContactChannel('support')
        .then((ch) => { if (ch?.whatsapp) setSupportWa(ch.whatsapp); })
        .catch(() => { /* نستخدم الافتراضي */ });
    }
  }, [open]);

  if (!open) return null;

  const setH = (k) => (e) => setHave((p) => ({ ...p, [k]: e.target.value }));
  const setB = (k) => (e) => setBuy((p) => ({ ...p, [k]: e.target.value }));

  // بناء نص الطلب
  function buildText() {
    if (step === 'have') {
      return [
        '🛠️ *طلب دعم فني — جهاز مُشترى*',
        `📱 النوع: ${have.deviceType}`,
        `🔢 الموديل: ${have.model}`,
        have.purchaseDate && `📅 تاريخ الشراء: ${have.purchaseDate}`,
        `🏬 المحل: ${have.shop}`,
        `👤 الاسم: ${have.name}`,
        `📞 التواصل: ${have.phone}`,
        `📝 الطلب: ${have.message}`,
      ].filter(Boolean).join('\n');
    }
    // buy
    const budget = buy.budgetTo
      ? `${buy.budgetFrom || '—'} إلى ${buy.budgetTo}`
      : buy.budgetFrom ? `حد أقصى ${buy.budgetFrom}` : '—';
    return [
      '🛒 *طلب شراء جهاز*',
      `📱 النوع المطلوب: ${buy.deviceType}`,
      buy.model && `🔢 الموديل: ${buy.model}`,
      `💰 الميزانية: ${budget}`,
      `👤 الاسم: ${buy.name}`,
      `📞 التواصل: ${buy.phone}`,
    ].filter(Boolean).join('\n');
  }

  function validate() {
    if (step === 'have') {
      if (!have.deviceType.trim()) return 'اكتب نوع الجهاز';
      if (!have.model.trim()) return 'اكتب رقم الموديل';
      if (!have.name.trim()) return 'اكتب اسمك';
      if (!have.phone.trim()) return 'اكتب رقم التواصل';
      if (!have.message.trim()) return 'اشرح طلبك';
    } else {
      if (!buy.deviceType.trim()) return 'اكتب النوع المطلوب';
      if (!buy.name.trim()) return 'اكتب اسمك';
      if (!buy.phone.trim()) return 'اكتب رقم التواصل';
    }
    return '';
  }

  async function submit() {
    const v = validate();
    if (v) { setErr('❗ ' + v); return; }
    setErr('');
    setBusy(true);

    const text = buildText();

    // 1) إرسال لتليجرام (جروب الأجهزة) عبر Edge Function
    let tgOk = false;
    try {
      const { data, error } = await supabase.functions.invoke('tg-notify', {
        body: { text },
      });
      if (error) {
        console.error('tg-notify error:', error);
      } else {
        tgOk = data?.ok !== false;
      }
    } catch (e) {
      console.error('tg-notify threw:', e);
    }

    // 2) فتح واتساب بالنص جاهز (القناة الأساسية — دايمًا)
    const waUrl = `https://wa.me/${supportWa}?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');

    setBusy(false);
    setStep('done');
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[9990] flex items-center justify-center bg-black/75 p-4
                 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="flex max-h-[90vh] w-full max-w-md flex-col overflow-hidden rounded-3xl
                      border border-accent-line bg-card">
        {/* الرأس */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-10 place-items-center rounded-xl border border-accent-line bg-accent-soft text-lg">
              🎧
            </span>
            <h2 className="text-base font-black text-text">الدعم الفني</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق"
                  className="grid size-8 place-items-center rounded-full border border-border bg-surface text-muted transition hover:text-danger">
            ✕
          </button>
        </div>

        {/* المحتوى */}
        <div className="flex-1 overflow-y-auto p-5">
          {step === 'choose' && (
            <div className="space-y-4 text-center">
              <div>
                <h3 className="text-lg font-black text-text">أهلاً بك في قسم الدعم الفني</h3>
                <p className="mt-1 text-sm text-muted">كيف يمكننا مساعدتك؟</p>
              </div>
              <div className="space-y-2.5 pt-2">
                <button type="button" onClick={() => setStep('have')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-start transition hover:border-accent-line">
                  <span className="text-2xl">🛠️</span>
                  <span className="text-sm font-bold text-text">
                    اشتريت جهاز من iShop ومحتاج دعم فني
                  </span>
                </button>
                <button type="button" onClick={() => setStep('buy')}
                        className="flex w-full items-center gap-3 rounded-2xl border border-border bg-surface p-4 text-start transition hover:border-accent-line">
                  <span className="text-2xl">🛒</span>
                  <span className="text-sm font-bold text-text">عايز أشتري جهاز</span>
                </button>
              </div>
            </div>
          )}

          {step === 'have' && (
            <div className="space-y-3">
              <button type="button" onClick={() => setStep('choose')}
                      className="text-xs font-bold text-muted hover:text-accent">‹ رجوع</button>
              <Field label="نوع الجهاز *">
                <input className={inputCls} value={have.deviceType} onChange={setH('deviceType')} placeholder="iPhone، Samsung..." />
              </Field>
              <Field label="رقم الموديل *">
                <input className={inputCls} value={have.model} onChange={setH('model')} />
              </Field>
              <Field label="تاريخ الشراء">
                <input type="date" className={inputCls} value={have.purchaseDate} onChange={setH('purchaseDate')} />
              </Field>
              <Field label="اسم المحل *">
                <select className={inputCls} value={have.shop} onChange={setH('shop')}>
                  {SHOPS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الاسم *">
                  <input className={inputCls} value={have.name} onChange={setH('name')} />
                </Field>
                <Field label="رقم التواصل *">
                  <input className={inputCls} value={have.phone} onChange={setH('phone')} inputMode="tel" />
                </Field>
              </div>
              <Field label="اشرح طلبك ببساطة *">
                <textarea className={`${inputCls} min-h-20 resize-y`} value={have.message} onChange={setH('message')} />
              </Field>

              {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">{err}</p>}
              <button type="button" onClick={submit} disabled={busy}
                      className="w-full rounded-xl bg-accent py-3 text-sm font-black text-on-accent transition hover:brightness-110 disabled:opacity-60">
                {busy ? 'جاري الإرسال...' : '📤 إرسال الطلب'}
              </button>
            </div>
          )}

          {step === 'buy' && (
            <div className="space-y-3">
              <button type="button" onClick={() => setStep('choose')}
                      className="text-xs font-bold text-muted hover:text-accent">‹ رجوع</button>
              <Field label="النوع المطلوب *">
                <input className={inputCls} value={buy.deviceType} onChange={setB('deviceType')} placeholder="iPhone 15 Pro..." />
              </Field>
              <Field label="رقم الموديل">
                <input className={inputCls} value={buy.model} onChange={setB('model')} placeholder="اختياري" />
              </Field>
              <div>
                <span className="mb-1 block text-xs font-bold text-muted">الميزانية المرصودة</span>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} value={buy.budgetFrom} onChange={setB('budgetFrom')} placeholder="من / حد أقصى" inputMode="numeric" />
                  <input className={inputCls} value={buy.budgetTo} onChange={setB('budgetTo')} placeholder="إلى (اختياري)" inputMode="numeric" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="الاسم *">
                  <input className={inputCls} value={buy.name} onChange={setB('name')} />
                </Field>
                <Field label="رقم التواصل *">
                  <input className={inputCls} value={buy.phone} onChange={setB('phone')} inputMode="tel" />
                </Field>
              </div>

              {err && <p className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">{err}</p>}
              <button type="button" onClick={submit} disabled={busy}
                      className="w-full rounded-xl bg-accent py-3 text-sm font-black text-on-accent transition hover:brightness-110 disabled:opacity-60">
                {busy ? 'جاري الإرسال...' : '📤 إرسال الطلب'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-4 py-6 text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-full bg-[var(--mtc-success)]/15 text-3xl">
                ✅
              </div>
              <div>
                <h3 className="text-lg font-black text-text">تم إرسال طلب سيادتكم بنجاح</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">
                  وسيتم الرد بأسرع وقت. نشكركم على ثقتكم في iShop 🤝
                </p>
              </div>
              <button type="button" onClick={onClose}
                      className="w-full rounded-xl bg-accent py-3 text-sm font-black text-on-accent transition hover:brightness-110">
                تمام
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
