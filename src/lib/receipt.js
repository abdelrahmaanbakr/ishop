/**
 * إيصال تسليم الجهاز — نموذج A4 للطباعة.
 * منقول من printArchiveReceipt (ui.js) بنفس التصميم.
 * بيفتح نافذة جديدة بمحتوى مستقل ويطبع.
 */
export function printReceipt({ device, archiveReason, buyerName, buyerPhone, imei, archiveDate }) {
  const today = archiveDate || new Date().toLocaleDateString('ar-EG', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
  const r = device || {};

  const esc = (s) => String(s ?? '—').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]));

  const field = (label, val, extra = '') =>
    `<div class="field ${extra}"><div class="field-label">${label}</div><div class="field-val">${esc(val)}</div></div>`;

  const html = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
<meta charset="UTF-8">
<title>إذن تسليم جهاز — iShop</title>
<link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Cairo',Arial,sans-serif;background:#f5f5f5;padding:10px;color:#111;font-size:13px}
  .page{max-width:560px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,.12)}
  .header{background:linear-gradient(135deg,#1a1400,#2d2200);color:#c9a84c;padding:14px 20px;text-align:center}
  .brand{font-size:22px;font-weight:900;letter-spacing:-.5px;color:#f5d676}
  .brand span{color:#fff}
  .doc-title{font-size:14px;font-weight:700;color:#c9a84c;margin-top:6px;letter-spacing:1px}
  .date-row{font-size:11px;color:#a08030;margin-top:6px}
  .body{padding:12px 18px}
  .section{margin-bottom:10px}
  .section-title{font-size:10px;font-weight:800;color:#c9a84c;letter-spacing:1.5px;border-bottom:1.5px solid #e8e0cc;padding-bottom:5px;margin-bottom:10px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}
  .field{background:#faf8f3;border:1px solid #e8e0cc;border-radius:8px;padding:6px 10px}
  .field.full{grid-column:1/-1}
  .field-label{font-size:10px;color:#999;font-weight:700;margin-bottom:2px}
  .field-val{font-size:13px;font-weight:700;color:#111}
  .stmt{background:#fffbf0;border:1.5px solid #c9a84c;border-radius:10px;padding:8px 12px;text-align:center;margin-bottom:10px}
  .stmt p{font-size:13px;font-weight:700;color:#5a4200;line-height:1.7}
  .sig-row{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:10px}
  .sig-box{border-top:1.5px dashed #bbb;padding-top:8px;text-align:center}
  .sig-label{font-size:11px;color:#888;font-weight:700}
  .sig-line{height:28px}
  .footer{background:#f8f5ee;border-top:1px solid #e8e0cc;padding:8px 16px;text-align:center}
  .footer-brand{font-size:13px;font-weight:900;color:#c9a84c}
  .footer-brand span{color:#888}
  .footer-sub{font-size:9px;color:#bbb;margin-top:2px;letter-spacing:1px}
  .no-print{display:flex;gap:8px;justify-content:center;margin:10px auto;max-width:560px}
  .no-print button{padding:10px 24px;border-radius:8px;border:none;font-family:'Cairo',sans-serif;font-size:14px;font-weight:700;cursor:pointer}
  .btn-print{background:#c9a84c;color:#1a1400}
  .btn-close{background:#1a1400;color:#c9a84c}
  @page{size:A4 portrait;margin:0}
  @media print{body{padding:0;background:#fff}.page{box-shadow:none;border-radius:0;max-width:100%}.no-print{display:none!important}.header,.footer{border-radius:0}}
</style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div class="brand">i<span>Shop</span></div>
      <div class="doc-title">إذن تسليم جهاز</div>
      <div class="date-row">${today} — ${time}</div>
    </div>
    <div class="body">
      <div class="section">
        <div class="section-title">بيانات الجهاز</div>
        <div class="grid">
          ${field('الموديل', r.model)}
          ${field('الذاكرة', r.storage)}
          ${field('اللون', r.color)}
          ${field('البطارية', r.battery)}
          ${imei ? field('IMEI', imei, 'full') : ''}
          ${field('سبب الأرشفة', archiveReason, 'full')}
        </div>
      </div>

      ${buyerName ? `
      <div class="section">
        <div class="section-title">بيانات المشتري</div>
        <div class="grid">
          ${field('الاسم', buyerName)}
          ${field('الهاتف', buyerPhone)}
        </div>
      </div>` : ''}

      <div class="stmt">
        <p>تم تسليم الجهاز بحالته المذكورة أعلاه، وأقر المستلم بمعاينته والموافقة عليه.</p>
      </div>

      <div class="sig-row">
        <div class="sig-box"><div class="sig-line"></div><div class="sig-label">توقيع المُسلِّم</div></div>
        <div class="sig-box"><div class="sig-line"></div><div class="sig-label">توقيع المستلم</div></div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-brand">MTC <span>Group</span></div>
      <div class="footer-sub">بنها، مصر</div>
    </div>
  </div>

  <div class="no-print">
    <button class="btn-print" onclick="window.print()">🖨️ طباعة</button>
    <button class="btn-close" onclick="window.close()">إغلاق</button>
  </div>
</body>
</html>`;

  const w = window.open('', '_blank');
  if (!w) return; // المتصفح منع النافذة
  w.document.write(html);
  w.document.close();
}
