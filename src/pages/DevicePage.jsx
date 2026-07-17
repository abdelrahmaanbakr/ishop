import { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDevices } from '../hooks/useDevices';
import { useAuth } from '../context/AuthContext';
import { usePricing } from '../context/PricingContext';
import { useToast } from '../context/ToastContext';
import { computePriceView } from '../lib/priceView';
import { deviceImageUrl } from '../lib/api';
import { waLink, formatPrice } from '../utils/format';
import BatteryRing from '../components/BatteryRing';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ImageCarousel from '../components/ImageCarousel';
import Lightbox from '../components/Lightbox';
import ShareBar from '../components/ShareBar';

const FIELDS = [
  ['الموديل', 'model'], ['السعة', 'storage'], ['اللون', 'color'],
  ['البطارية', 'battery'], ['الدورات', 'cycles'], ['الشريحة', 'sim'],
  ['العلبة', 'box'], ['الصيانة', 'repair'], ['الجمرك', 'tax'],
  ['الضمان', 'warrantyDisplay'], ['القفل', 'lock'],
  ['العيوب', 'defects'], ['إضافات', 'extras'],
];

export default function DevicePage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { permissions, isGuest } = useAuth();
  const { records, archived, loading } = useDevices({ guest: isGuest });
  const { defaultPolicy, activePolicies, unlockedByDevice } = usePricing();
  const { show } = useToast();
  const [lightbox, setLightbox] = useState(null);

  // لينك مشترك (تحميل مباشر بلا انتقال داخلي) → الزائر ما يشوفش أي أسعار،
  // ولا حتى السعر الافتراضي المُعلَن. الموظف/الأدمن يشوفوا عادي.
  const hidePrices = isGuest && !location.state?.internal;

  const all = [...(records || []), ...(archived || [])];
  const r = all.find(
    (d) => String(d.code) === String(code) || String(d.sheetRow) === String(code)
  );

  if (loading && !r) {
    return <div className="py-24 text-center text-sm font-bold text-muted">جاري التحميل…</div>;
  }

  if (!r) {
    return (
      <div className="space-y-4 py-24 text-center">
        <div className="text-5xl opacity-40">🔍</div>
        <p className="text-sm font-bold text-muted">الجهاز غير متاح</p>
        <Button onClick={() => navigate('/devices')}>‹ رجوع للأجهزة</Button>
      </div>
    );
  }

  const { applied, defaultPrice } = hidePrices
    ? { applied: [], defaultPrice: null }
    : computePriceView({
        record: r,
        isAdmin: !!permissions?.isAdmin,
        defaultPolicy,
        activePolicies,
        unlockedByDevice,
      });

  const wa = waLink(r);
  const shareUrl = `${window.location.origin}/d/${r.code || r.sheetRow}`;
  const shareText = `${r.model} ${r.storage}`.trim();

  async function copyInfo() {
    const lines = [
      `📱 *${r.model} ${r.storage}*${r.code ? ' — كود: #' + r.code : ''}`,
      `🔋 البطارية: ${r.battery}`,
      r.cycles !== '-' && `⚡ الشحنات: ${r.cycles}`,
      r.color !== '-' && `🎨 اللون: ${r.color}`,
      r.sim !== '-' && `📶 الشريحة: ${r.sim}`,
      r.box !== '-' && `📦 الكرتونة: ${r.box}`,
      r.repair !== '-' && `🔧 صيانة: ${r.repair}`,
      r.tax !== '-' && `🏛️ الجمارك: ${r.tax}`,
      r.warranty !== '-' && `✅ الضمان: ${r.warrantyDisplay}`,
      r.lock !== '-' && `🔒 الشفرة: ${r.lock}`,
      r.defects !== '-' && `⚠️ أعطال: ${r.defects}`,
      r.extras !== '-' && `💬 ملاحظات: ${r.extras}`,
      r.phone && r.phone !== '-' && `📞 للتواصل: ${r.phone}`,
    ].filter(Boolean);
    const text = lines.join('\n');
    try {
      await navigator.clipboard.writeText(text);
      show('📋 اتنسخت بيانات الجهاز');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      show('📋 اتنسخت بيانات الجهاز');
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 py-4">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm font-bold text-muted transition hover:text-accent"
      >
        ‹ رجوع
      </button>

      {/* الرأس: البطارية + الموديل + الأسعار */}
      <div className="flex items-start gap-3">
        <BatteryRing value={r.battery} />
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-black text-text">{r.model}</h1>
          <p className="num text-sm text-muted">
            {r.storage}{r.code && ` · #${r.code}`}
          </p>
          {applied.map((row, i) => (
            <p key={i} className="num mt-1 text-xl font-black text-[var(--mtc-success)]">
              {row.name}: {formatPrice(row.price)}
            </p>
          ))}
          {defaultPrice != null && (applied.length > 0 ? (
            <p className="num text-sm font-bold text-muted line-through">{formatPrice(defaultPrice)}</p>
          ) : (
            <p className="num mt-1 text-lg font-black text-accent">{formatPrice(defaultPrice)}</p>
          ))}
        </div>
      </div>

      <ShareBar url={shareUrl} text={shareText} />

      {r.images?.length > 0 && (
        <ImageCarousel images={r.images.map(deviceImageUrl)} alt={r.model} onOpen={setLightbox} />
      )}

      <dl className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {FIELDS.map(([label, key]) =>
          r[key] && r[key] !== '-' ? (
            <div key={key} className="flex flex-col">
              <dt className="text-[11px] font-bold text-muted">{label}</dt>
              <dd className="num text-sm font-bold text-text">{r[key]}</dd>
            </div>
          ) : null
        )}
      </dl>

      {!isGuest && (
        <div className="flex flex-wrap gap-1.5">
          <Badge tone="muted">أضافه: {r.addedby}</Badge>
          <Badge tone="muted">{r.date}</Badge>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={copyInfo}>📋 نسخ البيانات</Button>
        {r.phone && r.phone !== '-' && (
          <a
            href={`tel:${r.phone}`}
            className="inline-flex items-center gap-2 rounded-xl border border-accent-line bg-accent-soft px-4 py-2.5 text-sm font-bold text-accent transition hover:bg-accent hover:text-on-accent"
          >
            📞 اتصال بالبائع
          </a>
        )}
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-[#25d366]/25 bg-[#25d366]/12 px-4 py-2.5 text-sm font-bold text-[#25d366] transition hover:bg-[#25d366]/25"
          >
            💬 واتساب
          </a>
        )}
      </div>

      {lightbox !== null && (
        <Lightbox images={r.images.map(deviceImageUrl)} index={lightbox} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}
