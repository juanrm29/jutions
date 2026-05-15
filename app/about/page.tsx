'use client';

import { useState, useEffect } from 'react';
import { getWritings, getAboutContent, saveAboutContent } from '../../lib/store';
import { Writing, GENRE_META } from '../../lib/types';
import { isAdmin } from '../../lib/auth';
import ScrollReveal from '../components/ScrollReveal';

function AnimatedCounter({ value }: { value: number | string }) {
  const [count, setCount] = useState(0);
  const numericValue = typeof value === 'string' ? parseInt(value.replace(/\D/g, '')) : value;
  
  useEffect(() => {
    if (isNaN(numericValue)) return;
    let start = 0;
    const end = numericValue;
    if (start === end) {
      setCount(end);
      return;
    }
    const duration = 1500;
    let startTime: number | null = null;
    
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setCount(Math.floor(easeProgress * end));
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };
    requestAnimationFrame(animate);
  }, [numericValue]);

  if (typeof value === 'string' && isNaN(numericValue)) return <>{value}</>;
  return <>{count.toLocaleString('id-ID')}</>;
}

export default function AboutPage() {
  const [writings, setWritings] = useState<Writing[]>([]);
  const [aboutContent, setAboutContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    async function loadData() {
      const [w, a] = await Promise.all([getWritings(), getAboutContent()]);
      setWritings(w);
      setAboutContent(a);
    }
    loadData();
    setAdmin(isAdmin());
  }, []);

  const counts = writings.reduce((acc, w) => {
    acc[w.genre] = (acc[w.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalWords = writings.reduce((sum, w) => sum + w.content.trim().split(/\s+/).length, 0);

  const stats = [
    { label: 'Total Tulisan', value: writings.length },
    { label: 'Total Kata', value: totalWords.toLocaleString('id-ID') },
    { label: 'Cerpen', value: counts['cerpen'] || 0 },
    { label: 'Novel', value: counts['novel'] || 0 },
    { label: 'Jurnal', value: counts['jurnal'] || 0 },
    { label: 'Esai', value: counts['esai'] || 0 },
    { label: 'Puisi', value: counts['puisi'] || 0 },
  ];

  // Heatmap data (last 12 weeks = 84 days)
  const heatmapDays = Array.from({ length: 84 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (83 - i));
    const dateStr = d.toISOString().split('T')[0];
    const count = writings.filter(w => w.createdAt.startsWith(dateStr)).length;
    return { date: dateStr, count };
  });

  return (
    <div className="reader-container">
      {/* Title & Controls */}
      <div className="animate-fade-up" style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 className="linear-title" style={{ marginBottom: 8 }}>
            Tentang Jution
          </h1>
        </div>
        {admin && (
          <button
            className={isEditing ? "btn-primary" : "btn-secondary"}
            style={{ fontSize: 13, padding: '6px 14px' }}
            onClick={async () => {
              if (isEditing) {
                await saveAboutContent(aboutContent);
              }
              setIsEditing(!isEditing);
            }}
          >
            {isEditing ? 'Simpan' : 'Edit Profil'}
          </button>
        )}
      </div>

      {/* Intro */}
      <ScrollReveal className="prose animate-fade-up" style={{ marginBottom: 64 }}>
        {isEditing ? (
          <textarea
            value={aboutContent}
            onChange={(e) => {
              setAboutContent(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
            }}
            style={{
              width: '100%', minHeight: 240, padding: 20,
              background: 'var(--surface)', color: 'var(--ink)',
              border: '1px solid var(--hairline-strong)',
              borderRadius: 'var(--r-md)', outline: 'none',
              fontFamily: 'var(--font-sans)', fontSize: 16,
              lineHeight: 1.6, resize: 'none',
              boxShadow: 'var(--shadow-sm)'
            }}
          />
        ) : (
          aboutContent.split('\n\n').filter(Boolean).map((para, i) => (
            <p key={i} style={{ color: 'var(--slate)', lineHeight: 1.7 }}>{para}</p>
          ))
        )}
      </ScrollReveal>

      {/* Stats */}
      <ScrollReveal className="animate-fade-up" style={{ marginBottom: 64 }}>
        <h2 style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase', color: 'var(--stone)',
          marginBottom: 16,
        }}>
          Statistik
        </h2>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: 12,
        }}>
          {stats.map((s) => (
            <div key={s.label} style={{
              padding: 20, borderRadius: 'var(--r-card)',
              border: '1px solid var(--hairline)',
              background: 'var(--surface)',
            }}>
              <div style={{
                fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em',
                color: 'var(--ink-deep)', marginBottom: 6,
              }}>
                <AnimatedCounter value={s.value} />
              </div>
              <div style={{ fontSize: 13, color: 'var(--stone)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </ScrollReveal>

      {/* Activity Heatmap */}
      <ScrollReveal className="animate-fade-up" style={{ marginBottom: 64 }}>
        <h2 style={{
          fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
          textTransform: 'uppercase', color: 'var(--stone)',
          marginBottom: 16,
        }}>
          Aktivitas Menulis (12 Minggu Terakhir)
        </h2>
        <div style={{
          padding: 24, borderRadius: 'var(--r-card)',
          border: '1px solid var(--hairline)',
          background: 'var(--surface)',
          overflowX: 'auto'
        }}>
          <div style={{
            display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gridAutoFlow: 'column',
            gap: 4, width: 'max-content',
          }}>
            {heatmapDays.map((day, i) => (
              <div key={i} title={`${day.count} tulisan pada ${day.date}`} style={{
                width: 14, height: 14, borderRadius: 2,
                background: day.count > 0 ? 'var(--genre-novel)' : 'var(--hairline-strong)',
                opacity: day.count > 0 ? Math.min(0.2 + (day.count * 0.3), 1) : 0.2,
                transition: 'opacity 0.2s ease', cursor: 'pointer',
              }} onMouseEnter={(e) => {
                if (day.count > 0) e.currentTarget.style.opacity = '1';
              }} onMouseLeave={(e) => {
                if (day.count > 0) e.currentTarget.style.opacity = String(Math.min(0.2 + (day.count * 0.3), 1));
              }} />
            ))}
          </div>
        </div>
      </ScrollReveal>

      {/* Filosofi */}
      <ScrollReveal className="animate-fade-up" style={{
        padding: 32, borderRadius: 'var(--r-card)',
        background: 'var(--surface)',
        border: '1px solid var(--hairline)',
      }}>
        <h2 style={{
          fontSize: 16, fontWeight: 600, color: 'var(--ink-deep)',
          marginBottom: 16, letterSpacing: '-0.01em'
        }}>
          Filosofi Menulis
        </h2>
        <blockquote style={{
          fontSize: 15, lineHeight: 1.75, color: 'var(--slate)',
          borderLeft: '2px solid var(--stone)',
          paddingLeft: 20, margin: 0, fontStyle: 'italic'
        }}>
          &ldquo;Menulis bukan soal menghasilkan produk jadi. Ia lebih seperti percakapan dengan diri sendiri, dan seperti kebanyakan percakapan, ia tidak selalu butuh kesimpulan.&rdquo;
        </blockquote>
      </ScrollReveal>
    </div>
  );
}
