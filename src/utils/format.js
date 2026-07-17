// منقولة حرفيًا من data.js:161-183

export function formatPhone(val) {
  if (!val || val === '-') return '-';
  let s = String(val).trim().split('.')[0];
  if (!s.startsWith('0') && s.length === 10 && /^\d+$/.test(s)) s = '0' + s;
  return s;
}

/** 0.85 → 85% | 85 → 85% | "85%" → 85% */
export function formatBattery(val) {
  if (!val && val !== 0) return '-';
  const s = String(val).trim();
  if (s.includes('%')) return s;
  const n = parseFloat(s);
  if (isNaN(n)) return s || '-';
  return (n <= 1 && n > 0 ? Math.round(n * 100) : Math.round(n)) + '%';
}

export function formatDate(val) {
  if (!val) return '-';
  const s = String(val).trim();
  if (!s || s === '-') return '-';
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('ar-EG', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

/** الرقم الخام من "85%" — للفلترة والترتيب */
export function batteryNum(val) {
  return parseInt(val) || 0;
}

/** 12500 → "12,500 ج.م" */
export function formatPrice(val) {
  if (val == null || val === '') return '';
  const n = Number(val);
  if (isNaN(n)) return '';
  return n.toLocaleString('en-US') + ' ج.م';
}

/** ui.js:128 — رابط واتساب */
export function waLink(r) {
  const digits = String(r.phone || '').replace(/\D/g, '');
  if (digits.length < 10) return null;
  const full = digits.startsWith('2') ? digits : '2' + digits;
  const msg = encodeURIComponent(
    `مرحباً، أريد الاستفسار عن الجهاز:\n📱 ${r.model} ${r.storage}` +
      (r.code ? ` — كود #${r.code}` : '') +
      (r.color && r.color !== '-' ? ` — ${r.color}` : '') +
      (r.battery && r.battery !== '-' ? `\n🔋 البطارية: ${r.battery}` : '')
  );
  return `https://api.whatsapp.com/send?phone=${full}&text=${msg}`;
}
