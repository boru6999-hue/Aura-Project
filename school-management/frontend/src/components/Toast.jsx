import { createContext, useContext, useState, useCallback, useEffect } from 'react'

const ToastCtx = createContext(null)

function ToastItem({ message, type, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t) }, [onClose])
  const cls = type === 'success' ? 'toast-ok' : type === 'error' ? 'toast-err' : 'toast-info'
  const sym = type === 'success' ? '✓' : type === 'error' ? '✕' : 'i'
  return (
    <div className={`toast-item ${cls}`}>
      <span style={{ fontFamily:'Barlow Condensed,sans-serif', fontWeight:900, fontSize:15, flexShrink:0 }}>{sym}</span>
      <span style={{ flex:1 }}>{message}</span>
      <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'inherit', fontWeight:700, fontSize:13 }}>✕</button>
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const show = useCallback((message, type = 'info') => {
    setToasts(p => [...p, { id: Date.now(), message, type }])
  }, [])
  const remove = useCallback(id => setToasts(p => p.filter(t => t.id !== id)), [])

  return (
    <ToastCtx.Provider value={{ show }}>
      {children}
      <div className="toast-wrap">
        {toasts.map(t => <ToastItem key={t.id} {...t} onClose={() => remove(t.id)} />)}
      </div>
    </ToastCtx.Provider>
  )
}

export const useToast = () => useContext(ToastCtx)
