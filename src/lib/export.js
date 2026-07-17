// utils.js:616 — نفس الأعمدة ونفس BOM ونفس اسم الملف

const HEADERS = ['الموديل','الذاكرة','البطارية','اللون','الشريحة','الكرتونة','صيانة','الجمارك','الضمان','الشفرة','تمت الإضافة بواسطة','التاريخ'];
const KEYS = ['model','storage','battery','color','sim','box','repair','tax','warranty','lock','addedby','date'];

export function exportCSV(data) {
  if (!data.length) return 0;

  const rows = data.map((r) =>
    KEYS.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(',')
  );
  const csv = [HEADERS.join(','), ...rows].join('\n');

  // \uFEFF = BOM — من غيرها Excel بيعرض العربي مكسّر
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `iShop_${new Date().toLocaleDateString('ar-EG').replace(/\//g, '-')}.csv`;
  a.click();
  URL.revokeObjectURL(url);

  return data.length;
}
