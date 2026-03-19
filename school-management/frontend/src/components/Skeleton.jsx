export function SkeletonRow({ cols = 5 }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} style={{ padding:'12px 14px' }}>
          <div className="skeleton" style={{ height:14, width:`${55 + Math.random()*35}%`, borderRadius:6 }} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard() {
  return (
    <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:16, padding:'18px 20px' }}>
      <div className="skeleton" style={{ height:12, width:'40%', marginBottom:12 }} />
      <div className="skeleton" style={{ height:28, width:'60%', marginBottom:10 }} />
      <div className="skeleton" style={{ height:10, width:'80%' }} />
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 5 }) {
  return (
    <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.06)', borderRadius:20, overflow:'hidden' }}>
      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead>
            <tr>
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} style={{ padding:'10px 14px', background:'#1a2338', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>
                  <div className="skeleton" style={{ height:10, width:60, borderRadius:4 }} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} cols={cols} />)}
          </tbody>
        </table>
      </div>
    </div>
  );
}
