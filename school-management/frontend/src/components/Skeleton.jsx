export const SkeletonCard = () => (
  <div style={{ border:'1.5px solid #d0d7ed', padding:'20px', background:'#ffffff' }}>
    <div className="skeleton" style={{ height:9, width:'45%', marginBottom:12 }}/>
    <div className="skeleton" style={{ height:40, width:'65%', marginBottom:10 }}/>
    <div className="skeleton" style={{ height:2, width:'36%' }}/>
  </div>
);

export const SkeletonRow = () => (
  <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 0', borderBottom:'1px solid #e8ecf7' }}>
    <div className="skeleton" style={{ height:13, flex:1 }}/>
    <div className="skeleton" style={{ height:13, width:80 }}/>
    <div className="skeleton" style={{ height:13, width:60 }}/>
  </div>
);

export const SkeletonTable = ({ rows = 6, cols = 4 }) => (
  <div style={{ background:'#ffffff', border:'1.5px solid #d0d7ed' }}>
    {/* Header */}
    <div style={{ display:'flex', gap:16, padding:'11px 16px', borderBottom:'2px solid #0d1b3e', background:'#f4f6fb' }}>
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height:10, flex: i === 0 ? 2 : 1, opacity:0.5 }}/>
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} style={{ display:'flex', gap:16, padding:'12px 16px', borderBottom:'1px solid #e8ecf7', alignItems:'center' }}>
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className="skeleton" style={{ height:11, flex: c === 0 ? 2 : 1 }}/>
        ))}
      </div>
    ))}
  </div>
);
