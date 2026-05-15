import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getWritingById } from '../../../lib/store';
import ReaderClient from './ReaderClient';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  // In Next.js 14, params is a promise in some contexts, but let's assume standard synchronous usage or wait if needed.
  // We'll await it to be safe for Next.js 14+ if params is a promise
  const { id } = params;
  const writing = await getWritingById(id);

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
  const { id } = params;
  
  // Optional: We can fetch here to trigger notFound() server-side
  const writing = await getWritingById(id);
  if (!writing) {
    notFound();
  }

  return <ReaderClient id={id} initialData={writing} />;
}
