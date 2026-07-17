import { Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { ThemeToggle } from './components/ThemePanel';
import Button from './components/ui/Button';
import Devices from './pages/Devices';
import DevicePage from './pages/DevicePage';
import Placeholder from './pages/Placeholder';
import Entry from './pages/Entry';
import Archive from './pages/Archive';
import Admin from './pages/Admin';
import { APP_VERSION } from './lib/constants';

/**
 * كل واجهة الموظفين في chunk منفصل — ما بيتحمّلش غير بعد الدخول.
 * يعني الـ bundle اللي بيوصل للزائر مافيهوش ولا كلمة عن الأدمن أو
 * الخروج أو الصلاحيات. الزائر عمره ما هيحمّل الملف ده أصلاً.
 */
export default function StaffShell() {
  const { permissions, logout } = useAuth();

  const link = ({ isActive }) =>
    `rounded-xl px-3 py-2 text-sm font-bold transition ${
      isActive ? 'bg-accent text-on-accent' : 'text-muted hover:text-accent'
    }`;

  const initial = permissions?.display?.charAt(0)?.toUpperCase() ?? '؟';

  return (
    <>
      <header className="relative z-10 border-b border-border bg-card">
        {/* الصف العلوي: الهوية + الأزرار */}
        <div className="flex items-center justify-between gap-2 px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1">
            <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent text-[11px] font-black text-on-accent">
              {initial}
            </span>
            <span className="truncate text-xs font-bold text-text">{permissions?.display}</span>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            <span className="num text-[10px] text-muted">{APP_VERSION}</span>
            <ThemeToggle />
            <Button variant="plain" className="px-2.5 py-1.5 text-xs" onClick={logout}>
              خروج
            </Button>
          </div>
        </div>

        {/* الصف السفلي: التبويبات — قابلة للتمرير أفقيًا على الموبايل */}
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <NavLink to="/devices" className={link}>الأجهزة</NavLink>
          <NavLink to="/entry" className={link}>إدخال</NavLink>
          <NavLink to="/archive" className={link}>الأرشيف</NavLink>
          {permissions?.isAdmin && <NavLink to="/admin" className={link}>الأدمن</NavLink>}
        </nav>
      </header>

      <main className="relative z-1 mx-auto max-w-5xl px-4">
        <Routes>
          <Route path="/" element={<Navigate to="/devices" replace />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/d/:code" element={<DevicePage />} />
          <Route path="/entry" element={<Entry />} />
          <Route path="/archive" element={<Archive />} />
          <Route
            path="/admin"
            element={
              permissions?.isAdmin
                ? <Admin />
                : <Navigate to="/devices" replace />
            }
          />
          <Route path="*" element={<Navigate to="/devices" replace />} />
        </Routes>
      </main>

    </>
  );
}
