'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { login } from '../../lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await login(email, password);
    setLoading(false);
    
    if (success) {
      router.push('/');
      router.refresh();
    } else {
      setError(true);
      setTimeout(() => setError(false), 3000);
    }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      minHeight: '80vh', gap: 0,
    }}>
      <div className="animate-fade-up" style={{
        padding: '48px 40px 40px',
        borderRadius: 'var(--r-card)',
        border: '1px solid var(--hairline)',
        background: 'var(--surface)',
        boxShadow: 'var(--shadow-lg)',
        width: 380,
        maxWidth: '90vw',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: 16, filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }}>🔒</div>
        <h1 style={{
          fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em',
          color: 'var(--ink-deep)', marginBottom: 6,
        }}>
          Masuk sebagai Admin
        </h1>
        <p style={{ fontSize: 14, color: 'var(--stone)', marginBottom: 28, lineHeight: 1.5 }}>
          Masukkan kredensial Anda untuk mengelola tulisan.
        </p>
        <form onSubmit={handleLogin} aria-label="Form login admin" style={{
          display: 'flex', flexDirection: 'column', gap: 12,
        }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="login-input"
            autoFocus
            required
            autoComplete="email"
            aria-label="Email"
            style={{ width: '100%' }}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="login-input"
            required
            autoComplete="current-password"
            aria-label="Password"
            style={{ width: '100%' }}
          />
          {error && (
            <p className="animate-fade-up" style={{ fontSize: 13, color: '#e03131', textAlign: 'center', margin: '4px 0' }}>
              Email atau password salah.
            </p>
          )}
          <button type="submit" className="btn-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1, marginTop: 4 }} disabled={loading}>
            {loading ? 'Masuk...' : 'Masuk'}
          </button>
        </form>
        <Link href="/" style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          marginTop: 20, fontSize: 13, color: 'var(--stone)',
          textDecoration: 'none', transition: 'color 0.2s',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
