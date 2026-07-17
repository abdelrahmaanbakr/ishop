import { useToast } from '../context/ToastContext';

/* أيقونات مونوكروم (مسارات simple-icons) */
const I = {
  copy: 'M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z',
  whatsapp: 'M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  share: 'M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z',
};

function Icon({ path }) {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}

function Btn({ label, color, children, onClick, href }) {
  const cls =
    'grid size-11 place-items-center rounded-full border border-border bg-surface transition hover:scale-105';
  const style = color ? { color } : undefined;
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} title={label} className={cls} style={style}>
      {children}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cls} style={style}>
      {children}
    </button>
  );
}

/** شريط مشاركة الجهاز — الرابط نظيف بلا أي بيانات أسعار */
export default function ShareBar({ url, text }) {
  const { show } = useToast();
  const msg = `${text} ${url}`.trim();

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      show('🔗 اتنسخ الرابط');
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta);
      show('🔗 اتنسخ الرابط');
    }
  }

  // إنستجرام/تيك توك: مفيش رابط مشاركة ويب → قائمة مشاركة الهاتف الأصلية،
  // ولو مش متاحة (كمبيوتر) ننسخ الرابط.
  async function native() {
    if (navigator.share) {
      try { await navigator.share({ title: text, text, url }); return; } catch { /* أُلغيت */ return; }
    }
    copy();
    show('📱 المشاركة المباشرة مش متاحة هنا — اتنسخ الرابط، الصقه في التطبيق');
  }

  const wa = `https://wa.me/?text=${encodeURIComponent(msg)}`;
  const fb = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;

  return (
    <div className="rounded-2xl border border-border bg-card p-3">
      <p className="mb-2 text-xs font-bold text-muted">مشاركة الجهاز</p>
      <div className="flex flex-wrap items-center gap-2.5">
        <Btn label="نسخ الرابط" onClick={copy}><Icon path={I.copy} /></Btn>
        <Btn label="واتساب" href={wa} color="#25d366"><Icon path={I.whatsapp} /></Btn>
        <Btn label="فيسبوك" href={fb} color="#1877f2"><Icon path={I.facebook} /></Btn>
        <Btn label="مشاركة" onClick={native}><Icon path={I.share} /></Btn>
      </div>
    </div>
  );
}
