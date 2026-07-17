/**
 * يحسب أسعار العرض في الكارت/الدرج حسب دور المشاهد.
 *
 * بيرجّع:
 *   - applied: الأسعار "المطبَّقة" (تير مفتوح بالكود، أو كل التيرات للأدمن) — تتعرض كبيرة.
 *   - defaultPrice: السعر الافتراضي — يتشطب عليه لو فيه أسعار مطبَّقة، وإلا يتعرض عادي بارز.
 *
 * القواعد:
 *   - الأدمن: كل السياسات النشطة تلقائيًا (الافتراضي = defaultPrice، الباقي = applied).
 *   - غير الأدمن (موظف/زائر): الافتراضي المُعلَن (toggle) + المفتوح بالكود للجلسة.
 */
export function computePriceView({ record, isAdmin, defaultPolicy, activePolicies, unlockedByDevice }) {
  const prices = record?.pricesByPolicy || {};
  const applied = [];
  let defaultPrice = null;

  if (isAdmin) {
    for (const p of activePolicies || []) {
      if (prices[p.id] == null) continue;
      if (p.is_default) defaultPrice = prices[p.id];
      else applied.push({ name: p.name, price: prices[p.id] });
    }
  } else {
    if (defaultPolicy?.is_public && prices[defaultPolicy.id] != null) {
      defaultPrice = prices[defaultPolicy.id];
    }
    const unlocked = (unlockedByDevice && unlockedByDevice[record?.sheetRow]) || {};
    for (const [pid, u] of Object.entries(unlocked)) {
      // لو الافتراضي نفسه اتفتح بالكود، اعتبره defaultPrice مش مطبَّق
      if (defaultPolicy && String(defaultPolicy.id) === String(pid)) {
        if (defaultPrice == null) defaultPrice = u.price;
        continue;
      }
      applied.push({ name: u.name, price: u.price });
    }
  }

  return { applied, defaultPrice };
}
