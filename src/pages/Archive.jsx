import { useMemo, useState, lazy, Suspense } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useDevices } from '../hooks/useDevices';
import { unarchiveDevice } from '../lib/api';
import { printReceipt } from '../lib/receipt';
import { getBrand, brandIcon } from '../lib/brands';
import { batteryNum } from '../utils/format';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SkeletonCard } from '../components/ui/Skeleton';

const Modal = lazy(() => import('../components/ui/Modal'));

// حقول تفاصيل الجهاز المؤرشف (تظهر عند الضغط على السجل)
const ARCHIVE_FIELDS = [
  ['السبب', 'archiveReason'], ['تاريخ الأرشفة', 'archiveDate'],
  ['المشتري', 'buyerName'], ['هاتف المشتري', 'buyerPhone'], ['IMEI', 'imei'],
];
const DEVICE_FIELDS = [
  ['الموديل', 'model'], ['السعة', 'storage'], ['اللون', 'color'],
  ['البطارية', 'battery'], ['الدورات', 'cycles'], ['الشريحة', 'sim'],
  ['العلبة', 'box'], ['الصيانة', 'repair'], ['الجمرك', 'tax'],
  ['الضمان', 'warrantyDisplay'], ['القفل', 'lock'],
  ['العيوب', 'defects'], ['إضافات', 'extras'],
  ['المُدخِل', 'addedby'], ['تاريخ الإدخال', 'date'], ['رقم التواصل', 'phone'],
];

