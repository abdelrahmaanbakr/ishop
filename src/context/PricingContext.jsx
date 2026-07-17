import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { fetchPricingPolicies, unlockPrices } from '../lib/api';

/**
 * بيانات السياسات السعرية + الأسعار المكشوفة بالكود.
 *
 * ⚠️ محروسة: لو جداول الأسعار لسه مش موجودة، بنرجّع قوائم فاضية بدل
 *    ما نكسر التطبيق.
 *
 * الأسعار المكشوفة (unlockedByDevice) بتيجي من دالة unlock_prices على
 * السيرفر — الزائر بيدخّل كود سياسته فتظهرله أسعارها بس، حتى لو توجل
 * "عرض الأسعار" OFF. بتتخزّن للجلسة فقط وتتقفل مع إغلاق المتصفح.
 */
const PricingContext = createContext(null);

const SS_KEY = 'ishop-unlocked-prices';
const EMPTY = {
  policies: [], activePolicies: [], defaultPolicy: null, loading: false,
  refresh: () => {}, unlockedByDevice: {}, unlock: async () => ({ count: 0 }),
};

function loadUnlocked() {
  try { return JSON.parse(sessionStorage.getItem(SS_KEY)) || {}; }
  catch { return {}; }
}

export function PricingProvider({ children }) {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unlockedByDevice, setUnlockedByDevice] = useState(loadUnlocked);

  const refresh = useCallback(async () => {
    try {
      setPolicies(await fetchPricingPolicies());
    } catch {
      setPolicies([]); // الجداول لسه مش موجودة
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // كشف أسعار سياسة بالكود — بيرجّع عدد الأجهزة اللي اتكشفت واسم السياسة
  const unlock = useCallback(async (code) => {
    const c = String(code || '').trim();
    if (!c) return { count: 0 };
    const rows = await unlockPrices(c);
    if (!rows.length) return { count: 0 };

    setUnlockedByDevice((prev) => {
      const next = { ...prev };
      for (const r of rows) {
        next[r.device_id] = {
          ...(next[r.device_id] || {}),
          [r.policy_id]: { price: r.price, name: r.policy_name },
        };
      }
      try { sessionStorage.setItem(SS_KEY, JSON.stringify(next)); } catch { /* noop */ }
      return next;
    });

    return { count: rows.length, policyName: rows[0].policy_name };
  }, []);

  const activePolicies = policies.filter((p) => p.is_active);
  const defaultPolicy = policies.find((p) => p.is_default) || null;

  return (
    <PricingContext.Provider
      value={{ policies, activePolicies, defaultPolicy, loading, refresh, unlockedByDevice, unlock }}
    >
      {children}
    </PricingContext.Provider>
  );
}

export function usePricing() {
  return useContext(PricingContext) || EMPTY;
}
