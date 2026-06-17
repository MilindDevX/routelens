import type { Metadata } from 'next';
import { Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Navigation } from '@/components/Navigation';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['300', '400', '500', '600', '700'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  weight: ['400', '500'],
});

export const metadata: Metadata = {
  title: 'RouteLens — API Directory & Response Diff Tool',
  description:
    'Parse OpenAPI/Swagger specs into a searchable route directory. Diff JSON API responses with structural highlighting. Fully client-side, no signup required.',
  keywords: ['OpenAPI', 'Swagger', 'API', 'diff', 'JSON', 'REST', 'developer tools'],
  authors: [{ name: 'Milind Bansal' }],
  openGraph: {
    title: 'RouteLens — API Directory & Response Diff Tool',
    description: 'Parse OpenAPI specs and diff JSON responses. Client-side, no signup.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.variable} ${jetbrainsMono.variable} font-display`}>
        <Navigation />
        <main className="min-h-screen">{children}</main>
        <footer style={{ borderTop: '1px solid var(--border)', marginTop: '5rem' }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex flex-col items-center sm:items-start gap-1">
                <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  Built by{' '}
                  <span style={{ color: 'var(--text-secondary)' }} className="font-medium">Milind Bansal</span>
                </span>
                <a
                  href="mailto:milindsk8r@gmail.com"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--accent)' }}
                  id="footer-email"
                >
                  milindsk8r@gmail.com
                </a>
              </div>

              <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--text-muted)' }}>
                <span>All processing is client-side · No data leaves your browser</span>
                <span style={{ color: 'var(--border)' }}>|</span>
                <a
                  href="https://digitalheroesco.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  id="footer-digital-heroes"
                  className="transition-colors hover:text-accent"
                  style={{ color: 'var(--text-muted)' }}
                >
                  Built for Digital Heroes
                </a>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
