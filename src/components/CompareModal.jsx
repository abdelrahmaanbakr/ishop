import Modal from './ui/Modal';
import Button from './ui/Button';
import { batteryNum } from '../utils/format';

// utils.js:583 — نفس الحقول العشرة
const FIELDS = [
  ['الموديل','model'], ['الذاكرة','storage'], ['البطارية','battery'],
  ['اللون','color'], ['الشريحة','sim'], ['الكرتونة','box'],
  ['صيانة','repair'], ['الجمارك','tax'], ['الضمان','warrantyDisplay'], ['الشفرة','lock'],
];

/** البطارية بس هي اللي ليها "أحسن/أوحش" — utils.js:588 */
function verdict(a, b, field) {
  if (field !== 'battery') return '';
  const na = batteryNum(a), nb = batteryNum(b);
  return na > nb ? 'better' : na < nb ? 'worse' : '';
}

const TONE = {
  better: 'text-[var(--mtc-success)]',
  worse: 'text-danger',
  '': 'text-text',
};

function Column({ me, other }) {
  return (
    <div className="flex-1 space-y-1.5">
      <h4 className="truncate border-b border-border pb-2 text-sm font-black text-accent">
        {me.model}
      </h4>
      {FIELDS.map(([label, key]) => {
        const v = me[key] || '—';
        const cls = TONE[verdict(v, other[key] || '—', key)];
        return (
          <div key={key} className="flex flex-col">
            <span className="text-[10px] font-bold text-muted">{label}</span>
            <span className={`num text-xs font-bold ${cls}`}>{v}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function CompareModal({ open, pair, onClose }) {
  const [a, b] = pair;
  if (!a || !b) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="⚖️"
      title="مقارنة"
      actions={<Button variant="plain" onClick={onClose}>إغلاق</Button>}
    >
      <div className="flex gap-4 text-start">
        <Column me={a} other={b} />
        <div className="w-px bg-border" />
        <Column me={b} other={a} />
      </div>
    </Modal>
  );
}
