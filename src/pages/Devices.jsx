import { useMemo, useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useDevices } from '../hooks/useDevices';
import { useSearchHistory } from '../hooks/useSearchHistory';
import { getBrand } from '../lib/brands';
import { batteryNum } from '../utils/format';
import { PAGE_SIZE } from '../lib/constants';
import DeviceCard from '../components/DeviceCard';
import DeviceTable from '../components/DeviceTable';
import CompareModal from '../components/CompareModal';
import ShareModal, { buildShareUrl } from '../components/ShareModal';
import { SkeletonCard } from '../components/ui/Skeleton';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { exportCSV } from '../lib/export';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useToast } from '../context/ToastContext';
import { deleteDevice, deleteDeviceImage } from '../lib/api';
import { usePricing } from '../context/PricingContext';

// مودالات الكتابة مؤجّلة — الزائر بيشارك صفحة Devices بس عمره
// ما هيفتحها (الأزرار مخفية عنه)، فما تدخلش الـ bundle العام.
const EditModal = lazy(() => import('../components/EditModal'));
const DeleteModal = lazy(() => import('../components/DeleteModal'));
const ArchiveModal = lazy(() => import('../components/ArchiveModal'));
import { LS_KEYS } from '../lib/constants';
import { useRef, useEffect } from 'react';

