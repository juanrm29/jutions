import type { Metadata } from 'next';
import './globals.css';
import AppShell from './components/AppShell';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'), // Change in production
  title: {
    default: 'Jution — Ruang Tulisku',
    template: '%s | Jution',
  },
  description: 'Satu wadah untuk semua tulisan: novel, cerpen, jurnal, esai, puisi.',
  openGraph: {
    title: 'Jution — Ruang Tulisku',
    description: 'Satu wadah untuk semua tulisan: novel, cerpen, jurnal, esai, puisi.',
    siteName: 'Jution',
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Jution — Ruang Tulisku',
    description: 'Satu wadah untuk semua tulisan: novel, cerpen, jurnal, esai, puisi.',
  },
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
