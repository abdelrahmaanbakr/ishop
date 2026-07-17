import BatteryRing from './BatteryRing';
import Badge from './ui/Badge';
import { brandIcon, getBrand } from '../lib/brands';
import { deviceImageUrl } from '../lib/api';
import { waLink, formatPrice } from '../utils/format';
import { canEditRecord, canDeleteRecord } from '../lib/permissions';
import { usePricing } from '../context/PricingContext';
import { computePriceView } from '../lib/priceView';

export default function DeviceCard({
  record: r, permissions, isGuest, onOpen, onEdit, onDelete, onArchive,
  compareMode = false, picked = false, onToggleCompare,
}) {
  const img = r.images?.[0] ? deviceImageUrl(r.images[0]) : null;
  const wa = waLink(r);
  const { defaultPolicy, activePolicies, unlockedByDevice } = usePricing();
  const { applied, defaultPrice } = computePriceView({
    record: r,
    isAdmin: !!permissions?.isAdmin,
    defaultPolicy,
    activePolicies,
    unlockedByDevice,
  });
  const showEdit = !isGuest && canEditRecord(r, permissions);
  const showDelete = !isGuest && canDeleteRecord(r, permissions);
  const showArchive = !isGuest && permissions &&
    (permissions.isAdmin || (r.addedby === permissions.display && permissions.canArchive));

  return (
    <article
      className={`group flex cursor-pointer flex-col overflow-hidden rounded-2xl border
                  bg-card transition hover:border-accent-line
                  ${picked ? 'border-accent ring-2 ring-[var(--focus-ring)]' : 'border-border'}`}
      onClick={() => (compareMode ? onToggleCompare(r.sheetRow) : onOpen(r))}
    >
      <div className="relative aspect-3/4 overflow-hidden bg-surface">
        {img ? (
          <img
            src={img}
            alt={r.model}
            loading="lazy"
            className="size-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-5xl opacity-40">
            {brandIcon(getBrand(r), r.model)}
          </div>
        )}

        {r.images?.length > 1 && (
          <span className="num absolute top-2 end-2 rounded-full bg-black/60 px-2 py-0.5
                           text-[10px] font-bold text-white">
            {r.images.length} 📷
          </span>
        )}

        {r.code && !compareMode && (
          <span className="num absolute top-2 start-2 rounded-full bg-accent px-2 py-0.5
                           text-[10px] font-black text-on-accent">
            #{r.code}
          </span>
        )}

        {compareMode && (
          <span className={`absolute top-2 start-2 grid size-6 place-items-center rounded-full
                            text-xs font-black
                            ${picked ? 'bg-accent text-on-accent' : 'bg-black/60 text-white'}`}>
            {picked ? '✓' : ''}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-black text-text">{r.model}</h3>
            <p className="num text-xs text-muted">{r.storage}</p>
          </div>
          <BatteryRing value={r.battery} />
        </div>

        {applied.map((row, i) => (
          <p key={i} className="num text-base font-black text-[var(--mtc-success)]">
            {row.name}: {formatPrice(row.price)}
          </p>
        ))}
        {defaultPrice != null && (applied.length > 0 ? (
          <p className="num text-xs font-bold text-muted line-through">{formatPrice(defaultPrice)}</p>
        ) : (
          <p className="num text-sm font-black text-accent">{formatPrice(defaultPrice)}</p>
        ))}

        <div className="flex flex-wrap gap-1">
          {r.color !== '-' && <Badge tone="muted">{r.color}</Badge>}
          {r.warranty === 'ساري' && <Badge tone="ok">ضمان</Badge>}
          {r.repair !== '-' && r.repair !== 'لا' && <Badge tone="warn">صيانة</Badge>}
          {r.lock === 'مشفر على شبكة' && <Badge tone="danger">🔒 مشفر</Badge>}
          {r.lock === 'غير مشفر على اي شبكة' && <Badge tone="ok">🔓 حر</Badge>}
        </div>

        {!isGuest && (
          <p className="mt-auto text-[11px] text-muted">
            {r.addedby} · <span className="num">{r.date}</span>
          </p>
        )}

        {(() => {
          const btn = 'flex w-full items-center justify-center gap-1 rounded-lg border px-2 py-1.5 text-[11px] font-bold transition';
          const actions = [];
          if (wa) actions.push(
            <a key="wa" href={wa} target="_blank" rel="noreferrer"
               className={`${btn} border-[#25d366]/25 bg-[#25d366]/12 text-[#25d366] hover:bg-[#25d366]/25`}>
              💬 واتساب
            </a>
          );
          if (r.phone && r.phone !== '-') actions.push(
            <a key="call" href={`tel:${r.phone}`}
               className={`${btn} border-accent-line bg-accent-soft text-accent hover:bg-accent hover:text-on-accent`}>
              📞 اتصال
            </a>
          );
          if (showEdit) actions.push(
            <button key="edit" type="button" onClick={() => onEdit?.(r)}
                    className={`${btn} border-accent-line bg-accent-soft text-accent hover:bg-accent hover:text-on-accent`}>
              ✏️ تعديل
            </button>
          );
          if (showDelete) actions.push(
            <button key="del" type="button" onClick={() => onDelete?.(r)}
                    className={`${btn} border-danger/25 bg-danger/10 text-danger hover:bg-danger/25`}>
              🗑️ حذف
            </button>
          );
          if (showArchive) actions.push(
            <button key="arch" type="button" onClick={() => onArchive?.(r)}
                    className={`${btn} border-[var(--mtc-warning)]/30 bg-[var(--mtc-warning)]/12 text-[var(--mtc-warning)] hover:bg-[var(--mtc-warning)]/25`}>
              📦 أرشفة
            </button>
          );
          if (!actions.length) return null;
          const odd = actions.length % 2 === 1;
          return (
            <div className="grid grid-cols-2 gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
              {actions.map((el, i) => (
                <div key={el.key} className={odd && i === actions.length - 1 ? 'col-span-2' : ''}>
                  {el}
                </div>
              ))}
            </div>
          );
        })()}
      </div>
    </article>
  );
}
