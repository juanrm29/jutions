'use client';

import { createClient } from './supabase/client';
import { Writing } from './types';

const supabase = createClient();

export async function getWritings(): Promise<Writing[]> {
  const { data, error } = await supabase
    .from('writings')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching writings:', error);
    return [];
  }

  // Map database fields to application types
  return data.map((row: any) => ({
    id: row.id,
    title: row.title,
    excerpt: row.excerpt || '',
    content: row.content,
    genre: row.genre,
    emoji: row.emoji,
    tags: row.tags ? JSON.parse(row.tags) : [],
    published: row.published,
    readTime: row.readTime,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}

export async function getWritingById(id: string): Promise<Writing | undefined> {
  const { data, error } = await supabase
    .from('writings')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) return undefined;

  return {
    id: data.id,
    title: data.title,
    excerpt: data.excerpt || '',
    content: data.content,
    genre: data.genre,
    emoji: data.emoji,
    tags: data.tags ? JSON.parse(data.tags) : [],
    published: data.published,
    readTime: data.readTime,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function getGenreCounts(): Promise<Record<string, number>> {
  const writings = await getWritings();
  return writings.reduce((acc, w) => {
    acc[w.genre] = (acc[w.genre] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}

export async function saveWriting(writing: Writing): Promise<void> {
  const isNew = !writing.id; // Or we can check if it exists

  const payload = {
    title: writing.title,
    excerpt: writing.excerpt,
    content: writing.content,
    genre: writing.genre,
    emoji: writing.emoji,
    tags: JSON.stringify(writing.tags),
    published: writing.published,
    readTime: writing.readTime,
    updated_at: new Date().toISOString(),
  };

  if (isNew) {
    const { data, error } = await supabase
      .from('writings')
      .insert([{ ...payload, id: writing.id }])
      .select()
      .single();
    if (error) console.error('Error inserting writing:', error);
  } else {
    const { error } = await supabase
      .from('writings')
      .update(payload)
      .eq('id', writing.id);
    if (error) console.error('Error updating writing:', error);
  }
}

export async function deleteWriting(id: string): Promise<void> {
  const { error } = await supabase.from('writings').delete().eq('id', id);
  if (error) console.error('Error deleting writing:', error);
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function calcReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

const DEFAULT_ABOUT = `Jution adalah ruang pribadi untuk menyimpan dan membagikan tulisan — novel, cerpen, jurnal, esai, puisi — dalam satu tempat yang rapi dan mudah diakses.

Dibuat dari nol karena tidak ada tempat lain yang terasa cukup tepat: cukup bersih, cukup fokus, cukup menjadi rumah bagi kata-kata.

Di sini tidak ada algoritma yang menentukan tulisan mana yang "layak" dilihat. Semua tulisan berdiri setara, dibaca berdasarkan rasa ingin tahu, bukan viralitas.`;

export async function getAboutContent(): Promise<string> {
  const { data, error } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'about_content')
    .single();

  if (error || !data) return DEFAULT_ABOUT;
  return data.value;
}

export async function saveAboutContent(content: string): Promise<void> {
  const { error } = await supabase
    .from('settings')
    .upsert({ key: 'about_content', value: content });
  if (error) console.error('Error saving about content:', error);
}
