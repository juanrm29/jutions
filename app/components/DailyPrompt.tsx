'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const PROMPTS = [
  "Apa kenangan masa kecil yang paling sering kamu ingat?",
  "Jika hari ini adalah hari terakhirmu di kota ini, apa yang akan kamu lakukan?",
  "Tulis sebuah surat untuk dirimu di masa lalu.",
  "Gambarkan sebuah tempat di mana kamu merasa paling aman.",
  "Apa hal kecil yang membuatmu tersenyum hari ini?",
  "Ceritakan tentang seseorang yang mengubah hidupmu secara tak terduga.",
  "Jika kamu bisa mempelajari satu keahlian baru dalam semalam, apa itu dan mengapa?",
  "Deskripsikan bau hujan dari sudut pandang seseorang yang belum pernah merasakannya.",
  "Tulis tentang sebuah benda yang ada di mejamu saat ini seolah-olah ia memiliki nyawa.",
  "Apa ketakutan terbesarmu yang belum pernah kamu ceritakan kepada siapa pun?",
];

export default function DailyPrompt() {
  const [prompt, setPrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Generate a random prompt once on client to avoid hydration mismatch
    const randomIndex = Math.floor(Math.random() * PROMPTS.length);
    setPrompt(PROMPTS[randomIndex]);
  }, []);

  const handleWrite = async () => {
    setIsCreating(true);
    try {
      const { saveWriting, generateId, calcReadTime } = await import('@/lib/store');
      const id = generateId();
      const content = `<blockquote><p>${prompt}</p></blockquote><p></p>`;
      const newDoc = {
        id,
        title: 'Daily Prompt Response',
        content,
        genre: 'jurnal' as const,
        emoji: '📓',
        tags: ['prompt'],
        excerpt: content.replace(/<[^>]*>?/gm, '').slice(0, 160).trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTime: calcReadTime(content),
        published: false
      };
      await saveWriting(newDoc);
      router.push(`/write/${id}`);
    } catch (err) {
      console.error('Failed to create prompt document', err);
      setIsCreating(false);
    }
  };

  if (!prompt) return null;

  return (
    <div style={{ 
      padding: '24px', 
      borderRadius: 'var(--r-card)', 
      background: 'var(--surface)', 
      border: '1px solid var(--hairline)',
      marginBottom: '32px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        position: 'absolute', top: -20, right: -20, 
        fontSize: '120px', opacity: 0.03, pointerEvents: 'none' 
      }}>
        ✍️
      </div>
      
      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--stone)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
        Daily Prompt
      </div>
      <div style={{ fontSize: '16px', fontWeight: 500, color: 'var(--ink-deep)', marginBottom: '16px', lineHeight: 1.5, maxWidth: '80%' }}>
        "{prompt}"
      </div>
      <button 
        className="btn-primary" 
        onClick={handleWrite}
        disabled={isCreating}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
          <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
        </svg>
        {isCreating ? 'Membuka editor...' : 'Tulis dari prompt ini'}
      </button>
    </div>
  );
}
