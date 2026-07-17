import { createClient } from '@supabase/supabase-js';

/**
 * الدومين النهائي — الوحيد المسموح به في قايمة Redirect URLs بتاعة Supabase.
 * أي دومين تاني (Vercel، localhost) رابط إعادة التعيين مش هيشتغل عليه.
 * ده مقصود: يعني ما بنلمسش إعدادات Supabase أبدًا.
 */
export const PROD_ORIGIN = 'https://ishop.mtc-group.online';

export const isProdOrigin = () =>
  typeof window !== 'undefined' && window.location.origin === PROD_ORIGIN;

/**
 * المفتاح العلني (anon).
 * ⚠️ مش سر: موجود بالنص في config.js على الموقع الحي دلوقتي.
 *    الحماية الحقيقية في الـ RLS على السيرفر، مش في إخفاء المفتاح.
 *
 * القيم دي fallback عشان النشر على Vercel يشتغل من غير ضبط env.
 * لو حبيت تضبط env في Vercel، هتاخد الأولوية تلقائيًا.
 */
const FALLBACK_URL = 'https://xsanzqeumjdyiwkutepj.supabase.co';
const FALLBACK_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhzYW56cWV1bWpkeWl3a3V0ZXBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgyNjE0MzMsImV4cCI6MjA5MzgzNzQzM30.Fh4ue0HT_NHqAv8Pi2kEm6MAMrWwhJLnuGrQSqE4lW0';

const URL = import.meta.env.VITE_SUPABASE_URL || FALLBACK_URL;
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_KEY;

export const supabase = createClient(URL, KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // لازمة لرابط إعادة تعيين كلمة السر
  },
});
