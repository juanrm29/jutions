'use client';

import { useState, useEffect } from 'react';
import { getWritings, getAboutContent, saveAboutContent } from '../../lib/store';
import { Writing, GENRE_META } from '../../lib/types';
import { isAdmin } from '../../lib/auth';

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
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '64px 32px 120px' }}>
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
      <div className="prose animate-fade-up" style={{ marginBottom: 64 }}>
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
      </div>

      {/* Stats */}
      <div className="animate-fade-up" style={{ marginBottom: 64 }}>
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
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'var(--stone)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Heatmap */}
      <div className="animate-fade-up" style={{ marginBottom: 64 }}>
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
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)',
            gap: 4, width: '100%',
          }}>
            {heatmapDays.map((day, i) => (
              <div key={i} title={`${day.count} tulisan pada ${day.date}`} style={{
                aspectRatio: '1/1', width: '100%', borderRadius: 2,
                background: day.count > 0 ? 'var(--ink)' : 'var(--hairline-strong)',
                opacity: day.count > 0 ? Math.min(0.5 + (day.count * 0.2), 1) : 0.5,
                transition: 'opacity 0.2s ease', cursor: 'pointer',
              }} onMouseEnter={(e) => {
                if (day.count > 0) e.currentTarget.style.opacity = '1';
              }} onMouseLeave={(e) => {
                if (day.count > 0) e.currentTarget.style.opacity = String(Math.min(0.5 + (day.count * 0.2), 1));
              }} />
            ))}
          </div>
        </div>
      </div>

      {/* Filosofi */}
      <div className="animate-fade-up" style={{
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
      </div>
    </div>
  );
}
