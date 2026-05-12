'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getWritingById, getWritings, deleteWriting } from '../../../lib/store';
import { Writing, GENRE_META } from '../../../lib/types';
import { isAdmin } from '../../../lib/auth';

export default function ReaderPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [writing, setWriting] = useState<Writing | null>(null);
  const [progress, setProgress] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [related, setRelated] = useState<Writing[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    
    async function loadData() {
      const w = await getWritingById(id);
      if (w) {
        setWriting(w);
        // Get related (same genre, exclude current)
        const all = await getWritings();
        const filtered = all.filter((x) => x.published && x.id !== id && x.genre === w.genre);
        setRelated(filtered.slice(0, 3));
      }
    }
    
    loadData();
    setAdmin(isAdmin());
  }, [id]);

  useEffect(() => {
    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      if (total <= 0) { setProgress(100); return; }
      const scrolled = Math.abs(rect.top);
      setProgress(Math.min(100, (scrolled / total) * 100));
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDelete = () => {
    if (!writing) return;
    deleteWriting(writing.id);
    router.push('/');
  };

  if (!writing) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '80vh', color: 'var(--stone)',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
          <p>Tulisan tidak ditemukan.</p>
          <Link href="/" className="btn-ghost" style={{ marginTop: 12, display: 'inline-block' }}>
            ← Kembali
          </Link>
        </div>
      </div>
    );
  }

  const meta = GENRE_META[writing.genre];
  const paragraphs = writing.content.split('\n\n').filter(Boolean);
  const headings = paragraphs
    .map((para, i) => {
      if (/^BAB\s|^---/.test(para)) {
        return { id: `heading-${i}`, text: para.replace(/^---\s*/, '') };
      }
      return null;
    })
    .filter((h): h is { id: string; text: string } => Boolean(h));

  return (
    <>
      {/* Progress bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, height: 3, zIndex: 200,
        width: `${progress}%`, background: 'var(--ink-deep)',
        transition: 'width 0.15s ease-out',
      }} />

      {/* Top nav */}
      <header className="glass-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate)', fontWeight: 500, flexWrap: 'wrap' }}>
          <Link href="/" className="btn-ghost" style={{ fontSize: 13, padding: '4px 8px', marginLeft: -8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Semua
          </Link>
          <span style={{ color: 'var(--hairline-strong)' }}>/</span>
          <span style={{ color: 'var(--ink)' }}>{meta?.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => window.print()}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
            PDF
          </button>
          {admin && (
            <>
              <Link href={`/write/${writing.id}`} className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                Edit
              </Link>
              <button className="btn-secondary" style={{ fontSize: 12, padding: '6px 12px', color: '#e03131', borderColor: 'rgba(224,49,49,0.3)' }} onClick={() => setShowDelete(true)}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                Hapus
              </button>
            </>
          )}
        </div>
      </header>

      {/* Content */}
      <div style={{ display: 'flex', justifyContent: 'center', position: 'relative' }}>
        {/* Dynamic ToC */}
        {headings.length > 0 && (
          <aside className="toc-container animate-fade-up">
            <div className="toc-inner">
              <h3 className="toc-title">Daftar Isi</h3>
              <nav className="toc-nav">
                {headings.map((h) => (
                  <a
                    key={h.id}
                    href={`#${h.id}`}
                    className="toc-link"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(h.id);
                      if (el) {
                        const top = el.getBoundingClientRect().top + window.scrollY - 80;
                        window.scrollTo({ top, behavior: 'smooth' });
                      }
                    }}
                  >
                    {h.text}
                  </a>
                ))}
              </nav>
            </div>
          </aside>
        )}

        <div ref={contentRef} style={{ flex: 1, width: '100%' }}>
          <article className="reader-container">
            {/* Title */}
          <h1 className="linear-title animate-fade-up" style={{ marginBottom: 24 }}>
            {writing.title}
          </h1>

          {/* Meta */}
          <div className="animate-fade-up" style={{
            display: 'flex', gap: 12, alignItems: 'center',
            marginBottom: 48, flexWrap: 'wrap',
          }}>
            <span className="genre-badge" style={{ fontSize: 12, background: 'var(--canvas)', color: 'var(--ink)' }}>
              {meta?.label}
            </span>
            <span style={{ fontSize: 14, color: 'var(--stone)' }}>
              {writing.readTime} min baca
            </span>
            <span style={{ fontSize: 14, color: 'var(--hairline-strong)' }}>|</span>
            <span style={{ fontSize: 14, color: 'var(--stone)' }}>
              {new Date(writing.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric', month: 'long', year: 'numeric',
              })}
            </span>
          </div>

          {/* Body */}
          <div className="prose animate-fade-up">
            {paragraphs.map((para, i) => {
              if (/^BAB\s|^---/.test(para)) {
                return (
                  <h2 key={i} id={`heading-${i}`} style={{
                    fontSize: 14, fontWeight: 600, letterSpacing: '0.05em',
                    textTransform: 'uppercase', color: 'var(--slate)',
                    margin: '64px 0 32px', borderBottom: 'none', paddingBottom: 0
                  }}>
                    {para.replace(/^---\s*/, '')}
                  </h2>
                );
              }
              return (
                <p key={i}>
                  {para}
                </p>
              );
            })}
          </div>

          {/* Tags */}
          {writing.tags.length > 0 && (
            <div className="animate-fade-up" style={{
              marginTop: 64, display: 'flex', gap: 8, flexWrap: 'wrap',
              paddingTop: 32, borderTop: '1px solid var(--hairline)',
            }}>
              {writing.tags.map((tag) => (
                <span key={tag} className="tag-chip">{tag}</span>
              ))}
            </div>
          )}

          {/* Related */}
          {related.length > 0 && (
            <div className="animate-fade-up" style={{ marginTop: 48, paddingTop: 32 }}>
              <h3 style={{
                fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                color: 'var(--ink-deep)', marginBottom: 16,
              }}>
                Tulisan Terkait
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {related.map((r) => (
                  <Link key={r.id} href={`/read/${r.id}`} className="notion-row">
                    <span className="notion-row-title">{r.title}</span>
                    <span className="notion-row-meta">{r.readTime} min</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </article>
        </div>
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="modal-backdrop" onClick={() => setShowDelete(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: 'var(--ink-deep)' }}>
              Hapus tulisan?
            </h3>
            <p style={{ fontSize: 14, color: 'var(--slate)', marginBottom: 24, lineHeight: 1.5 }}>
              Tindakan ini tidak bisa dibatalkan. Tulisan &ldquo;{writing.title}&rdquo; akan dihapus permanen.
            </p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => setShowDelete(false)}>
                Batal
              </button>
              <button
                className="btn-primary"
                style={{ flex: 1, background: '#e03131', color: '#fff', borderColor: '#e03131', boxShadow: 'none' }}
                onClick={handleDelete}
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
