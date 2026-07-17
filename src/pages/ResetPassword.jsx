import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

/** auth.js:683 — 8 حروف على الأقل + تطابق، وبعد الحفظ الجلسة المؤقتة تتقفل */
export default function ResetPassword({ open, onDone }) {
  const { show } = useToast();
  const [p1, setP1] = useState('');
  const [p2, setP2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit() {
    setErr('');
    if (p1.length < 8) return setErr('❗ كلمة السر لازم 8 حروف على الأقل');
    if (p1 !== p2) return setErr('❗ كلمتا السر مش متطابقتين');

    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: p1 });
      if (error) throw error;

      // نقفل الجلسة المؤقتة ونخلّيه يدخل بكلمة السر الجديدة
      await supabase.auth.signOut();
      show('✅ اتغيّرت كلمة السر — سجّل دخولك بيها');
      onDone();
    } catch (e) {
      setErr('❌ فشل الحفظ: ' + (e.message || 'حاول تاني'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {}}
      closeOnOverlay={false}
      icon="🔑"
      title="تعيين كلمة سر جديدة"
      description="8 حروف على الأقل"
      actions={
        <Button className="w-full" loading={busy} onClick={submit}>
          {busy ? 'جاري الحفظ...' : 'حفظ كلمة السر'}
        </Button>
      }
    >
      <div className="space-y-3">
        <Input
          type="password"
          placeholder="كلمة السر الجديدة"
          value={p1}
          onChange={(e) => setP1(e.target.value)}
          autoComplete="new-password"
        />
        <Input
          type="password"
          placeholder="تأكيد كلمة السر"
          value={p2}
          onChange={(e) => setP2(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          autoComplete="new-password"
        />
        {err && (
          <p className="rounded-xl bg-danger/10 px-3 py-2 text-center text-xs font-bold text-danger">
            {err}
          </p>
        )}
      </div>
    </Modal>
  );
}
