import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: '70vh', color: 'var(--stone)', textAlign: 'center',
      padding: '0 24px'
    }}>
      <div className="animate-fade-up">
        <h2 style={{ 
          fontSize: 64, fontWeight: 700, color: 'var(--ink-deep)', 
          letterSpacing: '-0.04em', marginBottom: 16, lineHeight: 1
        }}>
          404
        </h2>
        <p style={{ 
          fontSize: 18, color: 'var(--slate)', marginBottom: 32,
          maxWidth: 400, margin: '0 auto 32px', lineHeight: 1.6
        }}>
          Halaman yang Anda cari mungkin telah dihapus, dipindahkan, atau tidak pernah ada sama sekali.
        </p>
        <Link href="/" className="btn-primary" aria-label="Kembali ke Beranda">
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
