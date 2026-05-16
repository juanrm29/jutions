import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import ReaderClient from './ReaderClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const getWritingByIdServer = async (id: string) => {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase.from('writings').select('*').eq('id', id).single();
  
  if (!data) return undefined;
  return {
    id: data.id,
    title: data.title,
    excerpt: data.excerpt || (data.content ? data.content.slice(0, 160).trim() + (data.content.length > 160 ? '...' : '') : ''),
    content: data.content,
    genre: data.genre,
    emoji: data.emoji,
    tags: data.tags ? JSON.parse(data.tags) : [],
    published: data.published,
    readTime: data.readTime,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
};

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await Promise.resolve(params); // await params to support Next.js 15+ safely
  const writing = await getWritingByIdServer(id);

  if (!writing) {
    return {
      title: 'Tulisan Tidak Ditemukan | Jution',
    };
  }

  return {
    title: writing.title,
    description: writing.excerpt || 'Baca tulisan lengkapnya di Jution.',
    openGraph: {
      title: writing.title,
      description: writing.excerpt || 'Baca tulisan lengkapnya di Jution.',
      type: 'article',
      publishedTime: writing.createdAt,
      authors: ['Jution'],
    },
    twitter: {
      card: 'summary_large_image',
      title: writing.title,
      description: writing.excerpt || 'Baca tulisan lengkapnya di Jution.',
    },
  };
}

export default async function ReadPage({ params }: Props) {
  const { id } = await Promise.resolve(params);
  
  const writing = await getWritingByIdServer(id);
  if (!writing) {
    notFound();
  }

  return <ReaderClient id={id} initialData={writing} />;
}
