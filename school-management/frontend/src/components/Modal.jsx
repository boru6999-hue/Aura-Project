export default function Modal({ title, onClose, children, wide }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box anim-fade" style={{ maxWidth: wide ? 680 : 500 }}>
        <div className="modal-head">
          <span className="modal-head-title">{title}</span>
          <button className="modal-close" onClick={onClose}>✕ ХААХ</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  )
}
