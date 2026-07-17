import { useEffect } from 'react';

/**
 * utils.js:664 — نفس الاختصارات.
 * ملاحظة: الكود الأصلي كان بيسجّل listener عالمي مرة واحدة عند التحميل،
 * حتى وإحنا في شاشة اللوجين. هنا الـ hook بيتربط بصفحة الأجهزة بس.
 */
export function useKeyboardShortcuts({ onSearchFocus, onClear, onHelp, active = true }) {
  useEffect(() => {
    if (!active) return;

    const handler = (e) => {
      const inInput = ['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName);

      if (e.key === '?' && !inInput) { onHelp?.(); return; }

      if (e.key === '/' && !inInput) {
        e.preventDefault();
        onSearchFocus?.();
        return;
      }

      if (e.key === 'Escape') {
        if (inInput) { e.target.blur(); return; }
        onClear?.();
      }
    };

    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [active, onSearchFocus, onClear, onHelp]);
}
