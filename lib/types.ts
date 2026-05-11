export type Genre = 'novel' | 'cerpen' | 'jurnal' | 'esai' | 'puisi' | 'lainnya';

export interface Writing {
  id: string;
  title: string;
  genre: Genre;
  emoji: string;
  excerpt: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  readTime: number;
  tags: string[];
  published: boolean;
  coverColor?: string;
}

export const GENRE_META: Record<Genre, { emoji: string; label: string; tint: string; tintDark: string }> = {
  novel:   { emoji: '📕', label: 'Novel',   tint: '#fde0ec', tintDark: '#3d1f2e' },
  cerpen:  { emoji: '📘', label: 'Cerpen',  tint: '#ffe8d4', tintDark: '#3d2e1f' },
  jurnal:  { emoji: '📓', label: 'Jurnal',  tint: '#d9f3e1', tintDark: '#1f3d26' },
  esai:    { emoji: '📝', label: 'Esai',    tint: '#e6e0f5', tintDark: '#2a1f3d' },
  puisi:   { emoji: '🎭', label: 'Puisi',   tint: '#dcecfa', tintDark: '#1f2e3d' },
  lainnya: { emoji: '📄', label: 'Lainnya', tint: '#f8f5e8', tintDark: '#3d3a1f' },
};
