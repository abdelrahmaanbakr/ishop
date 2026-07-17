import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { verifyDeletePass, archiveDevice } from '../lib/api';
import { useToast } from '../context/ToastContext';
import { printReceipt } from '../lib/receipt';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';

/**
 * مودال الأرشفة — خطوتين زي الأصل:
 *   1) كلمة السر (تظهر بس لو reqArchPass && hasDelPass)
 *   2) السبب: بيع (+ بيانات المشتري) أو مرتجع، + IMEI اختياري + طباعة
 */
export default function ArchiveModal({ device, onArchived, onClose }) {
  const { permissions, hasDelPass } = useAuth();
  const { show } = useToast();

  const needPass = !!(permissions?.reqArchPass && hasDelPass);
  const [step, setStep] = useState(needPass ? 'pass' : 'reason');

  const [pass, setPass] = useState('');
  const [passErr, setPassErr] = useState('');

  const [reason, setReason] = useState(''); // 'sold' | 'return'
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [wantImei, setWantImei] = useState(false);
  const [imei, setImei] = useState('');
  const [wantPrint, setWantPrint] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStep(needPass ? 'pass' : 'reason');
    setPass(''); setPassErr(''); setReason('');
    setBuyerName(''); setBuyerPhone(''); setWantImei(false);
    setImei(''); setWantPrint(false); setErr('');
  }, [device, needPass]);

  if (!device) return null;

  async function checkPass() {
    setPassErr('');
    const ok = await verifyDeletePass(pass);
    if (!ok) {
      setPassErr('❌ كلمة المرور غلط');
      setPass('');
      return;
    }
    setStep('reason');
  }

  async function confirm() {
    setErr('');
    if (!reason) return setErr('❗ اختر سبب الأرشفة');
    if (reason === 'sold' && !buyerName.trim()) return setErr('❗ اكتب اسم المشتري');
    if (wantImei && imei.trim().length !== 15) return setErr('❗ رقم IMEI لازم 15 رقم');

    setBusy(true);
    try {
      const res = await archiveDevice(device.sheetRow, {
        reason,
        buyerName: buyerName.trim(),
        buyerPhone: buyerPhone.trim(),
        imei: wantImei ? imei.trim() : '',
      });

      show('✅ تم الأرشفة بنجاح');

      if (wantPrint) {
        printReceipt({
          device,
          archiveReason: res.archiveReason,
          buyerName: reason === 'sold' ? buyerName.trim() : '',
          buyerPhone: reason === 'sold' ? buyerPhone.trim() : '',
          imei: wantImei ? imei.trim() : '',
          archiveDate: res.archiveDate,
        });
      }

      onArchived();
      onClose();
    } catch (e) {
      setErr('❌ فشل الأرشفة: ' + (e.message || ''));
    } finally {
      setBusy(false);
    }
  }

  const toggleCls = (active) =>
    `flex-1 rounded-xl border px-3 py-2.5 text-sm font-bold transition ${
      active
        ? 'border-accent bg-accent text-on-accent'
        : 'border-border bg-surface text-muted hover:text-text'
    }`;

  return (
    <Modal
      open={!!device}
      onClose={onClose}
      closeOnOverlay={false}
      icon="📦"
      title="أرشفة الجهاز"
      description={`📱 ${device.model}${device.code ? ` · #${device.code}` : ''}`}
    >
      {step === 'pass' ? (
        <div className="space-y-3">
          <Input
            type="password"
            placeholder="كلمة سر الأرشفة"
            value={pass}
            onChange={(e) => setPass(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && checkPass()}
            autoFocus
          />
          {passErr && <p className="text-xs font-bold text-danger">{passErr}</p>}
          <div className="flex gap-2">
            <Button className="flex-1" onClick={checkPass}>متابعة</Button>
            <Button variant="plain" onClick={onClose}>إلغاء</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 text-start">
          {/* السبب */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">سبب الأرشفة *</label>
            <div className="flex gap-2">
              <button type="button" className={toggleCls(reason === 'sold')}
                      onClick={() => setReason('sold')}>💰 تم البيع</button>
              <button type="button" className={toggleCls(reason === 'return')}
                      onClick={() => setReason('return')}>↩️ مرتجع للبائع</button>
            </div>
          </div>

          {/* بيانات المشتري — للبيع بس */}
          {reason === 'sold' && (
            <div className="space-y-3 rounded-2xl border border-border bg-surface/50 p-3">
              <Input label="اسم المشتري *" value={buyerName}
                     onChange={(e) => setBuyerName(e.target.value)} />
              <Input label="رقم المشتري" value={buyerPhone}
                     onChange={(e) => setBuyerPhone(e.target.value)} inputMode="tel" />
            </div>
          )}

          {/* IMEI اختياري */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">تسجيل IMEI؟</label>
            <div className="flex gap-2">
              <button type="button" className={toggleCls(wantImei)}
                      onClick={() => setWantImei(true)}>نعم</button>
              <button type="button" className={toggleCls(!wantImei)}
                      onClick={() => setWantImei(false)}>لا</button>
            </div>
            {wantImei && (
              <Input className="mt-2" placeholder="15 رقم" value={imei}
                     onChange={(e) => setImei(e.target.value)} inputMode="numeric" maxLength={15} />
            )}
          </div>

          {/* طباعة الإيصال */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-muted">طباعة إيصال؟</label>
            <div className="flex gap-2">
              <button type="button" className={toggleCls(wantPrint)}
                      onClick={() => setWantPrint(true)}>🖨️ نعم</button>
              <button type="button" className={toggleCls(!wantPrint)}
                      onClick={() => setWantPrint(false)}>لا</button>
            </div>
          </div>

          {err && (
            <p className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
              {err}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <Button className="flex-1" loading={busy} onClick={confirm}>
              {busy ? 'جاري الأرشفة...' : '📦 أرشفة'}
            </Button>
            <Button variant="plain" onClick={onClose} disabled={busy}>إلغاء</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
