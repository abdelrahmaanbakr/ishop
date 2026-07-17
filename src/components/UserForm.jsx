import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { createUser, updateUserRow, setUserEmail, setDeletePass } from '../lib/adminApi';
import Button from './ui/Button';
import Input from './ui/Input';

const ROLES = [
  { v: 'entry', l: 'entry — إدخال' },
  { v: 'user', l: 'user — مستخدم' },
  { v: 'admin', l: 'admin — أدمن' },
];

const PERMS = [
  ['canEdit', 'تعديل الأجهزة'],
  ['canDelete', 'حذف الأجهزة'],
  ['canArchive', 'أرشفة الأجهزة'],
  ['reqDelPass', 'يطلب كلمة سر للحذف'],
  ['reqArchPass', 'يطلب كلمة سر للأرشفة'],
];

/**
 * فورم إنشاء/تعديل مستخدم.
 * إنشاء → Edge Function (create-user) بتعمله في الجدولين.
 * تعديل → PATCH على ishop_users + admin_set_user_email لو الإيميل اتغيّر.
 * الأدمن دايمًا صلاحياته كلها true (نفس الأصل).
 */
export default function UserForm({ user, onSaved, onCancel }) {
  const { show } = useToast();
  const isEdit = !!user;

  const [username, setUsername] = useState(user?.username ?? '');
  const [display, setDisplay] = useState(user?.display_name ?? '');
  const [role, setRole] = useState(user?.role ?? 'entry');
  const [phone, setPhone] = useState(user?.phone ?? '');

  // الباسورد — إنشاء بس (تعديل بيتم من Supabase)
  const [pass, setPass] = useState('');
  const [pass2, setPass2] = useState('');

  // الإيميل — مرتين للتأكيد
  const [email, setEmail] = useState(user?.email ?? '');
  const [email2, setEmail2] = useState('');
  const emailBefore = (user?.email ?? '').toLowerCase();

  // كلمة سر الحذف
  const [delpass, setDelpass] = useState('');

  const [perms, setPerms] = useState({
    canEdit: user?.can_edit !== false,
    canDelete: user?.can_delete !== false,
    canArchive: user?.can_archive !== false,
    reqDelPass: user?.req_del_pass !== false,
    reqArchPass: user?.req_arch_pass !== false,
  });

  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = role === 'admin';
  const togglePerm = (k) => setPerms((p) => ({ ...p, [k]: !p[k] }));

  async function save() {
    setErr('');
    const u = username.trim().toLowerCase();
    const d = display.trim();

    if (!u) return setErr('❗ اسم المستخدم مطلوب');
    if (!d) return setErr('❗ الاسم الكامل مطلوب');

    // الأدمن كل صلاحياته true (نفس الأصل)
    const finalPerms = isAdmin
      ? { canEdit: true, canDelete: true, canArchive: true, reqDelPass: true, reqArchPass: true }
      : perms;

    setBusy(true);
    try {
      if (!isEdit) {
        // ── إنشاء ──
        if (!/^[a-z0-9._-]{3,32}$/.test(u)) {
          setBusy(false);
          return setErr('❗ اسم المستخدم: إنجليزي وأرقام و . _ - فقط (3–32)');
        }
        if (pass.length < 8) { setBusy(false); return setErr('❗ كلمة السر: 8 أحرف على الأقل'); }
        if (pass !== pass2) { setBusy(false); return setErr('❗ كلمتا السر غير متطابقتين'); }

        const em = email.trim().toLowerCase();
        if (em) {
          if (em !== email2.trim().toLowerCase()) {
            setBusy(false);
            return setErr('❗ البريدان غير متطابقين');
          }
          if (/\.(local|test|invalid)$/.test(em)) {
            setBusy(false);
            return setErr('❗ لازم بريد حقيقي — الدومينات الوهمية مش هتستقبل رسالة الاستعادة');
          }
        }

        const res = await createUser({
          username: u,
          display_name: d,
          role,
          password: pass,
          email: em || undefined,
          phone: phone.trim() || undefined,
          can_edit: finalPerms.canEdit,
          can_delete: finalPerms.canDelete,
          can_archive: finalPerms.canArchive,
          req_del_pass: finalPerms.reqDelPass,
          req_arch_pass: finalPerms.reqArchPass,
        });

        // كلمة سر الحذف (لو اتكتبت) — بالـ id الراجع من الإنشاء
        if (delpass.trim() && res?.user?.id) {
          await setDeletePass(res.user.id, delpass.trim());
        }

        show('✅ تم إنشاء المستخدم');
      } else {
        // ── تعديل ──
        await updateUserRow(user.id, {
          role,
          display_name: d,
          phone: phone.trim() || null,
          can_edit: finalPerms.canEdit,
          can_delete: finalPerms.canDelete,
          can_archive: finalPerms.canArchive,
          req_del_pass: finalPerms.reqDelPass,
          req_arch_pass: finalPerms.reqArchPass,
        });

        // الإيميل لو اتغيّر
        const em = email.trim().toLowerCase();
        if (em !== emailBefore) {
          if (!em) { setBusy(false); return setErr('❗ البريد مطلوب'); }
          if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(em)) {
            setBusy(false); return setErr('❗ صيغة البريد غير صحيحة');
          }
          if (em !== email2.trim().toLowerCase()) {
            setBusy(false); return setErr('❗ البريدان غير متطابقين');
          }
          if (/\.(local|test|invalid)$/.test(em)) {
            setBusy(false); return setErr('❗ لازم بريد حقيقي');
          }
          await setUserEmail(user.id, em);
        }

        // كلمة سر الحذف لو اتكتبت
        if (delpass.trim()) {
          await setDeletePass(user.id, delpass.trim());
        }

        show('✅ تم حفظ التعديلات');
      }

      onSaved();
    } catch (e) {
      setErr('❌ ' + (e.message || 'حصل خطأ'));
    } finally {
      setBusy(false);
    }
  }

  const sel =
    'w-full rounded-xl border border-border bg-input px-3.5 py-2.5 text-sm text-text outline-none focus:border-accent';

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="اسم المستخدم *" value={username}
               onChange={(e) => setUsername(e.target.value)} disabled={isEdit} />
        <Input label="الاسم الكامل *" value={display} onChange={(e) => setDisplay(e.target.value)} />
      </div>

      <div className="flex w-full flex-col gap-1.5">
        <label className="text-xs font-bold text-muted">الدور</label>
        <select className={sel} value={role} onChange={(e) => setRole(e.target.value)}>
          {ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}
        </select>
      </div>

      <Input label="الهاتف" value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="tel" />

      {/* الباسورد — إنشاء بس */}
      {!isEdit ? (
        <div className="grid grid-cols-2 gap-3">
          <Input label="كلمة السر *" type="password" value={pass}
                 onChange={(e) => setPass(e.target.value)} autoComplete="new-password" />
          <Input label="تأكيد كلمة السر *" type="password" value={pass2}
                 onChange={(e) => setPass2(e.target.value)} autoComplete="new-password" />
        </div>
      ) : (
        <div className="rounded-xl bg-surface/50 px-3 py-2 text-[11px] text-muted">
          🔑 كلمة سر الدخول تُدار من Supabase — مش بتتغيّر من هنا
        </div>
      )}

      {/* الإيميل — مرتين */}
      <div className="grid grid-cols-2 gap-3">
        <Input label="البريد (للاستعادة)" type="email" value={email}
               onChange={(e) => setEmail(e.target.value)} placeholder="اختياري" />
        <Input label="تأكيد البريد" type="email" value={email2}
               onChange={(e) => setEmail2(e.target.value)} placeholder="أعد كتابته" />
      </div>

      {/* كلمة سر الحذف */}
      <Input label="كلمة سر الحذف/الأرشفة" type="password" value={delpass}
             onChange={(e) => setDelpass(e.target.value)}
             placeholder={isEdit ? 'سيبها فاضية عشان ما تتغيّرش' : 'اختياري'} />

      {/* الصلاحيات */}
      {!isAdmin && (
        <div className="rounded-2xl border border-border bg-surface/50 p-3">
          <p className="mb-2 text-xs font-bold text-muted">الصلاحيات</p>
          <div className="space-y-2">
            {PERMS.map(([k, label]) => (
              <label key={k} className="flex cursor-pointer items-center gap-2 text-sm text-text">
                <input type="checkbox" checked={perms[k]} onChange={() => togglePerm(k)}
                       className="size-4 accent-[var(--accent)]" />
                {label}
              </label>
            ))}
          </div>
        </div>
      )}
      {isAdmin && (
        <div className="rounded-xl bg-accent-soft px-3 py-2 text-[11px] font-bold text-accent">
          👑 الأدمن عنده كل الصلاحيات تلقائيًا
        </div>
      )}

      {err && (
        <p className="whitespace-pre-line rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
          {err}
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button className="flex-1" loading={busy} onClick={save}>
          {busy ? 'جاري الحفظ...' : isEdit ? 'حفظ التعديلات' : '➕ إنشاء المستخدم'}
        </Button>
        <Button variant="plain" onClick={onCancel} disabled={busy}>إلغاء</Button>
      </div>
    </div>
  );
}
