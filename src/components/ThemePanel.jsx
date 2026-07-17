import { useEffect, useRef, useState } from 'react';
import { useTheme, THEMES } from '../context/ThemeContext';

export function ThemeToggle({ fixed = false }) {
  const { isLight, toggleTheme } = useTheme();
  return (
    <button
      type="button"
      className={`theme-toggle${fixed ? ' theme-toggle-login' : ''}`}
      onClick={toggleTheme}
      title="تغيير المظهر"
      aria-label="تغيير المظهر"
    >
      {isLight ? '☀️' : '🌙'}
    </button>
  );
}

export function ThemePanel({ open, onClose }) {
  const { theme, setTheme } = useTheme();
  const ref = useRef(null);

  // Esc يقفل اللوحة
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <div ref={ref} className={`theme-panel${open ? ' open' : ''}`} role="dialog" aria-label="اختر الثيم">
      <div className="theme-panel-title">🎨 اختر الثيم</div>
      <div className="theme-swatches">
        {Object.entries(THEMES).map(([key, t]) => (
          <button
            key={key}
            type="button"
            className={`theme-swatch${theme === key ? ' active' : ''}`}
            onClick={() => {
              setTheme(key);
              onClose();
            }}
            aria-pressed={theme === key}
          >
            <span className="swatch-circle" style={{ background: t.swatch }} />
            <span className="swatch-label">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// hook صغير يدير حالة فتح/قفل اللوحة
export function useThemePanel() {
  const [open, setOpen] = useState(false);
  return {
    open,
    toggle: () => setOpen((v) => !v),
    close: () => setOpen(false),
  };
}
