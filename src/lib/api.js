import { supabase } from './supabase';
import { GUEST_DEVICE_COLS, MAX_IMG_SIZE } from './constants';
import { safeUrl } from '../utils/safeUrl';

/**
 * طبقة واحدة بين الواجهة و Supabase.
 * كل طلب بيعدّي من هنا — عشان نقدر نراجع سطح الاتصال كله من ملف واحد
 * ونتأكد إنه مطابق حرفيًا لـ v4.5.1.
 *
 * ⚠️ عمليات الكتابة (إضافة/تعديل/حذف/أرشفة/أدمن) مش هنا عن قصد.
 *    المراحل 4 و5 و6 مؤجّلة — القرار كان الاختيار (ج).
 *
 * كل اسم عمود وكل براميتر هنا اتأكدت منه من كود v4.5.1، مش من الذاكرة.
 */

// ── RPC ────────────────────────────────────────────────────────

/** username → email. البراميتر اسمه p_username (مش p_user). */
export async function loginEmail(username) {
  const { data, error } = await supabase.rpc('login_email', { p_username: username });
  if (error) throw error;
  return data;
}

export async function verifyDeletePass(pass) {
  const { data, error } = await supabase.rpc('verify_delete_pass', { p_pass: pass });
  if (error) throw error;
  return data;
}

export async function hasDeletePass() {
  const { data, error } = await supabase.rpc('has_delete_pass');
  if (error) throw error;
  return data;
}

// ── DEVICES (قراءة) ────────────────────────────────────────────

/**
 * مطابقة لـ data.js:44-45 بالظبط:
 *
 *   الزائر        → select=GUEST_DEVICE_COLS & archived=is.false & order=id.desc
 *   المسجّل       → select=*                                      & order=id.desc
 *
 * ملاحظة مهمة: المستخدم المسجّل بيحمّل **كل** الصفوف — المؤرشفة والنشطة —
 * والفصل بينهم بيحصل في الواجهة. صفحة الأرشيف بتفلتر من نفس المصفوفة.
 * لو ضفنا فلتر archived هنا، الأرشيف هيفضى.
 */
export async function fetchDevices({ guest = false } = {}) {
  let q = supabase.from('devices');

  if (guest) {
    q = q.select(GUEST_DEVICE_COLS).eq('archived', false);
  } else {
    q = q.select('*');
  }

  const { data, error } = await q.order('id', { ascending: false });
  if (error) throw error;
  return data ?? [];
}

// ── USERS (قراءة) ──────────────────────────────────────────────

/**
 * صف المستخدم الحالي — منه بنقرأ الدور والصلاحيات.
 * مطابق لـ auth.js:302 → auth_id=eq.<uid> & is_active=eq.true
 */
export async function fetchMyUserRow(authId) {
  const { data, error } = await supabase
    .from('ishop_users')
    .select('*')
    .eq('auth_id', authId)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** قائمة المستخدمين النشطين — للأدمن. مطابق لـ auth.js:8 */
export async function fetchUsers() {
  const { data, error } = await supabase
    .from('ishop_users')
    .select('*')
    .eq('is_active', true);
  if (error) throw error;
  return data ?? [];
}

// ── STORAGE (قراءة) ────────────────────────────────────────────

export const BUCKET = 'device-images';

/**
 * ⚠️ عمود `images` مخزّن فيه **روابط كاملة**، مش مسارات.
 *    (data.js:586 — uploadImageToStorage بيرجّع URL كامل)
 *    فـ getPublicUrl() هنا كانت هتكسر الرابط. الرابط بيتستخدم زي ما هو.
 */
export function deviceImageUrl(url) {
  return safeUrl(url);
}

// ════════════════════════════════════════════════════════════════
//  المرحلة 4 — الكتابة (إدخال · تعديل · حذف · صور)
//  منقولة من data.js بنفس المنطق والقيم بالظبط.
// ════════════════════════════════════════════════════════════════


const IMG_QUALITY = 0.82; // نفس قيمة الأصل
export const MAX_IMAGES = 4;

// الكود التالي للجهاز الجديد — نفس منطق الأصل (يبدأ من 88)
export async function nextDeviceCode() {
  const { data, error } = await supabase
    .from('devices')
    .select('device_code')
    .not('device_code', 'is', null);
  if (error) throw error;

  let next = 88;
  const nums = (data ?? [])
    .map((r) => parseInt(r.device_code))
    .filter((n) => !isNaN(n));
  if (nums.length) next = Math.max(...nums) + 1;
  return next.toString();
}

// إدخال جهاز جديد
export async function insertDevice(fields) {
  const code = await nextDeviceCode();
  const { data, error } = await supabase
    .from('devices')
    .insert({
      ...fields,
      date: new Date().toISOString().split('T')[0],
      archived: false,
      device_code: code,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

// تعديل جهاز
export async function updateDevice(id, fields) {
  const { data, error } = await supabase
    .from('devices')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

// حذف جهاز
export async function deleteDevice(id) {
  const { error } = await supabase.from('devices').delete().eq('id', id);
  if (error) throw error;
}

// ── الصور ─────────────────────────────────────────────────────

// ضغط الصورة — نفس أبعاد وجودة الأصل (800px, 0.82)
export function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > MAX_IMG_SIZE || height > MAX_IMG_SIZE) {
          if (width > height) {
            height = Math.round((height * MAX_IMG_SIZE) / width);
            width = MAX_IMG_SIZE;
          } else {
            width = Math.round((width * MAX_IMG_SIZE) / height);
            height = MAX_IMG_SIZE;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error('فشل ضغط الصورة'));
            resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          },
          'image/jpeg',
          IMG_QUALITY
        );
      };
      img.onerror = () => reject(new Error('فشل قراءة الصورة'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('فشل قراءة الملف'));
    reader.readAsDataURL(file);
  });
}

