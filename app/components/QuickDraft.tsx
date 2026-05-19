'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function QuickDraft() {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  const handleSave = async () => {
    if (!title.trim() && !content.trim()) return;
    
    setIsSaving(true);
    try {
      const { saveWriting, generateId, calcReadTime } = await import('@/lib/store');
      const id = generateId();
      const htmlContent = `<p>${content}</p>`;
      const newDoc = {
        id,
        title: title || 'Draft',
        content: htmlContent,
        genre: 'novel' as const,
        emoji: '📘',
        tags: ['draft'],
        excerpt: content.slice(0, 160).trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        readTime: calcReadTime(htmlContent),
        published: false
      };
      await saveWriting(newDoc);
      
      setIsOpen(false);
      setTitle('');
      setContent('');
      router.push(`/write/${id}`);
    } catch (err) {
      console.error('Failed to create quick draft', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button 
        className="quick-draft-fab"
        onClick={() => setIsOpen(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
        <span>Draft Cepat</span>
      </button>

      {isOpen && (
        <div className="modal-backdrop" onClick={() => setIsOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2 className="linear-title" style={{ fontSize: 24, marginBottom: 16 }}>Draft Cepat</h2>
            <input 
              type="text" 
              className="login-input" 
              style={{ width: '100%', marginBottom: 12, border: 'none', fontSize: 18, fontWeight: 500, padding: 0, boxShadow: 'none', background: 'transparent' }}
              placeholder="Judul..." 
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
            <textarea 
              className="login-input" 
              style={{ width: '100%', minHeight: 120, resize: 'vertical', border: 'none', padding: 0, boxShadow: 'none', background: 'transparent', fontFamily: 'inherit' }}
              placeholder="Mulai menulis..." 
              value={content}
              onChange={e => setContent(e.target.value)}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 16 }}>
              <button className="btn-ghost" onClick={() => setIsOpen(false)}>Batal</button>
              <button className="btn-primary" onClick={handleSave} disabled={isSaving}>
                {isSaving ? 'Menyimpan...' : 'Simpan & Edit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
