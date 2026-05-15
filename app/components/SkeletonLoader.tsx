export function SkeletonCard() {
  return (
    <div className="writing-card skeleton" style={{ minHeight: 180 }}>
      {/* Skeleton shapes can be refined via CSS classes, but here we just use the animated background for the whole card */}
      <div style={{ height: 20, width: '60%', background: 'rgba(0,0,0,0.05)', borderRadius: 4, marginBottom: 12 }}></div>
      <div style={{ height: 12, width: '80%', background: 'rgba(0,0,0,0.05)', borderRadius: 4, marginBottom: 8 }}></div>
      <div style={{ height: 12, width: '40%', background: 'rgba(0,0,0,0.05)', borderRadius: 4, marginTop: 'auto' }}></div>
    </div>
  );
}

export function SkeletonRow() {
  return (
    <div className="notion-row skeleton" style={{ padding: '16px 14px' }}>
      <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(0,0,0,0.05)' }}></div>
      <div style={{ flex: 1, height: 14, background: 'rgba(0,0,0,0.05)', borderRadius: 4, margin: '0 12px' }}></div>
      <div style={{ width: 80, height: 12, background: 'rgba(0,0,0,0.05)', borderRadius: 4 }}></div>
    </div>
  );
}
