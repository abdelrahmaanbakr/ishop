// منقولة من config.js
export const BRAND_MODELS = {
  iPhone: [
    'iPhone 17 Pro Max','iPhone 17 Pro','iPhone 17 Plus','iPhone 17',
    'iPhone 16 Pro Max','iPhone 16 Pro','iPhone 16 Plus','iPhone 16',
    'iPhone 15 Pro Max','iPhone 15 Pro','iPhone 15 Plus','iPhone 15',
    'iPhone 14 Pro Max','iPhone 14 Pro','iPhone 14 Plus','iPhone 14',
    'iPhone 13 Pro Max','iPhone 13 Pro','iPhone 13','iPhone 13 mini',
    'iPhone 12 Pro Max','iPhone 12 Pro','iPhone 12','iPhone 12 mini',
    'iPhone 11 Pro Max','iPhone 11 Pro','iPhone 11',
    'iPhone XS Max','iPhone XS','iPhone XR','iPhone X',
    'iPhone SE','iPhone 8 Plus','iPhone 8',
  ],
  Samsung: [], Xiaomi: [], Oppo: [], Vivo: [], Realme: [],
  Tecno: [], Infinix: [], Huawei: [], Honor: [], 'أخرى': [],
};

/** config.js:174 */
export function detectBrand(model) {
  if (!model || model === '-') return '';
  const lower = model.toLowerCase().trim();
  for (const brand of Object.keys(BRAND_MODELS)) {
    if (brand === 'أخرى') continue;
    if (BRAND_MODELS[brand].includes(model)) return brand;
    if (lower.startsWith(brand.toLowerCase())) return brand;
  }
  return 'أخرى';
}

/** data.js:192 */
export function getBrand(r) {
  if (r.brand && r.brand !== '-' && r.brand !== '') return r.brand;
  return detectBrand(r.model);
}

/** utils.js:81 */
export function brandIcon(brand, model) {
  const b = (brand || '').toLowerCase();
  const m = (model || '').toLowerCase();
  if (b === 'iphone'  || m.startsWith('iphone')) return '🍎';
  if (b === 'samsung' || m.includes('samsung') || m.includes('galaxy')) return '🔵';
  if (b === 'xiaomi'  || m.includes('xiaomi') || m.includes('redmi') || m.includes('poco')) return '🟠';
  if (b === 'oppo'    || m.includes('oppo')) return '🟢';
  if (b === 'vivo'    || m.includes('vivo')) return '🔷';
  if (b === 'realme'  || m.includes('realme')) return '🟡';
  if (b === 'tecno'   || m.includes('tecno')) return '🟤';
  if (b === 'infinix' || m.includes('infinix')) return '⚫';
  if (b === 'huawei'  || m.includes('huawei')) return '🔴';
  if (b === 'honor'   || m.includes('honor')) return '🔶';
  return '📱';
}
