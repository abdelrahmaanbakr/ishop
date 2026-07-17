import { useState, useRef, useEffect } from 'react';
import { BRAND_MODELS } from '../lib/brands';
import Input from './ui/Input';
import Button from './ui/Button';
import Toggle from './ui/Toggle';
import { MAX_IMAGES } from '../lib/api';
import { toWhiteBg } from '../lib/whiteBg';
import { usePricing } from '../context/PricingContext';

// خيارات القوايم — منقولة حرفيًا من index.html
const STORAGE = ['64GB', '128GB', '256GB', '512GB', '1T', '2T'];
const SIM = ['شريحة', 'E-SIM'];
const YESNO = ['نعم', 'لا'];
const TAX = ['مسجل', 'غير مسجل'];
const WARRANTY = ['ساري', 'منتهي'];
const LOCK = ['مشفر على شبكة', 'غير مشفر على اي شبكة'];
const BRANDS = Object.keys(BRAND_MODELS);

const sel =
  'w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-text ' +
  'outline-none focus:border-accent focus:ring-3 focus:ring-[var(--focus-ring)]';

function Field({ label, children }) {
  return (
    <div className="flex w-full flex-col gap-1.5">
      <label className="text-xs font-bold text-muted">{label}</label>
      {children}
    </div>
  );
}

/**
 * فورم موحّد للإدخال والتعديل.
 * mode='add' | 'edit'. عند التعديل، initial بيملأ القيم.
 * القيم الفاضية بتتحول لـ '-' وقت الحفظ (نفس منطق الأصل).
 */
