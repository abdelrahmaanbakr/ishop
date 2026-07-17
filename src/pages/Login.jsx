import { useState } from 'react';
import { useAuth, maskEmail } from '../context/AuthContext';
import { loginEmail } from '../lib/api';
import { supabase, isProdOrigin, PROD_ORIGIN } from '../lib/supabase';
import { ThemeToggle } from '../components/ThemePanel';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { APP_VERSION } from '../lib/constants';

// ترجمة أكواد الأخطاء — عايشة هنا عشان النصوص دي تفضل بره
// الـ bundle الأساسي اللي بيوصل للزائر
const ERRORS = {
  EMPTY:    () => '❗ أدخل اسم المستخدم وكلمة المرور',
  WAIT:     (r) => `🔒 محاولات كثيرة — انتظر ${r.seconds} ثانية`,
  LOCKED:   () => '🔒 تم حظر الدخول مؤقتاً — حاول بعد 60 ثانية',
  BAD:      (r) => `❌ اسم المستخدم أو كلمة المرور غلط (${r.attempt}/${r.max})`,
  INACTIVE: () => '❌ الحساب غير مفعّل',
  NET:      () => '❌ تعذر الاتصال — تحقق من الإنترنت',
};

// ══ دخول الموظفين — بيتفتح بـ 5 ضغطات على اللوجو ══════════════
function LoginView({ onForgot }) {
  const { login, rememberedUser } = useAuth();
  const [user, setUser] = useState(rememberedUser);
  const [pass, setPass] = useState('');
  const [remember, setRemember] = useState(!!rememberedUser);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setErr('');
    const res = await login(user, pass, remember);
    if (res.code) {
      setErr(ERRORS[res.code]?.(res) ?? '❌ حصل خطأ');
      setPass(''); // نفس سلوك _failLogin
    }
    setBusy(false);
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center">
        <span className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl border border-accent-line bg-accent-soft text-2xl">
          🔐
        </span>
        <h1 className="text-2xl font-black text-accent">دخول الموظفين</h1>
        <p className="mt-1 text-xs text-muted">مخصص لفريق MTC Group</p>
      </div>

      <div className="space-y-3.5 rounded-3xl border border-border bg-card p-6">
        <Input
          label="اسم المستخدم"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoComplete="username"
        />
        <Input
          label="كلمة المرور"
          type="password"
          value={pass}
          onChange={(e) => setPass(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoComplete="current-password"
        />

        <label className="flex cursor-pointer items-center gap-2 text-xs font-bold text-muted">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            className="size-4 accent-[var(--accent)]"
          />
          تذكرني
        </label>

        {err && (
          <p className="whitespace-pre-line rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
            {err}
          </p>
        )}

        <Button className="w-full" loading={busy} onClick={submit}>
          {busy ? 'جاري التحقق...' : 'دخول'}
        </Button>

        <button
          type="button"
          onClick={onForgot}
          className="w-full text-xs font-bold text-muted transition hover:text-accent"
        >
          نسيت كلمة السر؟
        </button>
      </div>

      <p className="num text-center text-[11px] text-muted">{APP_VERSION}</p>
    </div>
  );
}

// ══ نسيت كلمة السر ════════════════════════════════════════════
function ForgotView({ onBack, initialUser }) {
  const [user, setUser] = useState(initialUser || '');
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    const u = String(user || '').trim().toLowerCase();
    setErr(''); setOk('');

    // Supabase بيقبل الرجوع للدومين النهائي بس — على نسخة التجربة
    // الرابط هيتبعت وما يشتغلش، فبنمنع الإرسال بدل ما نلخبط المستخدم.
    if (!isProdOrigin()) {
      return setErr(
        'ℹ️ إعادة تعيين كلمة السر بتشتغل على الموقع الرسمي بس.\n' +
        'إحنا دلوقتي على نسخة تجربة — استخدم ' + PROD_ORIGIN
      );
    }

    if (!u) return setErr('❗ اكتب اسم المستخدم');
    if (u.includes('@')) {
      return setErr('❗ ده بريد إلكتروني — اكتب اسم المستخدم اللي بتسجّل بيه دخول');
    }

    setBusy(true);
    try {
      const email = await loginEmail(u);
      if (!email) {
        setErr('❌ اسم المستخدم ده مش موجود أو الحساب موقوف');
        return;
      }
      if (String(email).endsWith('@ishop.local')) {
        setErr('⚠️ الحساب ده مالوش بريد استعادة. كلّم الأدمن يضيفه.');
        return;
      }

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (error) {
        setErr('❌ فشل الإرسال: ' + (error.message || 'خطأ في السيرفر'));
        return;
      }

      setOk(maskEmail(email));
    } catch (e) {
      setErr('❌ تعذر الإرسال: ' + (e.message || 'تحقق من الإنترنت'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="w-full max-w-sm space-y-5">
      <div className="text-center">
        <h1 className="text-2xl font-black text-accent">استعادة كلمة السر</h1>
        <p className="mt-1 text-xs text-muted">هنبعتلك رابط على بريد الاستعادة</p>
      </div>

      <div className="space-y-3.5 rounded-3xl border border-border bg-card p-6">
        <Input
          label="اسم المستخدم"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="مثال: 48222200"
        />

        {err && (
          <p className="whitespace-pre-line rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
            {err}
          </p>
        )}
        {ok && (
          <div className="rounded-xl bg-[var(--mtc-success)]/10 px-3 py-2.5 text-center text-xs font-bold text-[var(--mtc-success)]">
            ✅ بعتنا رابط استعادة على
            <br />
            <b className="num">{ok}</b>
            <br />
            <span className="opacity-70">شوف الـ Spam لو مالقتهوش</span>
          </div>
        )}

        <Button className="w-full" loading={busy} onClick={send}>
          {busy ? 'جاري الإرسال...' : '📧 إرسال رابط الاستعادة'}
        </Button>

        <button
          type="button"
          onClick={onBack}
          className="w-full text-xs font-bold text-muted transition hover:text-accent"
        >
          ← رجوع لتسجيل الدخول
        </button>
      </div>
    </div>
  );
}

export default function Login({ onBack }) {
  const [view, setView] = useState('main');
  const [carry, setCarry] = useState('');
  const { rememberedUser } = useAuth();

  return (
    <div className="fixed inset-0 z-[9980] overflow-y-auto bg-bg">
      <ThemeToggle fixed />

      <button
        type="button"
        onClick={onBack}
        className="fixed top-4 end-4 z-10 grid size-10 place-items-center rounded-full border border-border bg-card text-lg text-muted transition hover:text-accent"
        aria-label="رجوع"
      >
        ✕
      </button>

      <div className="flex min-h-screen items-center justify-center p-6">
        {view === 'main' ? (
          <LoginView
            onForgot={() => {
              setCarry(rememberedUser);
              setView('forgot');
            }}
          />
        ) : (
          <ForgotView initialUser={carry} onBack={() => setView('main')} />
        )}
      </div>
    </div>
  );
}