export default function Devices() {
  const { permissions, isGuest } = useAuth();
  const { records, loading, error, reload } = useDevices({ guest: isGuest });
  const { history, push: pushHistory, clear: clearHistory } = useSearchHistory();

  const [q, setQ] = useState('');
  const [brand, setBrand] = useState('');
  const [addedby, setAddedby] = useState('');
  const [batMin, setBatMin] = useState(0);
  const [sort, setSort] = useState('');
  const [page, setPage] = useState(1);
  const navigate = useNavigate();
  const openDevice = (r) =>
    navigate('/d/' + encodeURIComponent(r.code || r.sheetRow), { state: { internal: true } });

  const { show } = useToast();
  const { unlock } = usePricing();
  const [code, setCode] = useState('');
  const [unlockBusy, setUnlockBusy] = useState(false);
  const searchRef = useRef(null);

  // فتح الأسعار بالكود. silent=true للبحث (ما يقولش "غلط" عشان ما يلمّحش)
  async function tryUnlock(value, silent) {
    const c = String(value || '').trim();
    if (!c) return false;
    setUnlockBusy(true);
    try {
      const res = await unlock(c);
      if (res.count > 0) {
        show(`✅ تم تطبيق أسعار «${res.policyName}»`);
        return true;
      }
      if (!silent) show('❌ كود غير صحيح', 'error');
      return false;
    } catch {
      if (!silent) show('❌ حصل خطأ، حاول تاني', 'error');
      return false;
    } finally {
      setUnlockBusy(false);
    }
  }
  const [layout, setLayout] = useLocalStorage(LS_KEYS.layout, 'grid');
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState([]);
  const [showCompare, setShowCompare] = useState(false);
  const [shareUrl, setShareUrl] = useState(null);
  const [help, setHelp] = useState(false);
  const [editDevice, setEditDevice] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [archiveTarget, setArchiveTarget] = useState(null);

  async function handleDelete(device) {
    // نحذف صور الجهاز من الـ Storage الأول (لو موجودة)، بعدين الصف
    if (device.images?.length) {
      for (const url of device.images) {
        try { await deleteDeviceImage(url); } catch { /* الصورة ممكن تكون اتشالت */ }
      }
    }
    await deleteDevice(device.sheetRow);
    show('✅ تم الحذف');
    reload();
  }

  // utils.js:650 — الرابط المشترك بيعبّي البحث والفلتر
  useEffect(() => {
    const p = new URLSearchParams(location.search);
    const uq = p.get('q');
    const ub = p.get('brand');
    if (uq) setQ(uq);
    if (ub) setBrand(ub);
  }, []);

  // utils.js:565 — جهازين بالظبط، لا أكتر
  function toggleCompare(id) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= 2) {
        show('⚖️ اختر جهازين فقط', 'error');
        return prev;
      }
      return [...prev, id];
    });
  }

  useKeyboardShortcuts({
    onSearchFocus: () => { searchRef.current?.focus(); searchRef.current?.select(); },
    onClear: () => reset(),
    onHelp: () => setHelp((v) => !v),
  });

  // القوائم مشتقّة من البيانات — data.js:197
  const brands = useMemo(() => {
    const set = [...new Set(records.map(getBrand).filter((b) => b && b !== 'أخرى'))].sort();
    if (records.some((r) => getBrand(r) === 'أخرى')) set.push('أخرى');
    return set;
  }, [records]);

  const people = useMemo(
    () => [...new Set(records.map((r) => (r.addedby || '').trim()).filter((x) => x && x !== '-'))].sort(),
    [records]
  );

  // ── نفس منطق doSearch — data.js:321 بالترتيب ده بالظبط ──
  const results = useMemo(() => {
    let out = records;
    if (brand) out = out.filter((r) => getBrand(r) === brand);
    if (addedby) out = out.filter((r) => (r.addedby || '').trim() === addedby);
    if (q) out = out.filter((r) => r.model.toLowerCase().includes(q.trim().toLowerCase()));
    if (batMin > 0) out = out.filter((r) => batteryNum(r.battery) >= batMin);

    if (sort === 'bat-desc') out = [...out].sort((a, b) => batteryNum(b.battery) - batteryNum(a.battery));
    else if (sort === 'bat-asc') out = [...out].sort((a, b) => batteryNum(a.battery) - batteryNum(b.battery));
    else if (sort === 'name-asc') out = [...out].sort((a, b) => a.model.localeCompare(b.model, 'ar'));

    return out;
  }, [records, q, brand, addedby, batMin, sort]);

  const pages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const slice = results.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE);

  const dirty = q || brand || addedby || batMin > 0 || sort;

  function reset() {
    setQ(''); setBrand(''); setAddedby(''); setBatMin(0); setSort(''); setPage(1);
  }

  const selectCls =
    'rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-text outline-none ' +
    'focus:border-accent focus:ring-3 focus:ring-[var(--focus-ring)]';

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-sm font-bold text-danger">❌ {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 py-6">
      {isGuest && (
        <div className="rounded-3xl border border-accent-line bg-accent-soft p-5 text-center">
          <h1 className="text-2xl font-black text-accent">الأجهزة المتاحة</h1>
          <p className="num mt-1 text-sm text-muted">{records.length} جهاز</p>
        </div>
      )}

      {/* خانة الكود الخاص — محايدة، بلا أي إشارة للأسعار */}
      {isGuest && (
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="اكتب الكود الخاص بك هنا"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') tryUnlock(code, false).then((ok) => ok && setCode(''));
              }}
            />
          </div>
          <Button loading={unlockBusy} onClick={() => tryUnlock(code, false).then((ok) => ok && setCode(''))}>
            تأكيد
          </Button>
        </div>
      )}

      {/* ── البحث ── */}
      <div className="space-y-3">
        <Input
          ref={searchRef}
          placeholder="ابحث باسم الموديل..."
          value={q}
          onChange={(e) => { setQ(e.target.value); setPage(1); }}
          onBlur={() => q.trim() && pushHistory(q)}
          onKeyDown={(e) => {
            // فتح صامت بالكود من خانة البحث — كود غلط يتصرّف كبحث عادي
            if (e.key === 'Enter' && q.trim()) {
              tryUnlock(q, true).then((ok) => { if (ok) setQ(''); });
            }
          }}
        />

        <div className="flex flex-wrap gap-2">
          <select value={brand} onChange={(e) => { setBrand(e.target.value); setPage(1); }} className={selectCls}>
            <option value="">كل الأنواع</option>
            {brands.map((b) => <option key={b} value={b}>{b}</option>)}
          </select>

          {!isGuest && (
            <select value={addedby} onChange={(e) => { setAddedby(e.target.value); setPage(1); }} className={selectCls}>
              <option value="">كل المدخلين</option>
              {people.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          )}

          <select value={sort} onChange={(e) => setSort(e.target.value)} className={selectCls}>
            <option value="">الأحدث أولاً</option>
            <option value="bat-desc">البطارية: الأعلى</option>
            <option value="bat-asc">البطارية: الأقل</option>
            <option value="name-asc">الاسم: أ–ي</option>
          </select>

          {dirty && <Button variant="plain" onClick={reset}>✕ مسح</Button>}
        </div>

        <label className="flex items-center gap-3 text-xs font-bold text-muted">
          <span className="shrink-0">أقل بطارية: <span className="num text-accent">{batMin}%</span></span>
          <input
            type="range" min="0" max="100" step="5"
            value={batMin}
            onChange={(e) => { setBatMin(+e.target.value); setPage(1); }}
            className="flex-1 accent-[var(--accent)]"
          />
        </label>

        {!isGuest && history.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-muted">آخر بحث:</span>
            {history.map((h) => (
              <button
                key={h}
                type="button"
                onClick={() => { setQ(h); setPage(1); }}
                className="rounded-full border border-border bg-surface px-2.5 py-1
                           text-[11px] font-bold text-muted transition hover:text-accent"
              >
                {h}
              </button>
            ))}
            <button
              type="button"
              onClick={clearHistory}
              className="text-[11px] font-bold text-muted transition hover:text-danger"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* ── شريط الإحصائيات ── */}
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text">
          📦 المعروض: <strong className="num text-accent">{results.length}</strong>
        </span>
        <span className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text">
          الإجمالي: <strong className="num text-accent">{records.length}</strong>
        </span>
      </div>

      {/* ── شريط الأدوات ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="plain"
          onClick={() => setLayout(layout === 'grid' ? 'table' : 'grid')}
          title="تبديل العرض"
        >
          {layout === 'grid' ? '☰ جدول' : '▦ بطاقات'}
        </Button>

        <Button
          variant={compareMode ? 'primary' : 'plain'}
          onClick={() => { setCompareMode((v) => !v); setCompareIds([]); }}
        >
          ⚖️ مقارنة
        </Button>

        {!isGuest && (
          <Button
            variant="plain"
            onClick={() => {
              const n = exportCSV(results);
              if (n) show(`📥 تم تصدير ${n} جهاز`);
              else show('لا توجد بيانات للتصدير', 'error');
            }}
          >
            📥 CSV
          </Button>
        )}

        <Button variant="plain" onClick={() => setShareUrl(buildShareUrl({ q, brand }))}>
          🔗 مشاركة
        </Button>
      </div>

      {/* ── شريط المقارنة ── */}
      {compareMode && (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl
                        border border-accent-line bg-accent-soft px-4 py-2.5">
          <span className="text-xs font-bold text-accent">
            {compareIds.length === 0
              ? 'اختر جهازين للمقارنة'
              : compareIds.length === 1
                ? 'اختر جهاز آخر للمقارنة'
                : 'جاهز للمقارنة ✓'}
          </span>
          <Button
            disabled={compareIds.length < 2}
            onClick={() => setShowCompare(true)}
          >
            قارن
          </Button>
        </div>
      )}

      {/* ── الشبكة ── */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : slice.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl opacity-40">🔍</div>
          <p className="mt-3 text-sm font-bold text-muted">مفيش أجهزة مطابقة</p>
        </div>
      ) : layout === 'table' ? (
        <DeviceTable
          records={slice}
          isGuest={isGuest}
          compareMode={compareMode}
          compareIds={compareIds}
          onToggleCompare={toggleCompare}
          onOpen={openDevice}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {slice.map((r) => (
            <DeviceCard
              key={r.sheetRow}
              record={r}
              permissions={permissions}
              isGuest={isGuest}
              compareMode={compareMode}
              picked={compareIds.includes(r.sheetRow)}
              onToggleCompare={toggleCompare}
              onOpen={openDevice}
              onEdit={setEditDevice}
              onDelete={setDeleteTarget}
              onArchive={setArchiveTarget}
            />
          ))}
        </div>
      )}

      {/* ── الترقيم ── */}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button variant="plain" disabled={current === 1} onClick={() => setPage(current - 1)}>
            ›
          </Button>
          <span className="num text-xs font-bold text-muted">
            {current} / {pages}
          </span>
          <Button variant="plain" disabled={current === pages} onClick={() => setPage(current + 1)}>
            ‹
          </Button>
        </div>
      )}

      <CompareModal
        open={showCompare}
        pair={compareIds.map((id) => records.find((r) => r.sheetRow === id)).filter(Boolean)}
        onClose={() => setShowCompare(false)}
      />

      <ShareModal
        open={!!shareUrl}
        url={shareUrl || ''}
        onClose={() => setShareUrl(null)}
      />

      {editDevice && (
        <Suspense fallback={null}>
          <EditModal
            device={editDevice}
            onSaved={reload}
            onClose={() => setEditDevice(null)}
          />
        </Suspense>
      )}

      {deleteTarget && (
        <Suspense fallback={null}>
          <DeleteModal
            device={deleteTarget}
            onConfirmed={handleDelete}
            onClose={() => setDeleteTarget(null)}
          />
        </Suspense>
      )}

      {archiveTarget && (
        <Suspense fallback={null}>
          <ArchiveModal
            device={archiveTarget}
            onArchived={reload}
            onClose={() => setArchiveTarget(null)}
          />
        </Suspense>
      )}

      {help && (
        <div className="fixed bottom-6 start-1/2 z-9995 -translate-x-1/2 rounded-2xl border
                        border-border bg-card px-5 py-3 text-xs text-muted shadow-2xl">
          <b className="text-accent">اختصارات:</b>{' '}
          <kbd className="num">/</kbd> بحث ·{' '}
          <kbd className="num">Esc</kbd> مسح ·{' '}
          <kbd className="num">?</kbd> إخفاء
        </div>
      )}
    </div>
  );
}
