'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import { getWritingById, saveWriting, generateId, calcReadTime } from '../../../lib/store';
import { Writing, Genre, GENRE_META } from '../../../lib/types';
import { isAdmin } from '../../../lib/auth';

const GENRES = Object.entries(GENRE_META) as [Genre, typeof GENRE_META[Genre]][];

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isNew = id === 'new';

  const [title, setTitle] = useState('');
  const [genre, setGenre] = useState<Genre>('cerpen');
  const [emoji, setEmoji] = useState('📘');
  const [tags, setTags] = useState('');
  const [published, setPublished] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [showGenrePicker, setShowGenrePicker] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [zenMode, setZenMode] = useState(false);
  const [writingId, setWritingId] = useState(isNew ? '' : id);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Mulai menulis di sini...',
      }),
      Underline,
      Highlight.configure({ multicolor: false }),
    ],
    content: '',
    editorProps: {
      attributes: { 
        class: 'tiptap-content',
        spellcheck: 'false',
        'data-gramm': 'false'
      },
    },
    immediatelyRender: false,
    onUpdate: () => {
      setSaveStatus('idle');
    },
  });

  useEffect(() => {
    setAdmin(isAdmin());
    if (!isNew && id) {
      getWritingById(id).then((w) => {
        if (w) {
          setTitle(w.title);
          setGenre(w.genre);
          setEmoji(w.emoji);
          setTags(w.tags.join(', '));
          setPublished(w.published);
          setWritingId(w.id);
          // Set content as HTML paragraphs
          if (editor) {
            const html = w.content
              .split('\n\n')
              .filter(Boolean)
              .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
              .join('');
            editor.commands.setContent(html);
          }
        }
      });
    }
  }, [id, isNew, editor]);

  // Redirect non-admin
  useEffect(() => {
    if (!isAdmin()) router.replace('/');
  }, [router]);

  const getContentText = useCallback(() => {
    if (!editor) return '';
    return editor.getText();
  }, [editor]);

  const handleSave = useCallback(async () => {
    if (!editor) return;
    setSaveStatus('saving');

    const contentText = getContentText();
    const now = new Date().toISOString();
    const tagsArr = tags.split(',').map((t) => t.trim()).filter(Boolean);
    const currentId = writingId || generateId();

    let createdAt = now;
    if (!(isNew && !writingId)) {
       const existing = await getWritingById(currentId);
       if (existing) createdAt = existing.createdAt;
    }

    const writing: Writing = {
      id: currentId,
      title: title || 'Tanpa Judul',
      genre,
      emoji,
      excerpt: contentText.slice(0, 160).trim() + (contentText.length > 160 ? '...' : ''),
      content: contentText,
      createdAt,
      updatedAt: now,
      readTime: calcReadTime(contentText),
      tags: tagsArr,
      published,
    };

    await saveWriting(writing);
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 2000);

    if (isNew && !writingId) {
      setWritingId(currentId);
      router.replace(`/write/${currentId}`);
    }
  }, [title, genre, emoji, tags, published, writingId, isNew, router, editor, getContentText]);

  // Auto-save after 3s of inactivity
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        handleSave();
      }, 3000);
    };
    editor.on('update', handler);
    return () => {
      editor.off('update', handler);
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editor, handleSave]);

  // Ctrl+S
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleSave]);

  const handleDelete = async () => {
    if (!writingId) return;
    const { deleteWriting } = require('../../../lib/store');
    await deleteWriting(writingId);
    router.push('/');
  };

  const handleGenreSelect = (g: Genre) => {
    setGenre(g);
    setEmoji(GENRE_META[g].emoji);
    setShowGenrePicker(false);
  };

  useEffect(() => {
    if (zenMode) {
      document.body.classList.add('zen-mode');
    } else {
      document.body.classList.remove('zen-mode');
    }
    return () => document.body.classList.remove('zen-mode');
  }, [zenMode]);

  const wordCount = getContentText().trim() ? getContentText().trim().split(/\s+/).length : 0;

  if (!admin) return null;

  return (
    <div style={{ minHeight: '100vh' }}>
      {/* Top bar */}
      <header className="glass-header">
        <Link href="/" className="btn-ghost" style={{ fontSize: 13, padding: '4px 8px', marginLeft: -8, flexShrink: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>
          Kembali
        </Link>

        <div className="editor-header-actions" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', flex: 1, justifyContent: 'flex-end' }}>

          {/* Publish toggle */}
          <button
            className={published ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: 12, padding: '4px 10px', whiteSpace: 'nowrap' }}
            onClick={() => setPublished(!published)}
          >
            {published ? '✓ Published' : 'Draft'}
          </button>

          <button className="btn-primary" style={{ fontSize: 12, padding: '5px 12px', whiteSpace: 'nowrap' }} onClick={handleSave}>
            Simpan
          </button>

          <button
            className={zenMode ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: 12, padding: '4px 8px', flexShrink: 0 }}
            onClick={() => setZenMode(!zenMode)}
            title="Toggle Zen Mode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
          </button>

          {/* More menu */}
          {writingId && (
            <div style={{ position: 'relative' }}>
              <button className="btn-icon" onClick={() => setShowMore(!showMore)}>···</button>
              {showMore && (
                <div style={{
                  position: 'absolute', right: 0, top: 36,
                  background: 'var(--canvas)', border: '1px solid var(--hairline)',
                  borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)',
                  padding: 4, minWidth: 140, zIndex: 40,
                }}>
                  <button
                    className="sidebar-item"
                    style={{ color: '#e03131', fontSize: 13 }}
                    onClick={handleDelete}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    Hapus
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Editor area */}
      <div className="reader-container">
        {/* Genre emoji */}
        <div style={{ position: 'relative', marginBottom: 12 }}>
          <button
            onClick={() => setShowGenrePicker(!showGenrePicker)}
            style={{
              fontSize: 40, background: 'none', border: 'none',
              cursor: 'pointer', padding: 4, borderRadius: 'var(--r-sm)',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
          >
            {emoji}
          </button>
          {showGenrePicker && (
            <div style={{
              position: 'absolute', top: 56, left: 0,
              background: 'var(--canvas)', border: '1px solid var(--hairline)',
              borderRadius: 'var(--r-md)', boxShadow: 'var(--shadow-md)',
              padding: 8, zIndex: 20, minWidth: 180,
            }}>
              {GENRES.map(([key, meta]) => (
                <button
                  key={key}
                  className="sidebar-item"
                  onClick={() => handleGenreSelect(key)}
                  style={{ fontWeight: genre === key ? 600 : 400 }}
                >
                  <span className="sidebar-item-emoji">{meta.emoji}</span>
                  {meta.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Title */}
        <textarea
          placeholder="Untitled"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
          }}
          rows={1}
          className="linear-title"
          style={{ marginBottom: 12, overflow: 'hidden' }}
        />

        {/* Meta line */}
        <div style={{
          fontSize: 13, color: 'var(--stone)', marginBottom: 24,
          display: 'flex', gap: 8, alignItems: 'center',
        }}>
          <span className="genre-badge" style={{
            background: GENRE_META[genre]?.tint,
            color: 'var(--slate)',
          }}>
            {GENRE_META[genre]?.label}
          </span>
          <span>{wordCount} kata</span>
          <span>·</span>
          <span>{calcReadTime(getContentText())} min baca</span>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--hairline)', marginBottom: 24 }} />

        {/* Rich text toolbar */}
        {editor && (
          <div className="floating-toolbar">
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('bold') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleBold().run()}
              data-tooltip="Ctrl+B"
            >
              <strong>B</strong>
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('italic') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleItalic().run()}
              data-tooltip="Ctrl+I"
            >
              <em>I</em>
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('underline') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              data-tooltip="Ctrl+U"
            >
              <u>U</u>
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('strike') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleStrike().run()}
              data-tooltip="Ctrl+Shift+X"
            >
              <s>S</s>
            </button>
            <div className="toolbar-divider" />
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('heading', { level: 1 }) ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              data-tooltip="Ctrl+Alt+1"
            >
              H1
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('heading', { level: 2 }) ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              data-tooltip="Ctrl+Alt+2"
            >
              H2
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('heading', { level: 3 }) ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              data-tooltip="Ctrl+Alt+3"
            >
              H3
            </button>
            <div className="toolbar-divider" />
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('bulletList') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              data-tooltip="Ctrl+Shift+8"
            >
              •
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('orderedList') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              data-tooltip="Ctrl+Shift+7"
            >
              1.
            </button>
            <div className="toolbar-divider" />
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('blockquote') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              data-tooltip="Ctrl+Shift+B"
            >
              &ldquo;
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('codeBlock') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              data-tooltip="Ctrl+Alt+C"
            >
              {'</>'}
            </button>
            <button
              className={`toolbar-btn kbd-tooltip ${editor.isActive('highlight') ? 'active' : ''}`}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              data-tooltip="Ctrl+Shift+H"
            >
              🖍
            </button>
            <div className="toolbar-divider" />
            <button
              className="toolbar-btn kbd-tooltip"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              data-tooltip="---"
            >
              ─
            </button>
          </div>
        )}

        {/* Tiptap editor */}
        <div className="tiptap-editor">
          <EditorContent editor={editor} />
        </div>

        {/* Tags */}
        <div style={{ borderTop: '1px solid var(--hairline)', paddingTop: 20, marginTop: 40 }}>
          <label style={{
            fontSize: 11, fontWeight: 600, letterSpacing: '0.5px',
            textTransform: 'uppercase', color: 'var(--stone)',
            display: 'block', marginBottom: 6,
          }}>
            Tags (pisahkan dengan koma)
          </label>
          <input
            type="text"
            placeholder="contoh: hujan, refleksi, malam"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            style={{
              width: '100%', padding: '8px 0', border: 'none',
              borderBottom: '1px solid var(--hairline)',
              outline: 'none', fontSize: 14,
              color: 'var(--slate)', background: 'transparent',
              fontFamily: 'var(--font-sans)',
            }}
          />
        </div>
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--stone)' }}>
          Ctrl+S untuk simpan cepat · Auto-save setiap 3 detik
        </p>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stats-bar-group">
          <div className="stats-bar-item">
            <span style={{ fontWeight: 600 }}>{wordCount}</span> kata
          </div>
          <div className="stats-bar-item">
            <span>{calcReadTime(getContentText())} min</span> baca
          </div>
        </div>
        <div className="stats-bar-group">
          <div className="stats-bar-item">
            <span style={{ color: saveStatus === 'saved' ? 'var(--primary)' : 'var(--stone)' }}>
              {saveStatus === 'saving' ? '💾 Menyimpan...' : saveStatus === 'saved' ? '☁️ Tersimpan' : 'Auto-save aktif'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
