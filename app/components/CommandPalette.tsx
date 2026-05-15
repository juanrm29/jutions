'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getWritings } from '../../lib/store';
import { Writing } from '../../lib/types';
import { isAdmin } from '../../lib/auth';

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [writings, setWritings] = useState<Writing[]>([]);
  const [admin, setAdmin] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  useEffect(() => {
    if (open) {
      getWritings().then(setWritings);
      setAdmin(isAdmin());
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => setOpen(false);

  // Search Results
  const filteredWritings = query.trim()
    ? writings.filter((w) => w.title.toLowerCase().includes(query.toLowerCase())).slice(0, 5)
    : writings.slice(0, 5);

  const commands = [
    ...(admin ? [{ id: 'new', label: 'Tulis Baru', icon: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z', action: () => router.push('/write/new') }] : []),
    { id: 'home', label: 'Semua Tulisan', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10', action: () => router.push('/') },
    { id: 'about', label: 'Tentang Jution', icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M12 8v4 M12 16h.01', action: () => router.push('/about') },
    { id: 'theme', label: 'Ganti Tema', icon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z', action: () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem('jution_theme', next);
    }},
  ].filter(c => c.label.toLowerCase().includes(query.toLowerCase()));

  const items = [
    ...(query.trim() || filteredWritings.length === 0 ? [] : [{ type: 'header', label: 'Saran' }]),
    ...commands.map(c => ({ type: 'command' as const, ...c })),
    ...(filteredWritings.length > 0 ? [{ type: 'header' as const, label: 'Tulisan' }] : []),
    ...filteredWritings.map(w => ({ type: 'writing' as const, id: w.id, label: w.title, action: () => router.push(`/read/${w.id}`) })),
  ];

  const selectableItems = items.filter(i => i.type !== 'header') as any[];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((s) => (s + 1) % selectableItems.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((s) => (s - 1 + selectableItems.length) % selectableItems.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const item = selectableItems[selectedIndex];
      if (item && item.action) {
        item.action();
        handleClose();
      }
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div className="cmd-overlay spotlight-mode" onClick={handleClose}>
      <div className="cmd-palette spotlight-mode" onClick={(e) => e.stopPropagation()}>
        <div className="cmd-input-wrapper">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--stone)', marginRight: 12 }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input
            ref={inputRef}
            className="cmd-input"
            placeholder="Cari tulisan atau jalankan perintah..."
            aria-label="Cari tulisan atau jalankan perintah"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
          />
        </div>
        <div className="cmd-list">
          {items.length === 0 && (
            <div className="cmd-empty">Tidak ada hasil ditemukan.</div>
          )}
          {items.map((item: any, idx) => {
            if (item.type === 'header') {
              return <div key={`h-${idx}`} className="cmd-header">{item.label}</div>;
            }
            const selectableIdx = selectableItems.findIndex(i => i.id === item.id);
            const active = selectableIdx === selectedIndex;
            return (
              <div
                key={item.id || idx}
                className={`cmd-item ${active ? 'active' : ''}`}
                onMouseEnter={() => setSelectedIndex(selectableIdx)}
                onClick={() => { if (item.action) { item.action(); handleClose(); } }}
              >
                {item.type === 'command' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cmd-item-icon">
                    <path d={item.icon}></path>
                  </svg>
                )}
                {item.type === 'writing' && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="cmd-item-icon">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                )}
                <span className="cmd-item-label">{item.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
