import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { LS_KEYS } from '../lib/constants';

// ثيمين فقط: داكن (افتراضي) وفاتح
export const THEMES = {
  dark:  { label: 'داكن', swatch: 'linear-gradient(135deg,#c9a84c,#0d0900)', cls: '' },
  light: { label: 'فاتح', swatch: 'linear-gradient(135deg,#f5f0e8,#c9a84c)', cls: 'light-mode' },
};

const ALL_CLASSES = Object.values(THEMES).map((t) => t.cls).filter(Boolean);

const ThemeContext = createContext(null);

function readStoredTheme() {
  try {
    const t = localStorage.getItem(LS_KEYS.theme);
    // توافق مع الإصدارات القديمة: أي ثيم ملوّن قديم → داكن
    if (t === 'light') return 'light';
    return 'dark';
  } catch {
    return 'dark';
  }
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(readStoredTheme);

  useEffect(() => {
    document.body.classList.remove(...ALL_CLASSES);
    const cls = THEMES[theme]?.cls;
    if (cls) document.body.classList.add(cls);
    try {
      localStorage.setItem(LS_KEYS.theme, theme);
    } catch { /* noop */ }
  }, [theme]);

  const setTheme = useCallback((t) => {
    if (THEMES[t]) setThemeState(t);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((cur) => (cur === 'light' ? 'dark' : 'light'));
  }, []);

  const isLight = theme === 'light';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isLight }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme لازم يتنادى جوّه ThemeProvider');
  return ctx;
}