export default function Archive() {
  const { permissions } = useAuth();
  const { show } = useToast();
  const { archived, loading, error, reload } = useDevices({ guest: false });

  const [q, setQ] = useState('');
  const [reason, setReason] = useState('');
  const [unarchiveTarget, setUnarchiveTarget] = useState(null);
  const [detail, setDetail] = useState(null);
  const [busy, setBusy] = useState(false);

  // غير الأدمن يشوف أرشيفه هو بس (نفس منطق ui.js:669)
  const mine = useMemo(() => {
    if (permissions?.isAdmin) return archived;
    return archived.filter((r) => r.addedby === permissions?.display);
  }, [archived, permissions]);

  const results = useMemo(() => {
    let out = mine;
    if (q) {
      const term = q.trim().toLowerCase();
      out = out.filter((r) =>
        r.model.toLowerCase().includes(term) ||
        String(r.code).toLowerCase().includes(term) ||
        (r.buyerName || '').toLowerCase().includes(term) ||
        (r.buyerPhone || '').toLowerCase().includes(term) ||
        (r.imei || '').toLowerCase().includes(term)
      );
    }
    if (reason) out = out.filter((r) => r.archiveReason === reason);
    return out;
  }, [mine, q, reason]);

  const reasons = useMemo(
    () => [...new Set(mine.map((r) => r.archiveReason).filter(Boolean))],
    [mine]
  );

  async function doUnarchive(device) {
    setBusy(true);
    try {
      await unarchiveDevice(device.sheetRow);
      show('✅ رجع الجهاز للقائمة');
      setUnarchiveTarget(null);
      reload();
    } catch (e) {
      show('❌ فشل: ' + (e.message || ''), 'error');
    } finally {
      setBusy(false);
    }
  }

  function reprint(r) {
    printReceipt({
      device: r,
      archiveReason: r.archiveReason || '',
      buyerName: r.buyerName || '',
      buyerPhone: r.buyerPhone || '',
      imei: r.imei || '',
      archiveDate: r.archiveDate || '',
    });
  }

  const canUnarchive = (r) =>
    permissions?.isAdmin || (r.addedby === permissions?.display && permissions?.canArchive);

  if (error) {
    return <div className="py-20 text-center text-sm font-bold text-danger">❌ {error}</div>;
  }

  return (
    <div className="space-y-5 py-6">
      <div>
        <h1 className="text-2xl font-black text-accent">الأرشيف</h1>
        <p className="num mt-1 text-sm text-muted">{mine.length} جهاز مؤرشف</p>
      </div>

      {/* الفلاتر */}
      <div className="flex flex-wrap gap-2">
        <div className="min-w-[200px] flex-1">
          <Input placeholder="ابحث بالموديل · الكود · المشتري · الرقم · IMEI" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="rounded-xl border border-border bg-input px-3 py-2.5 text-sm text-text outline-none focus:border-accent"
        >
          <option value="">كل الأسباب</option>
          {reasons.map((rs) => <option key={rs} value={rs}>{rs}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : results.length === 0 ? (
        <div className="py-16 text-center">
          <div className="text-5xl opacity-40">📦</div>
          <p className="mt-3 text-sm font-bold text-muted">مفيش أجهزة مؤرشفة</p>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((r) => (
            <div key={r.sheetRow}
                 onClick={() => setDetail(r)}
                 className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4 cursor-pointer transition hover:border-accent-line">
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-border bg-surface text-xl">
                {brandIcon(getBrand(r), r.model)}
              </span>

              <div className="min-w-0 flex-1">
                <h3 className="truncate text-sm font-black text-text">
                  {r.model}
                  {r.code && <span className="num ms-1.5 text-[11px] text-muted">#{r.code}</span>}
                </h3>
                <p className="num text-xs text-muted">
                  {r.storage}
                  {r.archiveReason && <span className="ms-2 text-accent">· {r.archiveReason}</span>}
                </p>
                {r.buyerName && (
                  <p className="mt-0.5 text-[11px] text-muted">
                    المشتري: {r.buyerName}{r.buyerPhone ? ` · ${r.buyerPhone}` : ''}
                  </p>
                )}
                {r.archiveDate && (
                  <p className="num text-[11px] text-muted opacity-70">{r.archiveDate}</p>
                )}
              </div>

              <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => reprint(r)}
                  className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-[11px] font-bold text-muted transition hover:text-accent"
                >
                  🖨️ إيصال
                </button>
                {canUnarchive(r) && (
                  <button
                    type="button"
                    onClick={() => setUnarchiveTarget(r)}
                    className="rounded-lg border border-[var(--mtc-success)]/30 bg-[var(--mtc-success)]/12 px-2.5 py-1.5 text-[11px] font-bold text-[var(--mtc-success)] transition hover:bg-[var(--mtc-success)]/25"
                  >
                    ↩️ إرجاع
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* تفاصيل الجهاز المؤرشف الكاملة */}
      {detail && (
        <Suspense fallback={null}>
          <Modal
            open
            onClose={() => setDetail(null)}
            icon="📦"
            title={`${detail.model}${detail.code ? ' · #' + detail.code : ''}`}
            actions={
              <Button variant="plain" onClick={() => setDetail(null)}>إغلاق</Button>
            }
          >
            <div className="max-h-[58vh] space-y-3 overflow-y-auto text-start">
              {/* بيانات الأرشفة */}
              <div className="rounded-xl border border-accent-line bg-accent-soft p-3">
                <p className="mb-2 text-xs font-black text-accent">بيانات الأرشفة</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {ARCHIVE_FIELDS.map(([label, key]) =>
                    detail[key] && detail[key] !== '-' ? (
                      <div key={key}>
                        <dt className="text-[11px] text-muted">{label}</dt>
                        <dd className="num text-sm font-bold text-text break-words">{detail[key]}</dd>
                      </div>
                    ) : null
                  )}
                </dl>
              </div>

              {/* بيانات الجهاز */}
              <div className="rounded-xl border border-border bg-surface/40 p-3">
                <p className="mb-2 text-xs font-black text-muted">بيانات الجهاز</p>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                  {DEVICE_FIELDS.map(([label, key]) =>
                    detail[key] && detail[key] !== '-' ? (
                      <div key={key}>
                        <dt className="text-[11px] text-muted">{label}</dt>
                        <dd className="num text-sm font-bold text-text break-words">{detail[key]}</dd>
                      </div>
                    ) : null
                  )}
                </dl>
              </div>

              {/* الصور لو موجودة */}
              {detail.images?.length > 0 && (
                <p className="num text-[11px] text-muted">📷 {detail.images.length} صورة مرفقة</p>
              )}
            </div>
          </Modal>
        </Suspense>
      )}

      {/* تأكيد الإرجاع */}
      {unarchiveTarget && (
        <Suspense fallback={null}>
          <Modal
            open
            onClose={() => setUnarchiveTarget(null)}
            icon="↩️"
            title="إرجاع للقائمة"
            description={`هترجّع "${unarchiveTarget.model}" للمخزون؟ هيتشال من الأرشيف وتتمسح بيانات البيع.`}
            actions={
              <>
                <Button variant="plain" onClick={() => setUnarchiveTarget(null)} disabled={busy}>
                  إلغاء
                </Button>
                <Button loading={busy} onClick={() => doUnarchive(unarchiveTarget)}>
                  ↩️ إرجاع
                </Button>
              </>
            }
          />
        </Suspense>
      )}
    </div>
  );
}
