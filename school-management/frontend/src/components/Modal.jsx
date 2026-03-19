import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function Modal({ title, onClose, children, size = 'md' }) {
  const overlayRef = useRef();
  const sizeMap = { sm:480, md:560, lg:720, xl:960 };

  useEffect(() => {
    const onKey = (e) => { if(e.key==='Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [onClose]);

  return createPortal(
    <div ref={overlayRef} onClick={e=>{if(e.target===overlayRef.current)onClose();}}
      style={{
        position:'fixed',inset:0,zIndex:9999,
        background:'rgba(5,8,18,0.75)', backdropFilter:'blur(4px)',
        display:'flex',alignItems:'center',justifyContent:'center',padding:20,
        animation:'fadeIn 0.18s ease both',
      }}>
      <div style={{
        background:'#0f1525', borderRadius:20,
        border:'1px solid rgba(255,255,255,0.1)',
        boxShadow:'0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.05)',
        width:'100%', maxWidth:sizeMap[size], maxHeight:'90vh', overflowY:'auto',
        animation:'scaleIn 0.2s ease both',
      }}>
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'16px 22px', borderBottom:'1px solid rgba(255,255,255,0.07)',
          position:'sticky',top:0,background:'#0f1525',borderRadius:'20px 20px 0 0',zIndex:1,
        }}>
          <h2 style={{fontWeight:800,fontSize:16,color:'#e8eaf0',margin:0,letterSpacing:'-0.01em'}}>{title}</h2>
          <button onClick={onClose} style={{
            width:30,height:30,borderRadius:8,border:'none',
            background:'transparent',cursor:'pointer',fontSize:18,fontWeight:700,
            color:'rgba(255,255,255,0.3)',display:'flex',alignItems:'center',justifyContent:'center',
            transition:'all 0.12s', fontFamily:'Syne, sans-serif',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='rgba(255,255,255,0.08)';e.currentTarget.style.color='rgba(255,255,255,0.8)';}}
            onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.color='rgba(255,255,255,0.3)';}}
          >×</button>
        </div>
        <div style={{padding:'20px 22px 24px'}}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
