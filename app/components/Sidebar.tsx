'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getWritings, getGenreCounts } from '../../lib/store';
import { GENRE_META, Genre, Writing } from '../../lib/types';
import { isAdmin, logout } from '../../lib/auth';

export default function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [writings, setWritings] = useState<Writing[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [admin, setAdmin] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    async function loadData() {
      const [w, c] = await Promise.all([getWritings(), getGenreCounts()]);
      setWritings(w);
      setCounts(c);
    }
    loadData();
    setAdmin(isAdmin());
    const saved = localStorage.getItem('jution_theme') as 'light' | 'dark' | null;
    if (saved) setTheme(saved);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('jution_theme', theme);
  }, [theme]);

  const recentWritings = useMemo(() => {
    return writings
      .filter((w) => w.published)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5);
  }, [writings]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return [];
    const q = search.toLowerCase();
    return writings.filter(
      (w) => w.title.toLowerCase().includes(q) || w.tags.some((t) => t.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [search, writings]);

  const genres = Object.entries(GENRE_META) as [Genre, typeof GENRE_META[Genre]][];

  const handleLogout = () => {
    logout();
    setAdmin(false);
    router.refresh();
  };

  return (
    <>
      <div className={`sidebar-overlay ${open ? 'open' : ''}`} onClick={onClose} />
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        {/* Logo */}
        <Link href="/" className="sidebar-logo" onClick={onClose}>
          <div style={{ width: 22, height: 22, background: 'var(--ink-deep)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--canvas)', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-sans)' }}>J</div>
          <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: '-0.02em', color: 'var(--ink-deep)' }}>Jution</span>
        </Link>

        {/* Search */}
        <input
          type="text"
          placeholder="Cari tulisan..."
          className="sidebar-search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {/* Search results */}
        {search.trim() && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Hasil Pencarian</div>
            {searchResults.length === 0 ? (
              <div style={{ padding: '4px 10px', fontSize: 12, color: 'var(--stone)' }}>
                Tidak ditemukan
              </div>
            ) : (
              searchResults.map((w) => (
                <Link
                  key={w.id}
                  href={`/read/${w.id}`}
                  className="sidebar-item"
                  onClick={() => { setSearch(''); onClose(); }}
                >
                  <span className="sidebar-item-emoji">{w.emoji}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.title}
                  </span>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Navigation */}
        {!search.trim() && (
          <>
            <div className="sidebar-section">
              <div className="sidebar-section-title">Navigasi</div>
              <Link
                href="/"
                className={`sidebar-item ${pathname === '/' ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-item-emoji">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                </span>
                Semua Tulisan
                <span className="sidebar-item-count">{writings.length}</span>
              </Link>
              {admin && (
                <Link
                  href="/write/new"
                  className={`sidebar-item ${pathname === '/write/new' ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-item-emoji">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </span>
                  Tulis Baru
                </Link>
              )}
              <Link
                href="/about"
                className={`sidebar-item ${pathname === '/about' ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="sidebar-item-emoji">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
                </span>
                Tentang
              </Link>
            </div>

            {/* Genre */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Genre</div>
              {genres.map(([key, meta]) => {
                const count = counts[key] || 0;
                if (count === 0) return null;
                return (
                  <Link
                    key={key}
                    href={`/?genre=${key}`}
                    className={`sidebar-item ${pathname === '/' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('genre') === key ? 'active' : ''}`}
                    onClick={onClose}
                  >
                    <span className="sidebar-item-emoji">{meta.emoji}</span>
                    {meta.label}
                    <span className="sidebar-item-count">{count}</span>
                  </Link>
                );
              })}
            </div>

            {/* Recent */}
            <div className="sidebar-section">
              <div className="sidebar-section-title">Terbaru</div>
              {recentWritings.map((w) => (
                <Link
                  key={w.id}
                  href={`/read/${w.id}`}
                  className={`sidebar-item ${pathname === `/read/${w.id}` ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <span className="sidebar-item-emoji">{w.emoji}</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {w.title}
                  </span>
                </Link>
              ))}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="sidebar-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%' }}>
            <button
              className="theme-toggle"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={theme === 'light' ? 'Dark mode' : 'Light mode'}
            >
              {theme === 'light' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>
              )}
            </button>
            {admin && <span className="admin-badge">Admin</span>}
            {admin && (
              <button className="btn-ghost" style={{ marginLeft: 'auto', fontSize: 11 }} onClick={handleLogout}>
                Keluar
              </button>
            )}
          </div>
          <span>© 2026 Jution</span>
        </div>
      </aside>
    </>
  );
}
