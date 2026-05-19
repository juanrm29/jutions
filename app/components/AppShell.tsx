'use client';

import { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';
import BackToTop from './BackToTop';
import QuickDraft from './QuickDraft';
import { isAdmin } from '../../lib/auth';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [admin, setAdmin] = useState(false);
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 });
  const [cursorType, setCursorType] = useState('default');

  useEffect(() => {
    setAdmin(isAdmin());
    
    // Custom cursor logic with rAF throttling
    document.body.classList.add('custom-cursor');
    
    let rafId: number | null = null;
    let latestX = -100;
    let latestY = -100;
    let latestType = 'default';
    
    const updateCursor = () => {
      setCursorPos({ x: latestX, y: latestY });
      setCursorType(latestType);
      rafId = null;
    };
    
    const handleMouseMove = (e: MouseEvent) => {
      latestX = e.clientX;
      latestY = e.clientY;
      
      const target = e.target as HTMLElement;
      if (!target) return;
      
      const computedCursor = window.getComputedStyle(target).cursor;
      const tag = target.tagName.toLowerCase();
      
      if (computedCursor === 'pointer' || tag === 'button' || tag === 'a' || target.closest('button') || target.closest('a')) {
        latestType = 'interactive';
      } else if (computedCursor === 'text' || tag === 'p' || tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'input' || tag === 'textarea' || target.closest('.ProseMirror')) {
        latestType = 'text';
      } else {
        latestType = 'default';
      }
      
      if (!rafId) {
        rafId = requestAnimationFrame(updateCursor);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (rafId) cancelAnimationFrame(rafId);
      document.body.classList.remove('custom-cursor');
    };
  }, []);

  return (
    <div className="app-shell">
      {/* SVG Filters */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feColorMatrix in="blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7" result="goo" />
          <feBlend in="SourceGraphic" in2="goo" />
        </filter>
      </svg>

      {/* Visual noise texture overlay */}
      <div className="noise-overlay" />
      
      {/* Mindblowing Phase 4 elements */}
      <div className="ambient-aura">
        <div 
          className="ambient-aura-glow" 
          style={{ left: cursorPos.x, top: cursorPos.y }} 
        />
      </div>
      <div 
        className={`fluid-cursor ${cursorType === 'interactive' ? 'hovering-interactive' : cursorType === 'text' ? 'hovering-text' : ''}`}
        style={{ left: cursorPos.x, top: cursorPos.y }}
      />

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <CommandPalette />

      {/* Mobile header */}
      <div className="mobile-header">
        <button
          className="btn-icon"
          onClick={() => setSidebarOpen(true)}
          aria-label="Menu"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, marginLeft: 8, color: 'var(--charcoal)' }}>
          Jution
        </span>
      </div>

      <main className="page-content">
        {children}
      </main>

      {admin && <QuickDraft />}
      <BackToTop />
    </div>
  );
}
