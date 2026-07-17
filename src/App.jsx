import { useEffect, useState, useRef, lazy, Suspense } from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider, useToast } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PricingProvider } from './context/PricingContext';
import { isRecoveryLink, exchangeRecoveryToken } from './lib/recovery';
import Splash from './components/Splash';
import Landing from './pages/Landing';
import GuestShell from './GuestShell';

// ══ كل حاجة ليها علاقة بالحسابات في chunks مؤجّلة ═══════════════
// الـ bundle اللي بيوصل للزائر مافيهوش أي أثر لوجود تسجيل دخول.
const Login = lazy(() => import('./pages/Login'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const StaffShell = lazy(() => import('./StaffShell'));

function AppShell() {
  const { isAuthed, isGuest, booting, enterGuest, _onIdleRef } = useAuth();
  const { show } = useToast();
  const location = useLocation();
  const [recovery, setRecovery] = useState(null);
  const [staffLogin, setStaffLogin] = useState(false);

  // لينك جهاز مشترك (/d/...) يفتحه زائر جديد → يدخل وضع الزائر مرة واحدة بعد
  // الإقلاع. مرة واحدة عشان الخروج/الرئيسية بعد كده ما يرجّعوش لوضع الزائر.
  const isDeviceLink = /^\/d\//.test(location.pathname);
  const autoGuestDone = useRef(false);
  useEffect(() => {
    if (booting || autoGuestDone.current) return;
    autoGuestDone.current = true;
    if (!isAuthed && !isGuest && /^\/d\//.test(window.location.pathname)) enterGuest();
  }, [booting, isAuthed, isGuest, enterGuest]);

  useEffect(() => {
    _onIdleRef.current = () => show('⏰ انتهت الجلسة', 'error');
  }, [show, _onIdleRef]);

  useEffect(() => {
    if (!isRecoveryLink()) { setRecovery(false); return; }
    exchangeRecoveryToken().then((ok) => {
      setRecovery(ok);
      if (!ok) show('❌ الرابط منتهي أو مستخدم قبل كده', 'error');
    });
  }, [show]);

  if (booting || recovery === null) return <Splash />;

  if (recovery) {
    return (
      <>
        <Splash />
        <Suspense fallback={null}>
          <ResetPassword open onDone={() => setRecovery(false)} />
        </Suspense>
      </>
    );
  }

  // ── الأصل: اللاندينج. الدخول طبقة سرّية فوقه ──
  if (!isAuthed && !isGuest) {
    // لينك جهاز مشترك: سبلاش لحين الدخول التلقائي (مرة واحدة). بعد الخروج اليدوي
    // يبقى autoGuestDone=true فنرجّع اللاندينج عادي.
    if (isDeviceLink && !autoGuestDone.current) return <Splash />;
    return (
      <>
        <Splash />
        <Landing onStaffLogin={() => setStaffLogin(true)} />
        {staffLogin && (
          <Suspense fallback={null}>
            <Login onBack={() => setStaffLogin(false)} />
          </Suspense>
        )}
      </>
    );
  }

  if (isGuest) {
    return (
      <>
        <Splash />
        <GuestShell />
      </>
    );
  }

  return (
    <>
      <Splash />
      <Suspense fallback={<Splash />}>
        <StaffShell />
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <PricingProvider>
              <AppShell />
            </PricingProvider>
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
