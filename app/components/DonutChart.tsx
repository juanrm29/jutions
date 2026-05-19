'use client';

import { useEffect, useRef, useState } from 'react';

interface Segment {
  label: string;
  value: number;
  color: string;
}

export default function DonutChart({ segments, size = 180 }: { segments: Segment[]; size?: number }) {
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) return null;
  
  const radius = (size - 20) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeWidth = 18;
  const center = size / 2;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  let offset = 0;

  return (
    <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg ref={ref} width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {/* Background circle */}
        <circle
          cx={center} cy={center} r={radius}
          fill="none" stroke="var(--hairline)" strokeWidth={strokeWidth}
        />
        {/* Segments */}
        {segments.map((seg, i) => {
          const pct = seg.value / total;
          const dashLength = circumference * pct;
          const dashOffset = -offset * circumference;
          const isHovered = hoveredIdx === i;
          
          const el = (
            <circle
              key={i}
              cx={center} cy={center} r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${dashLength} ${circumference - dashLength}`}
              strokeDashoffset={dashOffset}
              strokeLinecap="butt"
              style={{
                transform: 'rotate(-90deg)',
                transformOrigin: 'center',
                transition: 'stroke-dasharray 1s cubic-bezier(0.16, 1, 0.3, 1), stroke-width 0.2s ease, opacity 0.3s ease',
                opacity: visible ? (hoveredIdx !== null && !isHovered ? 0.4 : 1) : 0,
                cursor: 'pointer',
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            />
          );
          
          offset += pct;
          return el;
        })}
        {/* Center text */}
        <text x={center} y={center - 8} textAnchor="middle" fill="var(--ink-deep)"
          style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', fontFamily: 'var(--font-sans)' }}>
          {total}
        </text>
        <text x={center} y={center + 14} textAnchor="middle" fill="var(--stone)"
          style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textTransform: 'uppercase', fontFamily: 'var(--font-sans)' }}>
          tulisan
        </text>
      </svg>
      
      {/* Tooltip */}
      {hoveredIdx !== null && (
        <div style={{
          position: 'absolute',
          bottom: -36,
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '4px 12px',
          borderRadius: 'var(--r-full)',
          background: 'var(--ink-deep)',
          color: 'var(--canvas)',
          fontSize: 12,
          fontWeight: 500,
          whiteSpace: 'nowrap',
          animation: 'countdown-pop-in 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: 'var(--shadow-md)',
        }}>
          {segments[hoveredIdx].label}: {segments[hoveredIdx].value} ({Math.round((segments[hoveredIdx].value / total) * 100)}%)
        </div>
      )}
    </div>
  );
}
