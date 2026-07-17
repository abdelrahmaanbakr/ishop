import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyDeletePass } from '../lib/api';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';

/**
 * مودال تأكيد الحذف.
 * كلمة السر بتظهر بس لو (reqDelPass && hasDelPass) — نفس منطق الأصل.
 * التحقق على السيرفر عبر verify_delete_pass — الهاش عمره ما بينزل.
 */
export default function DeleteModal({ device, onConfirmed, onClose }) {
  const { permissions, hasDelPass } = useAuth();
  const [pass, setPass] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const needPass = !!(permissions?.reqDelPass && hasDelPass);

  useEffect(() => { setPass(''); setErr(''); }, [device]);

  if (!device) return null;

  async function confirm() {
    setBusy(true);
    setErr('');
    try {
      if (needPass) {
        const ok = await verifyDeletePass(pass);
        if (!ok) {
          setErr('❌ كلمة المرور غلط');
          setPass('');
          setBusy(false);
          return;
        }
      }
      await onConfirmed(device);
      onClose();
    } catch (e) {
      setErr('❌ فشل الحذف: ' + (e.message || ''));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={!!device}
      onClose={onClose}
      icon="🗑️"
      title="تأكيد الحذف"
      description={`هتحذف "${device.model}"${device.code ? ` (#${device.code})` : ''}؟ مش هينفع ترجّعه.`}
      actions={
        <>
          <Button variant="plain" onClick={onClose} disabled={busy}>إلغاء</Button>
          <Button variant="danger" loading={busy} onClick={confirm}>
            {busy ? 'جاري الحذف...' : '🗑️ حذف'}
          </Button>
        </>
      }
    >
      {needPass && (
        <div className="space-y-2">
          <Input
            type="password"
            placeholder="كلمة سر الحذف"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && confirm()}
            autoFocus
          />
          {err && <p className="text-xs font-bold text-danger">{err}</p>}
        </div>
      )}
      {!needPass && err && (
        <p className="text-xs font-bold text-danger">{err}</p>
      )}
    </Modal>
  );
}
