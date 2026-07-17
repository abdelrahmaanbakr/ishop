import { useRef, useState, useCallback, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemePanel';
import Button from '../components/ui/Button';
import SiteFooter from '../components/SiteFooter';
import BadgeModal from '../components/BadgeModal';
import SupportModal from '../components/SupportModal';
import { BADGES } from '../lib/badges';
import { SkeletonCard } from '../components/ui/Skeleton';
import { fetchDevices, deviceImageUrl } from '../lib/api';
import { formatBattery, batteryNum } from '../utils/format';
import { brandIcon, getBrand } from '../lib/brands';

// ══ الدخول السري ══════════════════════════════════════════════
// 5 ضغطات على اللوجو. العدّاد بيترجع صفر بعد ثانيتين، ومفيش أي أثر
// مرئي مهما ضغطت — اللوجو بيفضل لوجو عادي لحد الخامسة.
const TAPS_NEEDED = 5;
const TAP_WINDOW = 2000;

function useSecretTaps(onUnlock) {
  const count = useRef(0);
  const timer = useRef(null);

  return useCallback(() => {
    clearTimeout(timer.current);
    count.current += 1;
    if (count.current >= TAPS_NEEDED) {
      count.current = 0;
      onUnlock();
      return;
    }
    timer.current = setTimeout(() => { count.current = 0; }, TAP_WINDOW);
  }, [onUnlock]);
}

// ══ نظرة على المخزون — بيانات حقيقية ═════════════════════════
function useStock() {
  const [state, setState] = useState({ loading: true, count: 0, latest: [] });

  useEffect(() => {
    let alive = true;
    fetchDevices({ guest: true })
      .then((rows) => {
        if (!alive) return;
        setState({ loading: false, count: rows.length, latest: rows.slice(0, 4) });
      })
      .catch(() => alive && setState({ loading: false, count: 0, latest: [] }));
    return () => { alive = false; };
  }, []);

  return state;
}

const BAT_COLOR = (n) => (n >= 80 ? '#2ecc71' : n >= 60 ? '#f5c842' : '#e74c3c');

function TeaserCard({ r, onClick }) {
  const img = r.images?.[0] ? deviceImageUrl(r.images[0]) : null;
  const bat = formatBattery(r.battery);
  const n = batteryNum(bat);

  return (
    <button
      type="button"
      onClick={onClick}
      className="group overflow-hidden rounded-2xl border border-border bg-card text-start
                 transition hover:-translate-y-1 hover:border-accent-line"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-surface">
        {img ? (
          <img src={img} alt={r.model} loading="lazy"
               className="size-full object-cover transition group-hover:scale-105" />
        ) : (
          <div className="grid size-full place-items-center text-4xl opacity-40">
            {brandIcon(getBrand(r), r.model)}
          </div>
        )}
        {r.device_code && (
          <span className="num absolute top-2 start-2 rounded-full bg-accent px-2 py-0.5
                           text-[10px] font-black text-on-accent">
            #{r.device_code}
          </span>
        )}
      </div>

      <div className="p-3">
        <h3 className="truncate text-[13px] font-black text-text">{r.model}</h3>
        <p className="num truncate text-[11px] text-muted">
          {r.storage}{r.color && r.color !== '-' ? ` · ${r.color}` : ''}
        </p>
        <div className="mt-2 flex items-center justify-between">
          <span className="num text-xs font-bold" style={{ color: n ? BAT_COLOR(n) : 'var(--muted)' }}>
            🔋 {bat}
          </span>
          {r.warranty === 'ساري' && (
            <span className="rounded-full border border-[var(--mtc-success)]/30
                             bg-[var(--mtc-success)]/12 px-2 py-0.5 text-[10px] font-bold
                             text-[var(--mtc-success)]">
              ضمان
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

const FEATURES = [
  { icon: '🛡️', title: 'جودة مضمونة',   desc: 'كل جهاز بيعدّي فحص شامل — البطارية، الشاشة، الكاميرا، والشبكة.' },
  { icon: '🏅', title: 'خبرة منذ 2000',  desc: 'ربع قرن في الهواتف وإكسسواراتها والصيانة.' },
  { icon: '🎧', title: 'دعم فني متخصص', desc: 'خدمة ما بعد البيع — إحنا معاك بعد ما تشتري.', action: 'support' },
];

export default function Landing({ onStaffLogin }) {
  const { enterGuest } = useAuth();
  const onLogoTap = useSecretTaps(onStaffLogin);
  const { loading, count, latest } = useStock();
  const [busy, setBusy] = useState(false);
  const [openBadge, setOpenBadge] = useState(null);
  const [supportOpen, setSupportOpen] = useState(false);

  async function browse() {
    setBusy(true);
    await enterGuest();
  }

  return (
    <div className="relative z-1 mx-auto max-w-5xl px-5">
      {/* ══ الشريط ══ */}
      <nav className="flex items-center justify-between py-4">
        <button type="button" onClick={onLogoTap} aria-label="iShop"
                className="flex select-none items-center gap-2.5 outline-none">
          <span className="grid size-9 place-items-center rounded-xl border-2 border-accent
                           bg-accent-soft text-base">
            📱
          </span>
          <span className="text-start leading-none">
            <span className="block text-xl font-black text-accent">
              i<span className="text-text">Shop</span>
            </span>
            <span className="mt-0.5 block text-[8px] font-bold tracking-[0.22em] text-muted">
              MTC GROUP
            </span>
          </span>
        </button>
        <ThemeToggle />
      </nav>

      {/* ══ الهيرو ══ */}
      <section className="grid gap-6 py-4 md:grid-cols-2 md:items-center md:gap-10 md:py-10">
        <div className="md:order-1">
          {!loading && count > 0 && (
            <span className="mb-3.5 inline-flex items-center gap-2 rounded-full border
                             border-accent-line bg-accent-soft px-3 py-1.5 text-[11px]
                             font-black text-accent">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full
                                 bg-[var(--mtc-success)] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[var(--mtc-success)]" />
              </span>
              <span className="num">{count}</span> جهاز متاح الآن
            </span>
          )}

          <h1 className="text-[34px] leading-[1.2] font-black tracking-tight md:text-5xl">
            <span className="text-accent">معرض الأجهزة</span>
            <br />
            المستعملة
          </h1>

          <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-muted">
            أجهزة مختارة بعناية، بحالة ممتازة وأسعار تنافسية. كل جهاز بحالته
            وبطاريته وضمانه — قدامك بالتفصيل قبل ما تقرر.
          </p>

          <Button className="mt-5 w-full py-3.5 text-[15px] md:w-auto md:px-8"
                  loading={busy} onClick={browse}>
            🛍️ تصفّح الأجهزة المتاحة
          </Button>

          <div className="mt-4 grid grid-cols-2 gap-2">
            {BADGES.map((b, i) => (
              <button
                key={b.key}
                type="button"
                onClick={() => setOpenBadge(b)}
                className={`group flex w-full items-center justify-center gap-1 rounded-full border border-border
                           bg-surface px-3 py-1.5 text-[11px] font-bold whitespace-nowrap
                           text-muted transition hover:border-accent-line hover:text-accent
                           ${BADGES.length % 2 === 1 && i === BADGES.length - 1 ? 'col-span-2' : ''}`}
              >
                <span className="text-[var(--mtc-success)]">✓</span>
                {b.title}
                <span className="text-[9px] opacity-40 transition group-hover:opacity-70">ⓘ</span>
              </button>
            ))}
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[300px] md:order-2 md:max-w-none">
          <div className="absolute inset-[-12%] -z-1 rounded-full blur-3xl"
               style={{ background: 'radial-gradient(circle, var(--accent-soft), transparent 62%)' }} />
          <img src="/hero.jpg" alt="أجهزة iShop — موبايلات وساعات ولابتوبات"
               width="807" height="860"
               className="w-full rounded-3xl" fetchPriority="high" />
        </div>
      </section>

      {/* ══ الأرقام ══ */}
      <div className="grid grid-cols-3 gap-2 rounded-3xl border border-border bg-card p-5">
        {[
          [loading ? '—' : count, 'جهاز متاح'],
          ['+25', 'سنة خبرة'],
          ['100%', 'مفحوصة'],
        ].map(([v, l]) => (
          <div key={l} className="text-center">
            <b className="num block text-2xl font-semibold text-accent">{v}</b>
            <span className="text-[10px] font-bold text-muted">{l}</span>
          </div>
        ))}
      </div>

      {/* ══ وصل حديثًا ══ */}
      <section className="py-9">
        <div className="mb-4 flex items-baseline justify-between">
          <h2 className="text-xl font-black">وصل حديثًا</h2>
          <button type="button" onClick={browse}
                  className="text-xs font-black text-accent transition hover:opacity-70">
            شوف الكل ‹
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : latest.map((r) => <TeaserCard key={r.id} r={r} onClick={browse} />)}
        </div>
      </section>

      {/* ══ المميزات ══ */}
      <section className="grid gap-3 border-t border-border py-8 md:grid-cols-3">
        {FEATURES.map((f) => {
          const inner = (
            <>
              <span className="grid size-10 shrink-0 place-items-center rounded-xl
                               border border-accent-line bg-accent-soft text-lg">
                {f.icon}
              </span>
              <div>
                <h3 className="text-sm font-black text-text">
                  {f.title}
                  {f.action && <span className="ms-1.5 text-[10px] text-accent">← اضغط</span>}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-muted">{f.desc}</p>
              </div>
            </>
          );

          return f.action === 'support' ? (
            <button
              key={f.title}
              type="button"
              onClick={() => setSupportOpen(true)}
              className="flex items-start gap-3 rounded-2xl border border-accent-line bg-accent-soft/40 p-4 text-start
                         transition hover:bg-accent-soft hover:shadow-lg"
            >
              {inner}
            </button>
          ) : (
            <div key={f.title}
                 className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
              {inner}
            </div>
          );
        })}
      </section>

      {/* ══ الختام ══ */}
      <section className="my-4 rounded-3xl border border-accent-line px-6 py-10 text-center"
               style={{ background: 'linear-gradient(180deg, var(--accent-soft), transparent)' }}>
        <h2 className="text-2xl font-black">جاهز تشوف المتاح؟</h2>
        <p className="mt-2 text-[13px] text-muted">كل البيانات قدامك — من غير تسجيل ولا مكالمات</p>
        <Button className="mt-5 px-9 py-3.5" loading={busy} onClick={browse}>
          تصفّح الأجهزة
        </Button>
      </section>

      <BadgeModal badge={openBadge} onClose={() => setOpenBadge(null)} />

      <SupportModal open={supportOpen} onClose={() => setSupportOpen(false)} />

      <SiteFooter />

    </div>
  );
}
