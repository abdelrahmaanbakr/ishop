/**
 * config.js — منقولة حرفيًا.
 * React بيهرّب المحتوى تلقائيًا، لكن `src` **مش** بيتهرّب —
 * فالدالة دي لسه مطلوبة عشان تمنع javascript: و data: URIs.
 */
export function safeUrl(url) {
  if (!url) return '';
  const s = String(url).trim();
  if (/^https?:\/\//i.test(s)) return s;
  return '';
}
