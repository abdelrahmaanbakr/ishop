import { useCallback, useState } from 'react';
import { LS_KEYS } from '../lib/constants';

const MAX = 5;

export function useSearchHistory() {
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LS_KEYS.searchHistory) || '[]');
    } catch { return []; }
  });

  const push = useCallback((term) => {
    const t = String(term || '').trim();
    if (!t) return;
    setHistory((prev) => {
      const next = [t, ...prev.filter((x) => x !== t)].slice(0, MAX);
      try { localStorage.setItem(LS_KEYS.searchHistory, JSON.stringify(next)); } catch { /* ممتلئ */ }
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setHistory([]);
    try { localStorage.removeItem(LS_KEYS.searchHistory); } catch { /* تجاهل */ }
  }, []);

  return { history, push, clear };
}
