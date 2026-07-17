import { getBrand, brandIcon } from '../lib/brands';
import { batteryNum } from '../utils/format';

const BAT_COLOR = (n) => (n >= 80 ? '#2ecc71' : n >= 60 ? '#f5c842' : '#e74c3c');

export default function DeviceTable({
  records, isGuest, compareMode, compareIds, onToggleCompare, onOpen,
}) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border">
      <table className="w-full text-start text-sm">
        <thead className="bg-surface">
          <tr className="text-[11px] font-black text-muted">
            {compareMode && <th className="p-2.5">⚖️</th>}
            <th className="p-2.5 text-start">الموديل</th>
            <th className="p-2.5 text-start">الذاكرة</th>
            <th className="p-2.5 text-start">البطارية</th>
            <th className="p-2.5 text-start">اللون</th>
            <th className="p-2.5 text-start">الضمان</th>
            {!isGuest && <th className="p-2.5 text-start">أضافه</th>}
            {!isGuest && <th className="p-2.5 text-start">التاريخ</th>}
          </tr>
        </thead>
        <tbody>
          {records.map((r) => {
            const n = batteryNum(r.battery);
            const picked = compareIds.includes(r.sheetRow);
            return (
              <tr
                key={r.sheetRow}
                onClick={() => (compareMode ? onToggleCompare(r.sheetRow) : onOpen(r))}
                className={`cursor-pointer border-t border-border transition
                            hover:bg-accent-soft ${picked ? 'bg-accent-soft' : ''}`}
              >
                {compareMode && (
                  <td className="p-2.5 text-center">
                    <input
                      type="checkbox"
                      checked={picked}
                      readOnly
                      className="size-4 accent-[var(--accent)]"
                    />
                  </td>
                )}
                <td className="p-2.5 font-bold text-text">
                  <span className="me-1.5">{brandIcon(getBrand(r), r.model)}</span>
                  {r.model}
                  {r.code && <span className="num ms-1.5 text-[10px] text-muted">#{r.code}</span>}
                </td>
                <td className="num p-2.5 text-muted">{r.storage}</td>
                <td className="num p-2.5 font-bold" style={{ color: n ? BAT_COLOR(n) : 'var(--muted)' }}>
                  {r.battery}
                </td>
                <td className="p-2.5 text-muted">{r.color}</td>
                <td className="p-2.5 text-muted">{r.warrantyDisplay}</td>
                {!isGuest && <td className="p-2.5 text-muted">{r.addedby}</td>}
                {!isGuest && <td className="num p-2.5 text-muted">{r.date}</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
