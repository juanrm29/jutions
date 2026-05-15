'use client';

import { useState, useEffect } from 'react';

export default function TypographyPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [fontFamily, setFontFamily] = useState('var(--font-sans)');
  const [fontSize, setFontSize] = useState('17px');
  const [lineHeight, setLineHeight] = useState('1.7');

  useEffect(() => {
    // Load saved settings
    const savedFamily = localStorage.getItem('jution-font-family');
    const savedSize = localStorage.getItem('jution-font-size');
    const savedHeight = localStorage.getItem('jution-line-height');

    if (savedFamily) setFontFamily(savedFamily);
    if (savedSize) setFontSize(savedSize);
    if (savedHeight) setLineHeight(savedHeight);
  }, []);

  useEffect(() => {
    // Apply settings
    document.documentElement.style.setProperty('--reader-font-family', fontFamily);
    document.documentElement.style.setProperty('--reader-font-size', fontSize);
    document.documentElement.style.setProperty('--reader-line-height', lineHeight);

    // Save settings
    localStorage.setItem('jution-font-family', fontFamily);
    localStorage.setItem('jution-font-size', fontSize);
    localStorage.setItem('jution-line-height', lineHeight);
  }, [fontFamily, fontSize, lineHeight]);

  return (
    <div style={{ position: 'relative' }}>
      <button 
        className={`btn-icon ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Typography settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
        </svg>
      </button>

      {isOpen && (
        <div className="typography-panel">
          <div className="typo-section">
            <span className="typo-label">Font Family</span>
            <div className="typo-controls">
              <button 
                className={`typo-btn ${fontFamily === 'var(--font-sans)' ? 'active' : ''}`}
                onClick={() => setFontFamily('var(--font-sans)')}
              >
                Sans
              </button>
              <button 
                className={`typo-btn ${fontFamily === 'Georgia, serif' ? 'active' : ''}`}
                onClick={() => setFontFamily('Georgia, serif')}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                Serif
              </button>
              <button 
                className={`typo-btn ${fontFamily === 'monospace' ? 'active' : ''}`}
                onClick={() => setFontFamily('monospace')}
                style={{ fontFamily: 'monospace' }}
              >
                Mono
              </button>
            </div>
          </div>

          <div className="typo-section">
            <span className="typo-label">Font Size</span>
            <div className="typo-controls">
              <button 
                className={`typo-btn ${fontSize === '15px' ? 'active' : ''}`}
                onClick={() => setFontSize('15px')}
              >
                Small
              </button>
              <button 
                className={`typo-btn ${fontSize === '17px' ? 'active' : ''}`}
                onClick={() => setFontSize('17px')}
              >
                Medium
              </button>
              <button 
                className={`typo-btn ${fontSize === '20px' ? 'active' : ''}`}
                onClick={() => setFontSize('20px')}
              >
                Large
              </button>
            </div>
          </div>

          <div className="typo-section">
            <span className="typo-label">Line Height</span>
            <div className="typo-controls">
              <button 
                className={`typo-btn ${lineHeight === '1.5' ? 'active' : ''}`}
                onClick={() => setLineHeight('1.5')}
              >
                Tight
              </button>
              <button 
                className={`typo-btn ${lineHeight === '1.7' ? 'active' : ''}`}
                onClick={() => setLineHeight('1.7')}
              >
                Normal
              </button>
              <button 
                className={`typo-btn ${lineHeight === '2.0' ? 'active' : ''}`}
                onClick={() => setLineHeight('2.0')}
              >
                Loose
              </button>
            </div>
          </div>
        </div>
      )}

      {isOpen && (
        <div 
          style={{ position: 'fixed', inset: 0, zIndex: 90 }} 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
