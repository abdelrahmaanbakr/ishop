// ══ المصدر الوحيد للثوابت ═════════════════════════════════════

// ════════════════════════════════════════════════════════════════
//  نظام ترقيم الإصدار:  R 1 4 9 1
//    R1  = React، الإصدار الأول
//    4   = رقم المرحلة الفعلي (0=تأسيس .. 4=كتابة .. 5=أرشيف .. 6=أدمن)
//    9   = تعديل أساسي داخل المرحلة
//    1   = معالجة خطأ في تعديل
//  ⚠️ لازم يتحدّث مع كل تعديل، ويظهر في واجهة الموظفين وشاشة الدخول.
// ════════════════════════════════════════════════════════════════
export const APP_VERSION = 'R1873';

export const PAGE_SIZE = 30;
export const IDLE_MINUTES = 20;
export const MAX_IMG_SIZE = 800; // أقصى عرض/ارتفاع بعد الضغط

// الأعمدة المسموح للزائر يشوفها — منقولة حرفيًا من v4.5.1
export const GUEST_DEVICE_COLS = [
  'id', 'device_code', 'model', 'brand', 'storage', 'battery', 'cycles',
  'color', 'sim', 'box', 'repair', 'tax', 'warranty', 'warranty_date',
  'lock', 'defects', 'extras', 'imei', 'price', 'notes', 'addedby',
  'phone', 'date', 'archived', 'images',
].join(',');

// مفاتيح localStorage — لازم تفضل بأسمائها عشان المستخدمين الحاليين
// ما يفقدوش إعداداتهم
export const LS_KEYS = {
  theme: 'ishop-theme',
  layout: 'ishop-layout',
  searchHistory: 'ishop-search-hist',
};
