import Modal from './ui/Modal';
import Button from './ui/Button';
import { useToast } from '../context/ToastContext';

/** utils.js:631 — q و brand بس هما اللي بيتشاركوا */
export function buildShareUrl({ q, brand }) {
  const p = new URLSearchParams();
  if (q) p.set('q', q);
  if (brand) p.set('brand', brand);
  const qs = p.toString();
  return location.href.split('?')[0] + (qs ? '?' + qs : '');
}

export default function ShareModal({ open, url, onClose }) {
  const { show } = useToast();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      show('✅ تم نسخ الرابط');
    } catch {
      show('❌ المتصفح رفض النسخ', 'error');
    }
  }

  const wa = 'https://wa.me/?text=' + encodeURIComponent('📱 iShop — نتائج البحث:\n' + url);

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon="🔗"
      title="مشاركة النتائج"
      description="الرابط بيفتح نفس البحث والفلتر"
      actions={<Button variant="plain" onClick={onClose}>إغلاق</Button>}
    >
      <div className="space-y-3">
        <input
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="w-full rounded-xl border border-border bg-input px-3 py-2.5
                     text-center text-xs text-text outline-none"
        />
        <div className="flex gap-2">
          <Button className="flex-1" onClick={copy}>📋 نسخ</Button>
          <a
            href={wa}
            target="_blank"
            rel="noreferrer"
            className="flex flex-1 items-center justify-center gap-2 rounded-xl
                       border border-[#25d366]/25 bg-[#25d366]/12 px-4 py-2.5
                       text-sm font-bold text-[#25d366] transition hover:bg-[#25d366]/25"
          >
            💬 واتساب
          </a>
        </div>
      </div>
    </Modal>
  );
}
