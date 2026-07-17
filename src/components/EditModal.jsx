import { useState } from 'react';
import { useToast } from '../context/ToastContext';
import { updateDevice, uploadDeviceImage, saveDevicePrices } from '../lib/api';
import Modal from './ui/Modal';
import DeviceForm from './DeviceForm';

/** مودال التعديل — بيعيد استخدام DeviceForm بوضع edit. */
export default function EditModal({ device, onSaved, onClose }) {
  const { show } = useToast();
  const [busy, setBusy] = useState(false);

  if (!device) return null;

  async function handleSubmit(fields, newImages, priceEntries) {
    setBusy(true);
    try {
      // الصور الجديدة تُرفع وتُضاف للحالية
      let images;
      if (newImages.length > 0) {
        show(`⏳ جاري رفع ${newImages.length} صورة...`, 'info');
        const uploaded = [];
        for (const img of newImages) {
          uploaded.push(await uploadDeviceImage(img, device.sheetRow));
        }
        images = [...(device.images || []), ...uploaded];
      }

      await updateDevice(device.sheetRow, images ? { ...fields, images } : fields);

      // الأسعار — محروسة زي الإدخال
      if (priceEntries?.length) {
        try {
          await saveDevicePrices(device.sheetRow, priceEntries);
        } catch {
          show('⚠️ التعديل اتحفظ بس الأسعار ما اتحدّثتش', 'error');
        }
      }

      show('✅ تم حفظ التعديلات');
      onSaved();
      onClose();
    } catch (e) {
      show('❌ فشل الحفظ: ' + (e.message || ''), 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={!!device} onClose={onClose} title={`تعديل — ${device.model}`} closeOnOverlay={false}>
      <div className="max-h-[70vh] overflow-y-auto px-1 text-start">
        <DeviceForm
          mode="edit"
          initial={device}
          onSubmit={handleSubmit}
          onCancel={onClose}
          busy={busy}
        />
      </div>
    </Modal>
  );
}
