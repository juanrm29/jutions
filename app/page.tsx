'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getWritings } from '../lib/store';
import { Writing, Genre, GENRE_META } from '../lib/types';
import { isAdmin } from '../lib/auth';

type SortMode = 'newest' | 'oldest' | 'alpha' | 'genre';
type ViewMode = 'list' | 'card';

export default function Home() {
  return (
    <Suspense fallback={<div style={{ padding: 40, color: 'var(--stone)' }}>Memuat...</div>}>
      <HomeContent />
    </Suspense>
  );
}

function HomeContent() {
  const searchParams = useSearchParams();
  const genreParam = searchParams.get('genre') as Genre | null;

  const [writings, setWritings] = useState<Writing[]>([]);
  const [view, setView] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('newest');
  const [genre, setGenre] = useState<'all' | Genre>(genreParam || 'all');
  const [search, setSearch] = useState('');
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    getWritings().then(setWritings);
    setAdmin(isAdmin());
  }, []);

  useEffect(() => {
    if (genreParam) setGenre(genreParam);
  }, [genreParam]);

  const filtered = useMemo(() => {
    let result = writings.filter((w) => w.published || admin);
    if (genre !== 'all') result = result.filter((w) => w.genre === genre);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (w) =>
          w.title.toLowerCase().includes(q) ||
          w.excerpt.toLowerCase().includes(q) ||
          w.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    switch (sort) {
      case 'oldest':
        result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'alpha':
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'genre':
        result.sort((a, b) => a.genre.localeCompare(b.genre));
        break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return result;
  }, [writings, genre, search, sort, admin]);

  const genres: ('all' | Genre)[] = ['all', 'novel', 'cerpen', 'jurnal', 'esai', 'puisi', 'lainnya'];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '64px 32px 120px' }}>
      {/* Page header */}
      <div className="animate-fade-up" style={{ marginBottom: 40 }}>
        <h1 className="linear-title" style={{ marginBottom: 8 }}>
          Semua Tulisan
        </h1>
        <p style={{ fontSize: 15, color: 'var(--stone)', fontWeight: 400 }}>
          {writings.filter((w) => w.published).length} tulisan
        </p>
      </div>

      {/* Controls bar */}
      <div className="animate-fade-up" style={{
        display: 'flex', gap: 12, alignItems: 'center',
        marginBottom: 32, flexWrap: 'wrap',
      }}>
        {/* Search */}
        <input
          type="text"
          placeholder="Cari..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '8px 14px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hairline)',
            fontSize: 13, background: 'var(--canvas)',
            color: 'var(--ink)', outline: 'none',
            fontFamily: 'var(--font-sans)', width: 220,
            boxShadow: 'var(--shadow-sm)',
            transition: 'all 0.2s ease',
          }}
          onFocus={(e) => e.target.style.borderColor = 'var(--stone)'}
          onBlur={(e) => e.target.style.borderColor = 'var(--hairline)'}
        />

        {/* Genre pills */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              className={genre === g ? 'view-toggle-btn active' : 'view-toggle-btn'}
              style={{ borderRadius: 'var(--r-full)', border: '1px solid var(--hairline)', fontSize: 12, padding: '4px 12px' }}
            >
              {g === 'all' ? 'Semua' : GENRE_META[g].label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          style={{
            padding: '8px 12px', borderRadius: 'var(--r-sm)',
            border: '1px solid var(--hairline)',
            fontSize: 13, background: 'var(--canvas)',
            color: 'var(--ink)', fontFamily: 'var(--font-sans)',
            outline: 'none', cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <option value="newest">Terbaru</option>
          <option value="oldest">Terlama</option>
          <option value="alpha">A-Z</option>
          <option value="genre">Genre</option>
        </select>

        {/* View toggle */}
        <div className="view-toggle">
          <button
            className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
          </button>
          <button
            className={`view-toggle-btn ${view === 'card' ? 'active' : ''}`}
            onClick={() => setView('card')}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </button>
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '100px 0',
          color: 'var(--stone)',
        }}>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--ink)', marginBottom: 8 }}>
            Belum ada tulisan
          </p>
          <p style={{ fontSize: 14, marginBottom: 24, color: 'var(--slate)' }}>
            Mulai dari satu kalimat.
          </p>
          {admin && (
            <Link href="/write/new" className="btn-primary">
              Tulis Sekarang
            </Link>
          )}
        </div>
      )}

      {/* List view */}
      {filtered.length > 0 && view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((w) => (
            <Link
              key={w.id}
              href={`/read/${w.id}`}
              className="notion-row"
            >
              <span className="notion-row-title">{w.title}</span>
              <span className="genre-badge" style={{ fontSize: 11, background: 'transparent' }}>
                {GENRE_META[w.genre]?.label}
              </span>
              <span className="notion-row-meta" style={{ minWidth: 60, textAlign: 'right' }}>
                {w.readTime} min
              </span>
              <span className="notion-row-meta" style={{ minWidth: 100, textAlign: 'right' }}>
                {new Date(w.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric', month: 'short', year: 'numeric',
                })}
              </span>
              {!w.published && (
                <span style={{ fontSize: 11, color: 'var(--stone)', fontStyle: 'italic', paddingLeft: 8 }}>draft</span>
              )}
            </Link>
          ))}
        </div>
      )}

      {/* Card view */}
      {filtered.length > 0 && view === 'card' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16, marginTop: 16,
        }}>
          {filtered.map((w) => (
            <Link key={w.id} href={`/read/${w.id}`} className="writing-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <span className="genre-badge" style={{ fontSize: 11, background: 'var(--canvas)' }}>
                  {GENRE_META[w.genre]?.label}
                </span>
                <span style={{ fontSize: 12, color: 'var(--stone)', marginLeft: 'auto' }}>
                  {w.readTime} min
                </span>
              </div>
              <h3 style={{
                fontSize: 16, fontWeight: 600, color: 'var(--ink-deep)',
                letterSpacing: '-0.02em', marginBottom: 8, lineHeight: 1.4,
              }}>
                {w.title}
              </h3>
              <p style={{
                fontSize: 14, color: 'var(--slate)', lineHeight: 1.6,
                display: '-webkit-box', WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
                flex: 1,
              }}>
                {w.excerpt}
              </p>
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--hairline)', fontSize: 12, color: 'var(--stone)', display: 'flex', justifyContent: 'space-between' }}>
                <span>
                  {new Date(w.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'long', year: 'numeric',
                  })}
                </span>
                {!w.published && <span style={{ fontStyle: 'italic' }}>Draft</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
