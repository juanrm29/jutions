'use client';

import { useState, useEffect, useMemo, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { getWritings } from '../lib/store';
import { Writing, Genre, GENRE_META } from '../lib/types';
import { isAdmin } from '../lib/auth';
import DailyPrompt from './components/DailyPrompt';
import ScrollReveal from './components/ScrollReveal';
import { SkeletonRow, SkeletonCard } from './components/SkeletonLoader';

const GENRE_COLORS: Record<string, string> = {
  novel: 'rgba(225, 29, 72, 0.06)',
  cerpen: 'rgba(37, 99, 235, 0.06)',
  jurnal: 'rgba(22, 163, 74, 0.06)',
  esai: 'rgba(37, 99, 235, 0.06)',
  puisi: 'rgba(147, 51, 234, 0.06)',
  lainnya: 'rgba(0, 0, 0, 0.03)',
};

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
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [sort, setSort] = useState<SortMode>('newest');
  const [genre, setGenre] = useState<'all' | Genre>(genreParam || 'all');
  const [search, setSearch] = useState('');
  const [admin, setAdmin] = useState(false);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const [typewriterCount, setTypewriterCount] = useState('');
  const [typewriterDone, setTypewriterDone] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    getWritings().then(data => {
      setWritings(data);
      setLoading(false);
      // Typewriter effect for count
      const pubCount = data.filter(w => w.published).length;
      const text = `${pubCount} tulisan`;
      let i = 0;
      const interval = setInterval(() => {
        setTypewriterCount(text.slice(0, i + 1));
        i++;
        if (i >= text.length) {
          clearInterval(interval);
          setTimeout(() => setTypewriterDone(true), 600);
        }
      }, 60);
    });
    setAdmin(isAdmin());
  }, []);

  // Magnetic title parallax
  const handleTitleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!titleRef.current) return;
    const rect = titleRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / rect.width;
    const y = (e.clientY - rect.top - rect.height / 2) / rect.height;
    titleRef.current.style.transform = `translate(${x * 8}px, ${y * 4}px)`;
  }, []);
  const handleTitleMouseLeave = useCallback(() => {
    if (titleRef.current) titleRef.current.style.transform = 'translate(0, 0)';
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

  const handleMouseMove = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    if (view !== 'card') return;
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const tiltX = ((y - centerY) / centerY) * -5;
    const tiltY = ((x - centerX) / centerX) * 5;
    
    card.style.setProperty('--tilt-x', `${tiltY}deg`);
    card.style.setProperty('--tilt-y', `${tiltX}deg`);
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (view !== 'card') return;
    const card = e.currentTarget;
    card.style.setProperty('--tilt-x', `0deg`);
    card.style.setProperty('--tilt-y', `0deg`);
  };

  return (
    <div className="page-container">
      {/* Genre color pulse background */}
      <div
        className={`genre-pulse-bg ${hoveredGenre ? 'active' : ''}`}
        style={{
          background: hoveredGenre && hoveredGenre !== 'all'
            ? `radial-gradient(ellipse at 50% 0%, ${GENRE_COLORS[hoveredGenre] || 'transparent'}, transparent 70%)`
            : 'transparent',
        }}
      />

      {/* Animated gradient mesh hero */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '40vh',
        background: 'radial-gradient(circle at 15% 50%, rgba(225, 29, 72, 0.05), transparent 50%), radial-gradient(circle at 85% 30%, rgba(37, 99, 235, 0.05), transparent 50%)',
        zIndex: -1, pointerEvents: 'none',
        filter: 'blur(40px)',
      }} />

      {/* Page header */}
      <div
        className="animate-fade-up"
        style={{ marginBottom: 40, position: 'relative' }}
        onMouseMove={handleTitleMouseMove}
        onMouseLeave={handleTitleMouseLeave}
      >
        <h1 ref={titleRef} className="linear-title magnetic-title" style={{ marginBottom: 8 }}>
          Semua Tulisan
        </h1>
        <p className={`typewriter-cursor ${typewriterDone ? 'done' : ''}`} style={{ fontSize: 15, color: 'var(--stone)', fontWeight: 400 }}>
          {typewriterCount || '\u00a0'}
        </p>
      </div>

      {admin && <DailyPrompt />}

      {/* Controls bar — two rows */}
      <ScrollReveal className="animate-fade-up" style={{ marginBottom: 32 }}>
        {/* Row 1: search + sort + view */}
        <div className="controls-row1" style={{
          display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10,
        }}>
          {/* Search */}
          <input
            type="text"
            placeholder="Cari tulisan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="controls-search"
            style={{
              padding: '8px 14px', borderRadius: 'var(--r-sm)',
              border: '1px solid var(--hairline)',
              fontSize: 13, background: 'var(--canvas)',
              color: 'var(--ink)', outline: 'none',
              fontFamily: 'var(--font-sans)', width: 220,
              boxShadow: 'var(--shadow-sm)',
              transition: 'all 0.2s ease', flexShrink: 0,
            }}
            onFocus={(e) => e.target.style.borderColor = 'var(--stone)'}
            onBlur={(e) => e.target.style.borderColor = 'var(--hairline)'}
          />

          <div style={{ flex: 1 }} />

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
              boxShadow: 'var(--shadow-sm)', flexShrink: 0,
            }}
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
            <option value="alpha">A-Z</option>
            <option value="genre">Genre</option>
          </select>

          {/* View toggle */}
          <div className="view-toggle" style={{ flexShrink: 0 }}>
            <button
              className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
              onClick={() => setView('list')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
            </button>
            <button
              className={`view-toggle-btn ${view === 'card' ? 'active' : ''}`}
              onClick={() => setView('card')}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
          </div>
        </div>

        {/* Row 2: genre pills — single scrollable row */}
        <div
          className="genre-pills"
          style={{
            display: 'flex', gap: 6,
            flexWrap: 'nowrap', overflowX: 'auto',
            scrollbarWidth: 'none', paddingBottom: 2,
          }}
        >
          {genres.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g)}
              onMouseEnter={() => g !== 'all' && setHoveredGenre(g)}
              onMouseLeave={() => setHoveredGenre(null)}
              className={`genre-pill-animated ${genre === g ? 'view-toggle-btn active active-pill' : 'view-toggle-btn'}`}
              style={{
                borderRadius: 'var(--r-full)',
                border: '1px solid var(--hairline)',
                fontSize: 12, padding: '4px 14px',
                whiteSpace: 'nowrap', flexShrink: 0,
                ...(genre === g && g !== 'all' ? { color: `var(--genre-${g})`, borderColor: `var(--genre-${g})` } : {})
              }}
            >
              {g === 'all' ? 'Semua' : GENRE_META[g].label}
            </button>
          ))}
        </div>
      </ScrollReveal>

      {/* Loading Skeleton */}
      {loading && view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <SkeletonRow />
          <SkeletonRow />
          <SkeletonRow />
        </div>
      )}

      {loading && view === 'card' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16, marginTop: 16,
        }}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <div className="animate-fade-up" style={{
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
      {!loading && filtered.length > 0 && view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {filtered.map((w, i) => (
            <ScrollReveal key={w.id} className={`stagger-${Math.min((i % 8) + 1, 8)}`}>
              <Link
                href={`/read/${w.id}`}
                className="notion-row animate-fade-up"
                style={{ '--row-genre-color': `var(--genre-${w.genre})` } as React.CSSProperties}
              >
                <span className="notion-row-title">{w.title}</span>
                <span className="genre-badge" style={{ fontSize: 11, background: 'transparent', color: `var(--genre-${w.genre})`, borderColor: `var(--genre-${w.genre})` }}>
                  {GENRE_META[w.genre]?.label}
                </span>
                <span className="notion-row-meta" style={{ flex: '1 1 auto', textAlign: 'right' }}>
                  {w.readTime} min
                </span>
                <span className="notion-row-meta" style={{ textAlign: 'right' }}>
                  {new Date(w.createdAt).toLocaleDateString('id-ID', {
                    day: 'numeric', month: 'short', year: 'numeric',
                  })}
                </span>
                {!w.published && (
                  <span style={{ fontSize: 11, color: 'var(--stone)', fontStyle: 'italic', paddingLeft: 8 }}>draft</span>
                )}
              </Link>
            </ScrollReveal>
          ))}
        </div>
      )}

      {/* Card view */}
      {!loading && filtered.length > 0 && view === 'card' && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16, marginTop: 16,
        }}>
          {filtered.map((w, i) => (
            <ScrollReveal key={w.id} className={`stagger-${Math.min((i % 8) + 1, 8)}`}>
              <Link 
                href={`/read/${w.id}`} 
                className="writing-card tilt-card card-spring-enter"
                onMouseMove={(e) => {
                  handleMouseMove(e, w.id);
                  // Spotlight glow tracking
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;
                  e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
                  e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
                }}
                onMouseLeave={handleMouseLeave}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Genre accent strip */}
                <div className="card-genre-strip" style={{ '--card-genre-color': `var(--genre-${w.genre})` } as React.CSSProperties} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <span className="genre-badge" style={{ fontSize: 11, background: 'var(--canvas)', color: `var(--genre-${w.genre})`, borderColor: `var(--genre-${w.genre})` }}>
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
            </ScrollReveal>
          ))}
        </div>
      )}
    </div>
  );
}
