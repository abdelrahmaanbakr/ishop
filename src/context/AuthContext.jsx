import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../lib/supabase';
import { fetchMyUserRow, loginEmail, hasDeletePass } from '../lib/api';
import { IDLE_MINUTES } from '../lib/constants';

/**
 * منقولة حرفيًا من auth.js — كل قاعدة هنا اتأكدت من الكود الأصلي.
 *
 * ⚠️ دلالة الصلاحيات: الكود الأصلي بيستخدم `!== false`، يعني null = مسموح.
 *    `=== true` كانت هتقلب أي عمود null من "مسموح" لـ "ممنوع".
 */

const AuthContext = createContext(null);

const MAX_ATTEMPTS = 5;      // auth.js:275
const LOCK_MS = 60_000;      // auth.js:277
const LS = { remember: 'ishop-remember', lastUser: 'ishop-last-user' };

/** auth.js:610 — أول حرف + نجوم + الدومين */
export function maskEmail(email) {
  const parts = String(email).split('@');
  if (parts.length !== 2) return '***';
  const name = parts[0];
  return name.slice(0, 1) + '*'.repeat(Math.max(2, name.length - 1)) + '@' + parts[1];
}

/** auth.js:337-348 — دلالة `!== false` */
function derivePermissions(row) {
  if (!row) return null;
  return {
    role: row.role,
    isAdmin: row.role === 'admin',
    display: row.display_name,
    canEdit:     row.can_edit      !== false,
    canDelete:   row.can_delete    !== false,
    canArchive:  row.can_archive   !== false,
    reqDelPass:  row.req_del_pass  !== false,
    reqArchPass: row.req_arch_pass !== false,
  };
}

export function AuthProvider({ children }) {
  const [userRow, setUserRow] = useState(null);
  const [username, setUsername] = useState('');
  const [isGuest, setIsGuest] = useState(false);
  const [hasDelPass, setHasDelPass] = useState(false);
  const [booting, setBooting] = useState(true);

  const [attempts, setAttempts] = useState(0);
  const lockUntil = useRef(0);
  const idleTimer = useRef(null);

  const isAuthed = !!userRow;

  // ══ استعادة الجلسة — auth.js:555-590 ══════════════════════════
  // القاعدة: لو "تذكرني" مش مفعّلة، الجلسة تتقفل حتى لو Supabase شايلها.
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const session = data?.session ?? null;
        if (!alive) return;
        if (!session) { setBooting(false); return; }

        if (localStorage.getItem(LS.remember) !== '1') {
          await supabase.auth.signOut();
          if (alive) setBooting(false);
          return;
        }

        const row = await fetchMyUserRow(session.user.id);
        if (!alive) return;
        if (!row) {
          await supabase.auth.signOut();
          setBooting(false);
          return;
        }

        setHasDelPass(!!(await hasDeletePass()));
        if (!alive) return;
        setUserRow(row);
        setUsername(row.username);
      } catch {
        /* فشل الاستعادة → شاشة الدخول */
      } finally {
        if (alive) setBooting(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // ══ تسجيل الدخول — auth.js:246-335 ════════════════════════════
  const login = useCallback(async (rawUser, rawPass, remember) => {
    const user = String(rawUser || '').trim().toLowerCase();
    const pass = String(rawPass || '').trim();

    // أكواد مش نصوص — الترجمة العربية عايشة في chunk الدخول المؤجّل،
    // عشان الـ bundle اللي بيوصل للزائر ما يبقاش فيه ولا كلمة عن الدخول.
    if (!user || !pass) return { code: 'EMPTY' };

    // قفل بعد 5 محاولات لمدة 60 ثانية
    const left = Math.ceil((lockUntil.current - Date.now()) / 1000);
    if (left > 0) return { code: 'WAIT', seconds: left };

    const fail = () => {
      const n = attempts + 1;
      setAttempts(n);
      if (n >= MAX_ATTEMPTS) {
        lockUntil.current = Date.now() + LOCK_MS;
        setAttempts(0);
        return { code: 'LOCKED' };
      }
      return { code: 'BAD', attempt: n, max: MAX_ATTEMPTS };
    };

    try {
      // 1) المُعرّف → إيميل (على السيرفر)
      const email = await loginEmail(user);
      if (!email) return fail();

      // 2) التحقق من كلمة السر على سيرفر Supabase
      const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error || !data?.session) return fail();

      // 3) صف المستخدم (RLS بتسمح بصفّه هو بس)
      const row = await fetchMyUserRow(data.user.id);
      if (!row) {
        await supabase.auth.signOut();
        return { code: 'INACTIVE' };
      }

      setAttempts(0);
      setHasDelPass(!!(await hasDeletePass()));

      // تذكرني
      localStorage.setItem(LS.remember, remember ? '1' : '0');
      if (remember) localStorage.setItem(LS.lastUser, user);
      else localStorage.removeItem(LS.lastUser);

      setUserRow(row);
      setUsername(row.username);
      return { ok: true };
    } catch {
      return { code: 'NET' };
    }
  }, [attempts]);

  // ══ الزائر — auth.js:423 ══════════════════════════════════════
  // بيقفل أي جلسة قديمة الأول
  const enterGuest = useCallback(async () => {
    try { await supabase.auth.signOut(); } catch { /* مفيش جلسة */ }
    setHasDelPass(false);
    setUserRow(null);
    setIsGuest(true);
  }, []);

  // ══ الخروج — auth.js:446 ══════════════════════════════════════
  const logout = useCallback(async () => {
    clearTimeout(idleTimer.current);
    try { await supabase.auth.signOut(); } catch { /* تجاهل */ }
    setUserRow(null);
    setUsername('');
    setIsGuest(false);
    setHasDelPass(false);
  }, []);

  // ══ قفل الخمول — auth.js:230-239 ══════════════════════════════
  // 20 دقيقة. الزائر مستثنى.
  const onIdle = useRef(null);
  useEffect(() => {
    if (!isAuthed) return;

    const reset = () => {
      clearTimeout(idleTimer.current);
      idleTimer.current = setTimeout(() => {
        onIdle.current?.();          // تنبيه
        setTimeout(logout, 1500);    // نفس التأخير الأصلي
      }, IDLE_MINUTES * 60 * 1000);
    };

    const events = ['click', 'keydown', 'touchstart', 'mousemove'];
    events.forEach((e) => document.addEventListener(e, reset, { passive: true }));
    reset();

    return () => {
      clearTimeout(idleTimer.current);
      events.forEach((e) => document.removeEventListener(e, reset));
    };
  }, [isAuthed, logout]);

  const permissions = useMemo(() => derivePermissions(userRow), [userRow]);

  const value = {
    userRow, username, permissions, isGuest, isAuthed, booting, hasDelPass,
    login, logout, enterGuest,
    rememberedUser: (() => {
      try {
        return localStorage.getItem(LS.remember) === '1'
          ? localStorage.getItem(LS.lastUser) || ''
          : '';
      } catch { return ''; }
    })(),
    _onIdleRef: onIdle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth لازم يتنادى جوّه AuthProvider');
  return ctx;
}
