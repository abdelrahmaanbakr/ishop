import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemePanel';
import SiteFooter from './components/SiteFooter';
import Devices from './pages/Devices';
import DevicePage from './pages/DevicePage';

/**
 * شريط الزائر — ولا حاجة فيه بتلمّح إن في حسابات:
 * مفيش "زائر"، مفيش "خروج"، مفيش رقم إصدار.
 *
 * ملاحظة: logout() هنا معناها "اخرج من وضع الزائر وارجع للرئيسية"،
 * مش تسجيل خروج من حساب. الزائر أصلاً مالوش حساب.
 */
export default function GuestShell() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const home = () => { navigate('/', { replace: true }); logout(); };

  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between gap-2
                         border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur">
        {/* اللوجو = رجوع للرئيسية */}
        <button type="button" onClick={home} className="flex items-center gap-2" aria-label="الرئيسية">
          <span className="grid size-8 place-items-center rounded-lg border border-accent-line
                           bg-accent-soft text-sm">
            📱
          </span>
          <span className="text-lg font-black text-accent">
            i<span className="text-text">Shop</span>
          </span>
        </button>

        <div className="flex items-center gap-2">
          {/* زر رجوع صريح — مش كل الناس هتعرف إن اللوجو بيرجّع */}
          <button
            type="button"
            onClick={home}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-surface
                       px-3 py-2 text-xs font-bold text-muted transition
                       hover:border-accent-line hover:text-accent"
          >
            <span aria-hidden="true">‹</span>
            <span className="hidden sm:inline">الرئيسية</span>
            <span className="sm:hidden" aria-hidden="true">🏠</span>
          </button>

          <ThemeToggle />
        </div>
      </header>

      <main className="relative z-1 mx-auto max-w-5xl px-4">
        <Routes>
          <Route path="/devices" element={<Devices />} />
          <Route path="/d/:code" element={<DevicePage />} />
          <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>

        <SiteFooter />
      </main>

    </>
  );
}
