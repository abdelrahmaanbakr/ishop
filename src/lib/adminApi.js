import { supabase } from './supabase';
import { setDeletePass } from './api';
export { setDeletePass };

// ════════════════════════════════════════════════════════════════
//  المرحلة 6 — إدارة المستخدمين (أدمن فقط)
// ════════════════════════════════════════════════════════════════

// إنشاء مستخدم — عبر Edge Function (بتعمله في الجدولين ذرّيًا)
export async function createUser(payload) {
  const { data, error } = await supabase.functions.invoke('create-user', {
    body: payload,
  });
  if (error) {
    // نحاول نقرا رسالة السيرفر التفصيلية
    let msg = error.message;
    try {
      const ctx = await error.context?.json?.();
      if (ctx?.error) msg = ctx.error;
    } catch { /* noop */ }
    throw new Error(msg);
  }
  return data;
}

// تحديث بيانات مستخدم موجود (الصلاحيات، الدور، الاسم، الهاتف)
export async function updateUserRow(id, fields) {
  const { error } = await supabase.from('ishop_users').update(fields).eq('id', id);
  if (error) throw error;
}

// تغيير البريد — عبر دالة السيرفر (بتحدّث auth.users كمان)
export async function setUserEmail(userId, email) {
  const { data, error } = await supabase.rpc('admin_set_user_email', {
    p_user_id: userId,
    p_email: email,
  });
  if (error) throw error;
  return data;
}

// هل المستخدم عنده كلمة سر حذف؟ (للعرض في الفورم)
export async function userHasDeletePass(userId) {
  // ملاحظة: has_delete_pass بتشتغل على المستخدم الحالي بس.
  // للأدمن بيعرض حالة مستخدم تاني، بنقرا من عمود delete_pass_hash
  const { data, error } = await supabase
    .from('ishop_users')
    .select('delete_pass_hash')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return !!data?.delete_pass_hash;
}

// تعديل قناة اتصال (أدمن فقط عبر RLS)
export async function updateContactChannel(id, fields) {
  const { error } = await supabase.from('contact_channels').update(fields).eq('id', id);
  if (error) throw error;
}

// ════════════════════════════════════════════════════════════════
//  السياسات السعرية (أدمن فقط عبر RLS)
// ════════════════════════════════════════════════════════════════

export async function createPricingPolicy({ name, code, access_code }) {
  const { error } = await supabase
    .from('pricing_policies')
    .insert({ name, code, access_code: access_code || null });
  if (error) throw error;
}

// قائمة السياسات للأدمن — بتشمل الكود السري access_code (الأدمن مسموحله يقراه)
export async function fetchPricingPoliciesAdmin() {
  const { data, error } = await supabase
    .from('pricing_policies')
    .select('id, name, code, is_active, is_public, is_default, sort, access_code')
    .order('sort', { ascending: true })
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function updatePricingPolicy(id, fields) {
  const { error } = await supabase.from('pricing_policies').update(fields).eq('id', id);
  if (error) throw error;
}

// "حذف" سياسة = تعطيلها (بيحافظ على الأسعار المخزّنة)
export async function deactivatePricingPolicy(id) {
  return updatePricingPolicy(id, { is_active: false });
}

// "عرض الأسعار" = تبديل is_public على السياسة (الافتراضية عادةً)
export async function setPolicyPublic(id, isPublic) {
  return updatePricingPolicy(id, { is_public: isPublic });
}
