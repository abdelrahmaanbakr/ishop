/**
 * قواعد إظهار أزرار التعديل والحذف — منقولة حرفيًا من ui.js:135-137.
 *
 * ⚠️ الفخ هنا: غير الأدمن ما بيعدّلش/يحذفش غير **سجلاته هو**.
 *    والمقارنة على `display_name` مش `username`.
 *
 *   const isMyRecord = currentUser && r.addedby === currentUser.display;
 *   showEditBtn   = isAdmin || (canEdit && isMyRecord && _canEditOwn !== false)
 *   showDeleteBtn = isAdmin || (isMyRecord && (role==='entry' || role==='user') && _canDeleteOwn !== false)
 */

/** data.js:305 — الأدوار اللي ليها حق التعديل أصلًا */
export function roleCanEdit(role) {
  return role === 'admin' || role === 'entry' || role === 'user';
}

export function isMyRecord(record, permissions) {
  if (!permissions) return false;
  return record.addedby === permissions.display;
}

export function canEditRecord(record, permissions) {
  if (!permissions) return false;
  if (permissions.isAdmin) return true;
  return (
    roleCanEdit(permissions.role) &&
    isMyRecord(record, permissions) &&
    permissions.canEdit
  );
}

export function canDeleteRecord(record, permissions) {
  if (!permissions) return false;
  if (permissions.isAdmin) return true;
  return (
    isMyRecord(record, permissions) &&
    (permissions.role === 'entry' || permissions.role === 'user') &&
    permissions.canDelete
  );
}