export default function DeviceForm({ mode, initial, defaultAddedby, onSubmit, onCancel, busy }) {
  const isEdit = mode === 'edit';
  const { activePolicies } = usePricing();

  // أسعار السياسات — مفهرسة بـ policy_id. في التعديل نملأها من الجهاز.
  const [prices, setPrices] = useState(() => {
    const init = {};
    const src = initial?.pricesByPolicy || {};
    for (const p of activePolicies) {
      const v = src[p.id];
      init[p.id] = v == null ? '' : String(v);
    }
    return init;
  });
  const setPrice = (pid) => (e) => setPrices((prev) => ({ ...prev, [pid]: e.target.value }));

  // لو السياسات وصلت بعد فتح الفورم، نملأ الحقول الناقصة بس (من غير مسح إدخال المستخدم)
  useEffect(() => {
    setPrices((prev) => {
      const next = { ...prev };
      const src = initial?.pricesByPolicy || {};
      let changed = false;
      for (const p of activePolicies) {
        if (!(p.id in next)) {
          const v = src[p.id];
          next[p.id] = v == null ? '' : String(v);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [activePolicies, initial]);
  const [brand, setBrand] = useState(initial?.brand ?? '');
  const [modelSelect, setModelSelect] = useState(
    initial?.brand === 'iPhone' ? initial?.model ?? '' : ''
  );
  const [modelText, setModelText] = useState(
    initial?.brand === 'iPhone' ? '' : initial?.model ?? ''
  );
  const [f, setF] = useState({
    storage: initial?.storage ?? '',
    battery: initial ? String(initial.battery ?? '').replace('%', '') : '',
    cycles: initial?.cycles ?? '',
    color: initial?.color && initial.color !== '-' ? initial.color : '',
    sim: initial?.sim && initial.sim !== '-' ? initial.sim : '',
    box: initial?.box && initial.box !== '-' ? initial.box : '',
    repair: initial?.repair && initial.repair !== '-' ? initial.repair : '',
    tax: initial?.tax && initial.tax !== '-' ? initial.tax : '',
    warranty: initial?.warranty && initial.warranty !== '-' ? initial.warranty : '',
    warrantyDate: initial?.warrantyDateRaw ?? '',
    lock: initial?.lock && initial.lock !== '-' ? initial.lock : '',
    defects: initial?.defects && initial.defects !== '-' ? initial.defects : '',
    extras: initial?.extras && initial.extras !== '-' ? initial.extras : '',
    addedby: initial?.addedby ?? defaultAddedby ?? '',
    phone: initial?.phone && initial.phone !== '-' ? initial.phone : '',
  });
  const [images, setImages] = useState([]); // {id, file, original, status:'raw'|'processing'|'done'|'failed'}
  const [whiteBg, setWhiteBg] = useState(false);
  const [bgErr, setBgErr] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef(null);
  const idRef = useRef(0);

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const isIphone = brand === 'iPhone';
  const model = isIphone ? modelSelect : modelText.trim();
  const bgProcessing = images.some((x) => x.status === 'processing');

  function pickImages(e) {
    const files = Array.from(e.target.files || []);
    if (fileRef.current) fileRef.current.value = '';
    setImages((prev) => {
      const room = Math.max(0, MAX_IMAGES - prev.length);
      const items = files.slice(0, room).map((f) => ({
        id: ++idRef.current, file: f, original: f, status: 'raw',
      }));
      return [...prev, ...items];
    });
  }

  // إزالة الخلفية: نعالج الصور "raw" واحدة-واحدة لما الزر ON، ونرجّع الأصل لما OFF
  useEffect(() => {
    if (!whiteBg) {
      setImages((p) =>
        p.some((x) => x.status !== 'raw' || x.file !== x.original)
          ? p.map((x) => ({ ...x, file: x.original, status: 'raw' }))
          : p
      );
      return;
    }
    const pending = images.find((x) => x.status === 'raw');
    if (!pending) return;
    let cancelled = false;
    (async () => {
      setImages((p) => p.map((x) => (x.id === pending.id ? { ...x, status: 'processing' } : x)));
      try {
        // مهلة زمنية: لو المعالجة علّقت (تحميل/تشغيل)، تفشل بدل ما تعلّق للأبد
        const white = await Promise.race([
          toWhiteBg(pending.original),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 90000)),
        ]);
        if (!cancelled) {
          setImages((p) => p.map((x) => (x.id === pending.id ? { ...x, file: white, status: 'done' } : x)));
        }
      } catch {
        if (!cancelled) {
          setImages((p) => p.map((x) => (x.id === pending.id ? { ...x, status: 'failed' } : x)));
          setBgErr(true);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [whiteBg, images]);

  function submit() {
    setErr('');
    if (bgProcessing) return setErr('⏳ استنى معالجة الصور تخلص');
    // نفس ترتيب تحقّقات الأصل بالظبط
    if (!brand) return setErr('❗ اختر نوع الموبايل');
    if (!model) return setErr('❗ اختر أو اكتب الموديل');
    if (!f.storage) return setErr('❗ اختر الذاكرة');
    if (!f.addedby.trim()) return setErr('❗ اكتب اسم المُدخِل');
    if (!f.phone.trim()) return setErr('❗ اكتب رقم التواصل');

    // القيم الفاضية → '-' (نفس الأصل)
    const dash = (v) => (v && String(v).trim() ? String(v).trim() : '-');
    const fields = {
      model,
      brand: brand || '-',
      storage: f.storage,
      battery: (f.battery || '0') + '%',
      cycles: dash(f.cycles),
      color: dash(f.color),
      sim: dash(f.sim),
      box: dash(f.box),
      repair: dash(f.repair),
      tax: dash(f.tax),
      warranty: dash(f.warranty),
      warranty_date: f.warranty === 'ساري' ? dash(f.warrantyDate) : '-',
      lock: dash(f.lock),
      defects: dash(f.defects),
      extras: dash(f.extras),
      addedby: f.addedby.trim(),
      phone: f.phone.trim(),
    };
    const priceEntries = activePolicies.map((p) => ({ policyId: p.id, price: prices[p.id] ?? '' }));
    onSubmit(fields, images.map((x) => x.file), priceEntries);
  }

  return (
    <div className="space-y-4">
      {/* النوع والموديل */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="النوع *">
          <select
            className={sel}
            value={brand}
            onChange={(e) => { setBrand(e.target.value); setModelSelect(''); setModelText(''); }}
          >
            <option value="">-- اختر --</option>
            {BRANDS.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>
        </Field>

        <Field label="الموديل *">
          {isIphone ? (
            <select className={sel} value={modelSelect} onChange={(e) => setModelSelect(e.target.value)}>
              <option value="">-- اختر --</option>
              {BRAND_MODELS.iPhone.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <input
              className={sel}
              value={modelText}
              onChange={(e) => setModelText(e.target.value)}
              placeholder="اكتب الموديل"
            />
          )}
        </Field>
      </div>

      {/* الذاكرة والبطارية */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="الذاكرة *">
          <select className={sel} value={f.storage} onChange={set('storage')}>
            <option value="">-- اختر --</option>
            {STORAGE.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Input label="البطارية %" type="number" min="0" max="100"
               value={f.battery} onChange={set('battery')} placeholder="مثال: 87" />
      </div>

      {/* اللون والدورات */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="اللون" value={f.color} onChange={set('color')} placeholder="أسود، أبيض..." />
        <Input label="الدورات" type="number" value={f.cycles} onChange={set('cycles')} />
      </div>

      {/* الشريحة والكرتونة */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="الشريحة">
          <select className={sel} value={f.sim} onChange={set('sim')}>
            <option value="">-- اختر --</option>
            {SIM.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="الكرتونة">
          <select className={sel} value={f.box} onChange={set('box')}>
            <option value="">-- اختر --</option>
            {YESNO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* الصيانة والجمارك */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="صيانة">
          <select className={sel} value={f.repair} onChange={set('repair')}>
            <option value="">-- اختر --</option>
            {YESNO.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        <Field label="الجمارك">
          <select className={sel} value={f.tax} onChange={set('tax')}>
            <option value="">-- اختر --</option>
            {TAX.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      {/* الضمان وتاريخه */}
      <div className="grid grid-cols-2 gap-3">
        <Field label="الضمان">
          <select className={sel} value={f.warranty} onChange={set('warranty')}>
            <option value="">-- اختر --</option>
            {WARRANTY.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
        {f.warranty === 'ساري' && (
          <Input label="تاريخ الضمان" type="date" value={f.warrantyDate} onChange={set('warrantyDate')} />
        )}
      </div>

      {/* القفل */}
      <Field label="القفل / الشفرة">
        <select className={sel} value={f.lock} onChange={set('lock')}>
          <option value="">-- اختر --</option>
          {LOCK.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </Field>

      {/* العيوب والإضافات */}
      <Input label="العيوب" value={f.defects} onChange={set('defects')} placeholder="اختياري" />
      <Input label="إضافات" value={f.extras} onChange={set('extras')} placeholder="اختياري" />

      {/* المُدخِل والتواصل */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="اسم المُدخِل *" value={f.addedby} onChange={set('addedby')} />
        <Input label="رقم التواصل *" value={f.phone} onChange={set('phone')} inputMode="tel" />
      </div>

      {/* الأسعار — حقول ديناميكية تتولّد من السياسات النشطة */}
      {activePolicies.length > 0 && (
        <div className="rounded-2xl border border-border bg-surface/40 p-3">
          <p className="mb-2 text-xs font-bold text-muted">الأسعار</p>
          <div className="grid grid-cols-2 gap-3">
            {activePolicies.map((p) => (
              <Input
                key={p.id}
                label={p.name}
                type="number"
                inputMode="numeric"
                min="0"
                value={prices[p.id] ?? ''}
                onChange={setPrice(p.id)}
                placeholder="ج.م"
              />
            ))}
          </div>
        </div>
      )}

      {/* الصور */}
      <Field label={`الصور (${images.length}/${MAX_IMAGES})`}>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={pickImages}
          disabled={images.length >= MAX_IMAGES}
          className="text-xs text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent-soft file:px-3 file:py-2 file:text-xs file:font-bold file:text-accent"
        />

        {/* زر اختياري: إزالة الخلفية → خلفية سوداء */}
        <div className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface/40 p-3">
          <div className="min-w-0">
            <p className="text-xs font-bold text-text">خلفية بيضاء</p>
            <p className="mt-0.5 text-[11px] text-muted">
              بيشيل الخلفية ويسيب الموبايل والكرتونة بس على خلفية بيضاء. أول مرة بتاخد وقت لتحميل الموديل والمحرّك، وبعدها أسرع (ثواني لكل صورة).
            </p>
          </div>
          <Toggle checked={whiteBg} onChange={setWhiteBg} busy={bgProcessing} label="خلفية بيضاء" />
        </div>

        {bgErr && (
          <p className="mt-2 text-[11px] font-bold text-danger">⚠️ بعض الصور تعذّر إزالة خلفيتها — هتترفع بخلفيتها الأصلية.</p>
        )}

        {images.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {images.map((img) => (
              <div key={img.id} className="relative">
                <img
                  src={URL.createObjectURL(img.file)}
                  alt=""
                  className="size-16 rounded-lg border border-border object-cover"
                />
                {img.status === 'processing' && (
                  <div className="absolute inset-0 grid place-items-center rounded-lg bg-black/60 text-[10px] font-bold text-white">
                    <span className="animate-spin text-base">◌</span>
                  </div>
                )}
                {img.status === 'failed' && (
                  <div className="absolute inset-x-0 bottom-0 bg-danger/80 text-center text-[9px] font-bold text-white">
                    تعذّر
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => setImages((p) => p.filter((x) => x.id !== img.id))}
                  className="absolute -top-1.5 -end-1.5 grid size-5 place-items-center rounded-full bg-danger text-[10px] text-white"
                >✕</button>
              </div>
            ))}
          </div>
        )}
        {isEdit && (
          <p className="mt-1 text-[11px] text-muted">
            ⚠️ الصور الجديدة تُضاف للصور الحالية
          </p>
        )}
      </Field>

      {err && (
        <p className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
          {err}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" loading={busy} disabled={bgProcessing} onClick={submit}>
          {busy ? 'جاري الحفظ...' : bgProcessing ? 'جاري معالجة الصور...' : isEdit ? 'حفظ التعديلات' : 'إضافة الجهاز'}
        </Button>
        <Button variant="plain" onClick={onCancel} disabled={busy}>إلغاء</Button>
      </div>
    </div>
  );
}
