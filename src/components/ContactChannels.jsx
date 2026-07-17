import { useEffect, useState } from 'react';
import { useToast } from '../context/ToastContext';
import { fetchContactChannels } from '../lib/api';
import { updateContactChannel } from '../lib/adminApi';
import Button from './ui/Button';
import Input from './ui/Input';

/** قنوات الاتصال — الأدمن يعدّل أرقام واتساب الخدمات. */
export default function ContactChannels() {
  const { show } = useToast();
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // id قيد التعديل
  const [draft, setDraft] = useState({ whatsapp: '', is_active: true });

  async function load() {
    setLoading(true);
    try {
      setChannels(await fetchContactChannels());
    } catch (e) {
      show('❌ فشل التحميل: ' + (e.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function startEdit(ch) {
    setEditing(ch.id);
    setDraft({ whatsapp: ch.whatsapp || '', is_active: ch.is_active });
  }

  async function save(ch) {
    // تحقق بسيط من الرقم
    const wa = draft.whatsapp.trim().replace(/[^\d]/g, '');
    if (wa && wa.length < 10) {
      show('❗ رقم واتساب غير صحيح', 'error');
      return;
    }
    try {
      await updateContactChannel(ch.id, { whatsapp: wa, is_active: draft.is_active });
      show('✅ تم حفظ القناة');
      setEditing(null);
      load();
    } catch (e) {
      show('❌ ' + (e.message || ''), 'error');
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-black text-accent">قنوات الاتصال</h2>
        <p className="mt-1 text-xs text-muted">أرقام واتساب الخدمات اللي بيوصلها طلبات العملاء</p>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-surface" />
          ))}
        </div>
      ) : (
        <div className="space-y-2.5">
          {channels.map((ch) => (
            <div key={ch.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-text">{ch.label}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    ch.is_active
                      ? 'bg-[var(--mtc-success)]/12 text-[var(--mtc-success)]'
                      : 'bg-danger/10 text-danger'
                  }`}>
                    {ch.is_active ? 'مفعّلة' : 'معطّلة'}
                  </span>
                </div>
                {editing !== ch.id && (
                  <button type="button" onClick={() => startEdit(ch)}
                          className="rounded-lg border border-accent-line bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent transition hover:bg-accent hover:text-on-accent">
                    ✏️ تعديل
                  </button>
                )}
              </div>

              {editing === ch.id ? (
                <div className="mt-3 space-y-3">
                  <Input
                    label="رقم واتساب (بكود الدولة، بدون +)"
                    value={draft.whatsapp}
                    onChange={(e) => setDraft((d) => ({ ...d, whatsapp: e.target.value }))}
                    placeholder="201224822220"
                    inputMode="tel"
                  />
                  <label className="flex cursor-pointer items-center gap-2 text-sm text-text">
                    <input type="checkbox" checked={draft.is_active}
                           onChange={(e) => setDraft((d) => ({ ...d, is_active: e.target.checked }))}
                           className="size-4 accent-[var(--accent)]" />
                    القناة مفعّلة
                  </label>
                  <div className="flex gap-2">
                    <Button className="flex-1 py-2 text-sm" onClick={() => save(ch)}>حفظ</Button>
                    <Button variant="plain" className="py-2 text-sm" onClick={() => setEditing(null)}>إلغاء</Button>
                  </div>
                </div>
              ) : (
                <p className="num mt-2 text-sm text-muted">
                  📱 {ch.whatsapp || '— لم يُحدّد —'}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
