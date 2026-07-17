import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { fetchUsers } from '../lib/api';
import { updateUserRow } from '../lib/adminApi';
import UserForm from '../components/UserForm';
import ContactChannels from '../components/ContactChannels';
import Pricing from '../components/Pricing';
import Button from '../components/ui/Button';

const ROLE_LABEL = { admin: '👑 أدمن', entry: '📝 إدخال', user: '👤 مستخدم' };
const ROLE_TONE = {
  admin: 'bg-accent-soft text-accent border-accent-line',
  entry: 'bg-[var(--mtc-info)]/12 text-[var(--mtc-info)] border-[var(--mtc-info)]/30',
  user: 'bg-surface text-muted border-border',
};

export default function Admin() {
  const { permissions, username: myUsername } = useAuth();
  const { show } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list'); // list | create | edit
  const [editUser, setEditUser] = useState(null);
  const [tab, setTab] = useState('users'); // users | channels

  async function load() {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } catch (e) {
      show('❌ فشل تحميل المستخدمين: ' + (e.message || ''), 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function toggleActive(u) {
    // مايقدرش يعطّل نفسه
    if (u.username === myUsername) {
      show('❗ مش هتقدر تعطّل حسابك', 'error');
      return;
    }
    try {
      await updateUserRow(u.id, { is_active: !u.is_active });
      show(u.is_active ? '⏸️ تم تعطيل الحساب' : '✅ تم تفعيل الحساب');
      load();
    } catch (e) {
      show('❌ ' + (e.message || ''), 'error');
    }
  }

  function onSaved() {
    setView('list');
    setEditUser(null);
    load();
  }

  if (view === 'create' || view === 'edit') {
    return (
      <div className="mx-auto max-w-2xl py-6">
        <div className="mb-5 flex items-center gap-3">
          <button type="button" onClick={() => { setView('list'); setEditUser(null); }}
                  className="text-sm font-bold text-muted transition hover:text-accent">
            ‹ رجوع
          </button>
          <h1 className="text-xl font-black text-accent">
            {view === 'create' ? '➕ مستخدم جديد' : `✏️ تعديل: ${editUser?.display_name}`}
          </h1>
        </div>
        <div className="rounded-3xl border border-border bg-card p-6">
          <UserForm
            user={view === 'edit' ? editUser : null}
            onSaved={onSaved}
            onCancel={() => { setView('list'); setEditUser(null); }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 py-6">
      {/* شريط التبويبات */}
      <div className="flex gap-2 border-b border-border">
        <button type="button" onClick={() => setTab('users')}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold transition ${
                  tab === 'users' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
                }`}>
          👥 المستخدمين
        </button>
        <button type="button" onClick={() => setTab('channels')}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold transition ${
                  tab === 'channels' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
                }`}>
          📞 قنوات الاتصال
        </button>
        <button type="button" onClick={() => setTab('prices')}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-bold transition ${
                  tab === 'prices' ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
                }`}>
          💲 الأسعار
        </button>
      </div>

      {tab === 'channels' ? (
        <ContactChannels />
      ) : tab === 'prices' ? (
        <Pricing />
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black text-accent">إدارة المستخدمين</h1>
              <p className="num mt-1 text-sm text-muted">{users.length} مستخدم</p>
            </div>
            <Button onClick={() => setView('create')}>➕ مستخدم جديد</Button>
          </div>

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-2xl bg-surface" />
              ))}
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((u) => (
            <div key={u.id}
                 className={`flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4 ${
                   u.is_active ? 'border-border' : 'border-danger/30 opacity-60'
                 }`}>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-sm font-black text-on-accent">
                {u.display_name?.charAt(0)?.toUpperCase() ?? '؟'}
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-black text-text">{u.display_name}</h3>
                  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${ROLE_TONE[u.role]}`}>
                    {ROLE_LABEL[u.role]}
                  </span>
                  {u.username === myUsername && (
                    <span className="text-[10px] font-bold text-muted">(أنت)</span>
                  )}
                </div>
                <p className="num text-xs text-muted">
                  {u.username}{u.email ? ` · ${u.email}` : ''}
                </p>
              </div>

              <div className="flex gap-1.5">
                <button type="button"
                        onClick={() => { setEditUser(u); setView('edit'); }}
                        className="rounded-lg border border-accent-line bg-accent-soft px-2.5 py-1.5 text-[11px] font-bold text-accent transition hover:bg-accent hover:text-on-accent">
                  ✏️ تعديل
                </button>
                {u.username !== myUsername && (
                  <button type="button"
                          onClick={() => toggleActive(u)}
                          className={`rounded-lg border px-2.5 py-1.5 text-[11px] font-bold transition ${
                            u.is_active
                              ? 'border-danger/25 bg-danger/10 text-danger hover:bg-danger/25'
                              : 'border-[var(--mtc-success)]/30 bg-[var(--mtc-success)]/12 text-[var(--mtc-success)]'
                          }`}>
                    {u.is_active ? '⏸️ تعطيل' : '✅ تفعيل'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}
