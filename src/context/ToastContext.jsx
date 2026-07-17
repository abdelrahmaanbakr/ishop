import { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

// نفس ألوان v4.5.1
const STYLES = {
  success: { bg: 'linear-gradient(135deg,#2ecc71,#27ae60)', icon: '✅' },
  error:   { bg: 'linear-gradient(135deg,#e74c3c,#c0392b)', icon: '⚠️' },
  info:    { bg: 'linear-gradient(135deg,#3498db,#2980b9)', icon: 'ℹ️' },
};

const DURATION = 3300; // مطابق لـ toastProg في الـ CSS

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [visible, setVisible] = useState(false);

  const show = useCallback((message, type = 'success') => {
    setToast({ message, type, key: Date.now() });
  }, []);

  const showError = useCallback((message) => show(message, 'error'), [show]);

  useEffect(() => {
    if (!toast) return;
    // frame واحد قبل إضافة .show عشان الـ transition يشتغل
    const raf = requestAnimationFrame(() => setVisible(true));
    const t1 = setTimeout(() => setVisible(false), DURATION);
    const t2 = setTimeout(() => setToast(null), DURATION + 400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [toast?.key]);

  const style = STYLES[toast?.type] ?? STYLES.success;

  return (
    <ToastContext.Provider value={{ show, showError }}>
      {children}
      {toast && (
        <div
          className={`toast${visible ? ' show' : ''}`}
          style={{ background: style.bg }}
          role="status"
          aria-live="polite"
        >
          <div className="toast-text">
            <span aria-hidden="true">{style.icon}</span>
            <span>{toast.message}</span>
          </div>
          <div className="toast-progress">
            <div className="toast-progress-bar" />
          </div>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast لازم يتنادى جوّه ToastProvider');
  return ctx;
}
