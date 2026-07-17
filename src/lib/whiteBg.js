/**
 * إزالة الخلفية ووضع خلفية بيضاء — U2Net عبر onnxruntime-web.
 * كله رخص حرة (onnxruntime-web: MIT، U2Net: Apache).
 *
 * كله كسول: الموديل (~4.4MB) وملفات الـ wasm مايتحمّلوش غير أول مرة
 * يفعّل فيها الموظف الزر. النتيجة File جاهزة تدخل نفس مسار الضغط/الرفع.
 *
 * عتبة ناعمة على القناع: أي خلفية باهتة تتشال تمامًا، فيظهر الموبايل
 * والكرتونة (الأجسام البارزة) بس نضاف على أبيض.
 */

const MODEL_URL = '/models/u2netp.onnx';
// المحرّك (نسخة wasm فقط) + ملفات الـ wasm — كلها من CDN وقت الحاجة، مايتضمّنش في الحزمة
const ORT_CDN = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.27.0/dist/';
const SIZE = 320;
const MEAN = [0.485, 0.456, 0.406];
const STD = [0.229, 0.224, 0.225];
// عتبة القناع: تحت LO = خلفية (شفاف تمامًا)، فوق HI = جسم (معتم)، تدرّج بينهم
const LO = 0.3;
const HI = 0.55;

let sessionPromise = null;

async function getSession() {
  if (!sessionPromise) {
    sessionPromise = (async () => {
      // @vite-ignore عشان Vite مايحاولش يحزم المحرّك — بيتحمّل من الـ CDN
      const ort = await import(/* @vite-ignore */ `${ORT_CDN}ort.wasm.min.mjs`);
      ort.env.wasm.wasmPaths = ORT_CDN;
      // خيط واحد: النسخة متعددة الخيوط بتحتاج SharedArrayBuffer (ترويسات
      // COOP/COEP) اللي مش موجودة على الاستضافة العادية → بتعلّق. ده بيتفاداها.
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.simd = true;
      const session = await ort.InferenceSession.create(MODEL_URL, {
        executionProviders: ['wasm'],
      });
      return { ort, session };
    })().catch((e) => { sessionPromise = null; throw e; });
  }
  return sessionPromise;
}

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = URL.createObjectURL(file);
  });
}

/** يرجّع File (jpeg): الموبايل والكرتونة على خلفية بيضاء */
export async function toWhiteBg(file) {
  const { ort, session } = await getSession();
  const img = await loadImage(file);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;

  // 1) رسم 320×320 لإدخال الموديل
  const inC = document.createElement('canvas');
  inC.width = SIZE; inC.height = SIZE;
  const ictx = inC.getContext('2d');
  ictx.drawImage(img, 0, 0, SIZE, SIZE);
  const { data } = ictx.getImageData(0, 0, SIZE, SIZE);

  // 2) تجهيز [1,3,320,320] بالتطبيع (RGB، channels-first)
  const plane = SIZE * SIZE;
  const input = new Float32Array(3 * plane);
  for (let i = 0; i < plane; i++) {
    input[i]             = (data[i * 4]     / 255 - MEAN[0]) / STD[0];
    input[plane + i]     = (data[i * 4 + 1] / 255 - MEAN[1]) / STD[1];
    input[2 * plane + i] = (data[i * 4 + 2] / 255 - MEAN[2]) / STD[2];
  }

  // 3) التشغيل — المخرج الرئيسي هو أول واحد (d0)
  const out = await session.run({ 'input.1': new ort.Tensor('float32', input, [1, 3, SIZE, SIZE]) });
  const mask = out[Object.keys(out)[0]].data;

  // 4) تطبيع min-max + عتبة ناعمة → قناة alpha (خلفية نضيفة، أجسام معتمة)
  let mi = Infinity, ma = -Infinity;
  for (let i = 0; i < mask.length; i++) { if (mask[i] < mi) mi = mask[i]; if (mask[i] > ma) ma = mask[i]; }
  const range = ma - mi || 1;

  const maskC = document.createElement('canvas');
  maskC.width = SIZE; maskC.height = SIZE;
  const mctx = maskC.getContext('2d');
  const mImg = mctx.createImageData(SIZE, SIZE);
  for (let i = 0; i < mask.length; i++) {
    const norm = (mask[i] - mi) / range;                 // [0,1]
    const a = norm <= LO ? 0 : norm >= HI ? 1 : (norm - LO) / (HI - LO);
    mImg.data[i * 4 + 3] = Math.round(a * 255);          // alpha فقط
  }
  mctx.putImageData(mImg, 0, 0);

  // 5) الأجسام فقط (خلفية شفافة) بالحجم الأصلي عبر destination-in
  const subC = document.createElement('canvas');
  subC.width = W; subC.height = H;
  const sctx = subC.getContext('2d');
  sctx.drawImage(img, 0, 0, W, H);
  sctx.globalCompositeOperation = 'destination-in';
  sctx.drawImage(maskC, 0, 0, W, H); // تكبير القناع (bilinear) → حواف ناعمة

  // 6) فوق خلفية بيضاء
  const outC = document.createElement('canvas');
  outC.width = W; outC.height = H;
  const octx = outC.getContext('2d');
  octx.fillStyle = '#ffffff';
  octx.fillRect(0, 0, W, H);
  octx.drawImage(subC, 0, 0);

  const blob = await new Promise((res) => outC.toBlob(res, 'image/jpeg', 0.92));
  URL.revokeObjectURL(img.src);
  const base = (file.name || 'image').replace(/\.[^.]+$/, '');
  return new File([blob], `${base}_white.jpg`, { type: 'image/jpeg' });
}
