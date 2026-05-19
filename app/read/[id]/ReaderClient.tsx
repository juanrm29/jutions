'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { getWritingById, getWritings, deleteWriting } from '../../../lib/store';
import { Writing, GENRE_META } from '../../../lib/types';
import { isAdmin } from '../../../lib/auth';
import TypographyPanel from '../../components/TypographyPanel';
import ScrollReveal from '../../components/ScrollReveal';

export default function ReaderClient({ id, initialData }: { id: string, initialData?: Writing | null }) {
  const router = useRouter();

  const [writing, setWriting] = useState<Writing | null>(initialData || null);
  const [progress, setProgress] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [related, setRelated] = useState<Writing[]>([]);
  const [immersive, setImmersive] = useState(false);
  const [activeHeading, setActiveHeading] = useState<string>('');
  const [spotlight, setSpotlight] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  const { modifiedContent, headings } = useMemo(() => {
    if (!writing?.content) return { modifiedContent: '', headings: [] };
    
    let html = writing.content;
    if (!html.includes('<p>') && !html.includes('<h1>') && !html.includes('<h2>') && !html.includes('<h3>')) {
      html = html.split('\n\n').filter(Boolean).map((p) => {
        if (/^BAB\s|^---/.test(p)) {
          return `<h2>${p.replace(/^---\s*/, '')}</h2>`;
        }
        return `<p>${p.replace(/\n/g, '<br>')}</p>`;
      }).join('');
    }

    const extracted: {id: string, text: string}[] = [];
    let i = 0;
    const modified = html.replace(/<h([1-3])([^>]*)>(.*?)<\/h\1>/gi, (match, level, attrs, text) => {
      const id = `heading-${i}`;
      extracted.push({ id, text: text.replace(/<[^>]+>/g, '') });
      i++;
      let extraAttrs = '';
      if (level === '2') {
         extraAttrs = ' style="font-size: 14px; font-weight: 600; letter-spacing: 0.05em; text-transform: uppercase; color: var(--slate); margin: 64px 0 32px; border-bottom: none; padding-bottom: 0;"';
      }
      return `<h${level} id="${id}"${attrs}${extraAttrs}>${text}</h${level}>`;
    });

    return { modifiedContent: modified, headings: extracted };
  }, [writing?.content]);

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
    if (immersive) {
      document.body.classList.add('reader-mode');
    } else {
      document.body.classList.remove('reader-mode');
    }
    return () => document.body.classList.remove('reader-mode');
  }, [immersive]);

  useEffect(() => {
    if (!writing) return;
    
    // Restore scroll
    const savedScroll = localStorage.getItem(`jution-scroll-${writing.id}`);
    if (savedScroll) {
      setTimeout(() => window.scrollTo({ top: parseInt(savedScroll, 10), behavior: 'auto' }), 100);
    }

    const onScroll = () => {
      const el = contentRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = el.scrollHeight - window.innerHeight;
      if (total <= 0) { setProgress(100); return; }
      const scrolled = Math.abs(rect.top);
      setProgress(Math.min(100, (scrolled / total) * 100));

      // Remaining reading time
      const percentRemaining = 1 - Math.min(1, scrolled / total);
      if (writing.readTime) {
        setRemainingTime(Math.max(0, Math.ceil(writing.readTime * percentRemaining)));
      }

      // Completion check
      if (scrolled / total >= 0.95 && !completed) {
        setCompleted(true);
      }

      // Paragraph spotlight
      if (spotlight) {
        const proseEl = contentRef.current?.querySelector('.prose');
        if (proseEl) {
          const children = proseEl.children;
          let closest = -1;
          let closestDist = Infinity;
          const viewCenter = window.innerHeight / 2;
          for (let i = 0; i < children.length; i++) {
            const rect = children[i].getBoundingClientRect();
            const center = rect.top + rect.height / 2;
            const dist = Math.abs(center - viewCenter);
            if (dist < closestDist) {
              closestDist = dist;
              closest = i;
            }
          }
          for (let i = 0; i < children.length; i++) {
            if (i === closest) {
              children[i].classList.add('para-active');
              children[i].classList.remove('para-dim');
            } else {
              children[i].classList.add('para-dim');
              children[i].classList.remove('para-active');
            }
          }
        }
      }
      
      // Save scroll
      localStorage.setItem(`jution-scroll-${writing.id}`, window.scrollY.toString());

      // Scroll Spy
      let current = '';
      for (const heading of headings) {
        const el = document.getElementById(heading.id);
        if (el && el.getBoundingClientRect().top <= 100) {
          current = heading.id;
        }
      }
      if (current) setActiveHeading(current);
    };
    
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, [writing, spotlight]);

  useEffect(() => {
    if (!spotlight) {
      const proseEl = contentRef.current?.querySelector('.prose');
      if (proseEl) {
        const children = proseEl.children;
        for (let i = 0; i < children.length; i++) {
          children[i].classList.remove('para-active', 'para-dim');
        }
      }
    } else {
      window.dispatchEvent(new Event('scroll'));
    }
  }, [spotlight]);

  useEffect(() => {
    const proseEl = contentRef.current?.querySelector('.prose');
    if (!proseEl) return;
    
    const headingEls = proseEl.querySelectorAll('h1, h2, h3');
    headingEls.forEach(h => {
      h.classList.add('heading-reveal');
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    Array.from(proseEl.children).forEach(child => {
      child.classList.add('reveal');
      observer.observe(child);
    });

    return () => observer.disconnect();
  }, [writing]);

  const handleDelete = () => {
    if (!writing) return;
    deleteWriting(writing.id);
    router.push('/');
  };

  if (!writing) {
    return null; // The Server Component already handles the 404 case
  }

  const meta = GENRE_META[writing.genre];

  return (
    <>
      {/* Liquid Progress bar */}
      <div className="liquid-progress-container">
        <div 
          className="liquid-progress-bar" 
          style={{ width: `${progress}%`, background: `var(--genre-${writing.genre}, var(--ink-deep))` }} 
        />
      </div>

      {/* Floating Exit Immersive Mode Button */}
      {immersive && (
        <button 
          className="btn-icon exit-immersive-btn"
          onClick={() => setImmersive(false)}
          aria-label="Exit Immersive Mode"
          style={{
            position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--ink-deep)', color: 'var(--canvas)', borderRadius: 'var(--r-full)',
            width: 44, height: 44, zIndex: 100, boxShadow: 'var(--shadow-lg)'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3"/></svg>
        </button>
      )}

      {/* Top nav */}
      <header className="glass-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--slate)', fontWeight: 500, flexWrap: 'wrap' }}>
          <Link href="/" className="btn-ghost" aria-label="Kembali ke Beranda" style={{ fontSize: 13, padding: '4px 8px', marginLeft: -8 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
            Semua
          </Link>
          <span style={{ color: 'var(--hairline-strong)' }}>/</span>
          <span style={{ color: 'var(--ink)' }}>{meta?.label}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button 
            className={`btn-icon ${immersive ? 'active' : ''}`}
            onClick={() => setImmersive(!immersive)}
            aria-label="Toggle Immersive Mode"
            style={{ fontSize: 16 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          </button>

          <button
            className={`btn-icon ${spotlight ? 'active' : ''}`}
            onClick={() => { setSpotlight(!spotlight); }}
            aria-label="Toggle Spotlight Mode"
            title="Mode Sorotan"
            style={{ fontSize: 16 }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          </button>
          
          <TypographyPanel />
          
          <button className="btn-secondary" aria-label="Cetak ke PDF" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => window.print()}>
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
                    className={`toc-link ${activeHeading === h.id ? 'active' : ''}`}
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
            <span className="genre-badge" style={{ fontSize: 12, background: 'var(--canvas)', color: `var(--genre-${writing.genre})`, borderColor: `var(--genre-${writing.genre})` }}>
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
          <div 
            className={`prose animate-fade-up ${spotlight ? 'reader-spotlight' : ''}`} 
            style={{ position: 'relative' }}
            dangerouslySetInnerHTML={{ __html: modifiedContent }}
          />

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
            <aside className="animate-fade-up" style={{ marginTop: 48, paddingTop: 32 }}>
              <h3 style={{
                fontSize: 14, fontWeight: 600, letterSpacing: '-0.01em',
                color: 'var(--ink-deep)', marginBottom: 16,
              }}>
                Tulisan Terkait
              </h3>
              <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {related.map((r) => (
                  <Link key={r.id} href={`/read/${r.id}`} className="notion-row" aria-label={`Baca tulisan terkait: ${r.title}`}>
                    <span className="notion-row-title">{r.title}</span>
                    <span className="notion-row-meta">{r.readTime} min</span>
                  </Link>
                ))}
              </nav>
            </aside>
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

      {/* Reading countdown */}
      {progress > 5 && progress < 95 && remainingTime > 0 && (
        <div className="reading-countdown">
          ⏱ {remainingTime} min lagi
        </div>
      )}

      {/* Completion badge */}
      {completed && (
        <div style={{ textAlign: 'center', padding: '32px 0 16px' }}>
          <span className="completion-badge">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            Selesai dibaca
          </span>
        </div>
      )}
    </>
  );
}
