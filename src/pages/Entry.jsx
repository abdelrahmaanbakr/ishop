import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { insertDevice, uploadDeviceImage, updateDevice, saveDevicePrices } from '../lib/api';
import DeviceForm from '../components/DeviceForm';

export default function Entry() {
  const { permissions } = useAuth();
  const { show } = useToast();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);

  async function handleSubmit(fields, images, priceEntries) {
    setBusy(true);
    try {
      // 1) الجهاز الأول (عشان ناخد الـ id للصور والأسعار)
      const device = await insertDevice(fields);

      // 2) رفع الصور (لو فيه) وربطها
      if (images.length > 0) {
        show(`⏳ جاري رفع ${images.length} صورة...`, 'info');
        const urls = [];
        for (const img of images) {
          urls.push(await uploadDeviceImage(img, device.id));
        }
        await updateDevice(device.id, { images: urls });
      }

      // 3) الأسعار — محروسة: فشلها ما يلغيش حفظ الجهاز
      if (priceEntries?.length) {
        try {
          await saveDevicePrices(device.id, priceEntries);
        } catch {
          show('⚠️ الجهاز اتحفظ بس الأسعار ما اتسجّلتش', 'error');
        }
      }

      show('✅ تم حفظ الجهاز بنجاح');
      navigate('/devices');
    } catch (e) {
      show('❌ فشل الحفظ: ' + (e.message || 'حاول تاني'), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-black text-accent">إدخال جهاز جديد</h1>
        <p className="mt-1 text-sm text-muted">الحقول اللي عليها * مطلوبة</p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-6">
        <DeviceForm
          mode="add"
          defaultAddedby={permissions?.display}
          onSubmit={handleSubmit}
          onCancel={() => navigate('/devices')}
          busy={busy}
        />
      </div>
    </div>
  );
}
