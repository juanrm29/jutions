import { SkeletonRow } from './components/SkeletonLoader';

export default function Loading() {
  return (
    <div className="page-container animate-fade-up" style={{ padding: '40px 0' }}>
      <div style={{ marginBottom: 40 }}>
        <div style={{ height: 48, width: 240, background: 'var(--surface-hover)', borderRadius: 8, marginBottom: 12 }}></div>
        <div style={{ height: 20, width: 120, background: 'var(--surface-hover)', borderRadius: 4 }}></div>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
        <SkeletonRow />
      </div>
    </div>
  );
}
