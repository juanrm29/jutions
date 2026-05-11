'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
      minHeight: '80vh', gap: 16,
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>🔒</div>
      <h1 style={{
        fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px',
        color: 'var(--ink-deep)',
      }}>
        Admin Login
      </h1>
      <p style={{ fontSize: 14, color: 'var(--stone)', marginBottom: 8 }}>
        Masukkan email dan password admin Anda.
      </p>
      <form onSubmit={handleLogin} style={{
        display: 'flex', flexDirection: 'column', gap: 12,
        width: 280,
      }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="login-input"
          autoFocus
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="login-input"
          required
        />
        {error && (
          <p style={{ fontSize: 13, color: '#e03131', textAlign: 'center' }}>
            Email atau password salah.
          </p>
        )}
        <button type="submit" className="btn-primary" style={{ width: '100%', opacity: loading ? 0.7 : 1 }} disabled={loading}>
          {loading ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}