// رفع صورة واحدة — بيرجّع رابط كامل (زي ما العمود بيخزّن)
export async function uploadDeviceImage(file, deviceId) {
  const compressed = await compressImage(file);
  const path = `${deviceId}/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, compressed, { contentType: 'image/jpeg', upsert: false });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

// حذف صورة من الـ Storage — بالرابط الكامل
export async function deleteDeviceImage(url) {
  const path = String(url).split('/object/public/' + BUCKET + '/')[1];
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

// ── كلمة سر الحذف ─────────────────────────────────────────────
export async function setDeletePass(userId, pass) {
  const { data, error } = await supabase.rpc('set_delete_pass', {
    p_user_id: userId,
    p_pass: pass,
  });
  if (error) throw error;
  return data;
}

// ════════════════════════════════════════════════════════════════
//  المرحلة 5 — الأرشيف (أرشفة · إلغاء أرشفة)
//  منقولة من ui.js بنفس الحقول والمنطق.
// ════════════════════════════════════════════════════════════════

// أرشفة جهاز — reason: 'sold' | 'return'
export async function archiveDevice(id, { reason, buyerName, buyerPhone, imei }) {
  const archiveReason =
    reason === 'sold' ? 'تم البيع' : reason === 'return' ? 'مرتجع للبائع الأصلي' : '';
  const today = new Date().toLocaleDateString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });

  const { error } = await supabase
    .from('devices')
    .update({
      archived: true,
      archive_reason: archiveReason,
      buyer_name: reason === 'sold' ? buyerName || '' : '',
      buyer_phone: reason === 'sold' ? buyerPhone || '' : '',
      imei: imei || '',
      archive_date: today,
    })
    .eq('id', id);
  if (error) throw error;
  return { archiveReason, archiveDate: today };
}

// إلغاء الأرشفة — بيرجّع الجهاز للقائمة ويمسح بيانات الأرشفة (نفس الأصل)
export async function unarchiveDevice(id) {
  // الرجوع من الأرشفة = دخول جديد للمخزون، فبنحدّث تاريخ الدخول لليوم
  const today = new Date().toISOString().split('T')[0];
  const { error } = await supabase
    .from('devices')
    .update({
      archived: false,
      archive_reason: '',
      buyer_name: '',
      buyer_phone: '',
      archive_date: '',
      date: today,
    })
    .eq('id', id);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════════
//  الأسعار — السياسات السعرية + أسعار الأجهزة (جدول منفصل)
// ════════════════════════════════════════════════════════════════

// كل السياسات (النشطة والمعطّلة). أعمدة صريحة بدون access_code — العمود ده
// ممنوع على الزائر، و select('*') كان هيقع عنده. الأدمن بيقراه من adminApi.
export async function fetchPricingPolicies() {
  const { data, error } = await supabase
    .from('pricing_policies')
    .select('id, name, code, is_active, is_public, is_default, sort')
    .order('sort', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

/**
 * كشف أسعار سياسة بالكود السري (للزائر).
 * الدالة على السيرفر بتتحقق من الكود وترجّع أسعار سياسته فقط — كود غلط = فاضي.
 */
export async function unlockPrices(code) {
  const { data, error } = await supabase.rpc('unlock_prices', { p_code: code });
  if (error) throw error;
  return data ?? [];
}

// كل أسعار الأجهزة. الـ RLS بتحصر الزائر على أسعار السياسات المعلَنة فقط.
export async function fetchDevicePrices() {
  const { data, error } = await supabase
    .from('device_prices')
    .select('device_id, policy_id, price');
  if (error) throw error;
  return data ?? [];
}

/**
 * كتابة أسعار جهاز.
 * entries: [{ policyId, price }]  — القيمة الفاضية/غير الرقمية = حذف الصف.
 * الـ RLS بتفرض نفس صلاحية تعديل الجهاز بالظبط.
 */
export async function saveDevicePrices(deviceId, entries) {
  const toUpsert = [];
  const toDelete = [];
  for (const { policyId, price } of entries || []) {
    const raw = price == null ? '' : String(price).trim();
    const n = raw === '' ? null : Number(raw);
    if (n == null || isNaN(n)) toDelete.push(policyId);
    else toUpsert.push({ device_id: deviceId, policy_id: policyId, price: n });
  }

  if (toUpsert.length) {
    const { error } = await supabase
      .from('device_prices')
      .upsert(toUpsert, { onConflict: 'device_id,policy_id' });
    if (error) throw error;
  }
  if (toDelete.length) {
    const { error } = await supabase
      .from('device_prices')
      .delete()
      .eq('device_id', deviceId)
      .in('policy_id', toDelete);
    if (error) throw error;
  }
}

// ════════════════════════════════════════════════════════════════
//  قنوات الاتصال (الدعم الفني وغيره)
// ════════════════════════════════════════════════════════════════

// جلب قناة واحدة بمفتاحها (للمودال العام) — قراءة متاحة للكل
export async function getContactChannel(key) {
  const { data, error } = await supabase
    .from('contact_channels')
    .select('*')
    .eq('key', key)
    .eq('is_active', true)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// كل القنوات (للوحة الأدمن)
export async function fetchContactChannels() {
  const { data, error } = await supabase
    .from('contact_channels')
    .select('*')
    .order('sort');
  if (error) throw error;
  return data ?? [];
}
