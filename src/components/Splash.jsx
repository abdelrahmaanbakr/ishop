import { useEffect, useState } from 'react';

// نفس التوقيتات الأصلية: يظهر 2 ثانية، يتلاشى، يتشال بعد 700ms
export default function Splash() {
  const [hiding, setHiding] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setHiding(true), 2000);
    const t2 = setTimeout(() => setGone(true), 2700);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (gone) return null;

  return (
    <div className={`splash-screen${hiding ? ' hide' : ''}`} aria-hidden="true">
      <div className="splash-logo">
        i<span>Shop</span>
      </div>
      <div className="splash-tagline">نظام الأجهزة المستعملة</div>
      <div className="splash-bar">
        <div className="splash-bar-fill" />
      </div>
    </div>
  );
}
