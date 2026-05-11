'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import CommandPalette from './CommandPalette';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
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
    </div>
  );
}
