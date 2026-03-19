import { useState, createContext, useContext, useCallback } from 'react';

const ToastContext = createContext(null);

const CONFIGS = {
  success: { icon:'✓', color:'#6bcb77', bg:'rgba(107,203,119,0.1)', border:'rgba(107,203,119,0.25)' },
  error:   { icon:'✕', color:'#ff6b6b', bg:'rgba(255,107,107,0.1)', border:'rgba(255,107,107,0.25)' },
  info:    { icon:'i', color:'#00d4ff', bg:'rgba(0,212,255,0.08)',   border:'rgba(0,212,255,0.2)' },
  warning: { icon:'!', color:'#ffd93d', bg:'rgba(255,217,61,0.1)',   border:'rgba(255,217,61,0.25)' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const show = useCallback((message, type = 'success', duration = 3500) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
  }, []);
  const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <div style={{ position:'fixed', top:16, right:16, zIndex:10000, display:'flex', flexDirection:'column', gap:8, pointerEvents:'none' }}>
        {toasts.map(t => {
          const cfg = CONFIGS[t.type] || CONFIGS.info;
          return (
            <div key={t.id} style={{
              display:'flex', alignItems:'center', gap:10, padding:'11px 14px',
              background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:12,
              boxShadow:'0 8px 32px rgba(0,0,0,0.6)', pointerEvents:'auto',
              minWidth:240, maxWidth:340, animation:'slideDown 0.28s ease both',
              backdropFilter:'blur(10px)',
            }}>
              <div style={{ width:20,height:20,borderRadius:6,background:`${cfg.color}25`,border:`1px solid ${cfg.color}50`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:10,fontWeight:900,color:cfg.color,flexShrink:0 }}>{cfg.icon}</div>
              <span style={{ flex:1, fontSize:13, fontWeight:600, color:'#e8eaf0', fontFamily:'Syne, sans-serif' }}>{t.message}</span>
              <button onClick={() => remove(t.id)} style={{ border:'none',background:'none',cursor:'pointer',color:'rgba(255,255,255,0.25)',fontSize:14,padding:'0 2px',fontWeight:700,lineHeight:1 }}>✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
