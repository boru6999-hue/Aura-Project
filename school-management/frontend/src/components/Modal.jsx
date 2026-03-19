import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children, size = 'md' }) {
  const overlayRef = useRef();

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    // Lock body scroll
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  const handleBackdrop = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const sizeMap = { sm: 480, md: 560, lg: 720, xl: 960 };

  const modal = (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16,
        animation: 'fadeIn 0.18s ease both',
      }}
    >
      <div style={{
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 25px 60px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: sizeMap[size],
        maxHeight: '90vh',
        overflowY: 'auto',
        animation: 'scaleIn 0.18s ease both',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 24px', borderBottom: '1px solid #f1f5f9',
          position: 'sticky', top: 0, background: '#fff', borderRadius: '20px 20px 0 0', zIndex: 1,
        }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, color: '#0f172a', margin: 0 }}>{title}</h2>
          <button onClick={onClose} style={{
            width: 32, height: 32, borderRadius: '50%', border: 'none',
            background: 'transparent', cursor: 'pointer', fontSize: 20, fontWeight: 700,
            color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center',
            lineHeight: 1, transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}
          >×</button>
        </div>
        <div style={{ padding: 24 }}>{children}</div>
      </div>
    </div>
  );

  // Render directly into document.body — completely escapes any stacking context
  return createPortal(modal, document.body);
}
