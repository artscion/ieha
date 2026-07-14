import { Suspense } from 'react';
import { Golos_Text, Spectral } from 'next/font/google';
import { CatalogueAdminBrowser } from '@/components/admin/CatalogueAdminBrowser';
import { listCatalogueAdminWorks } from '@/lib/catalogue-admin/load';
import '../../globals.css';

const golos = Golos_Text({
  subsets: ['latin', 'cyrillic'],
  variable: '--font-golos',
  display: 'swap',
});

const spectral = Spectral({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
});

export const metadata = {
  title: 'Catalogue admin · IEHA',
  robots: { index: false, follow: false },
};

// Bake catalogue entries into the page at build time. On Netlify, dynamic
// serverless invocations do not reliably include content/catalogue in the
// function bundle, which previously produced an empty list.
export const dynamic = 'force-static';

export default async function AdminCataloguePage() {
  const works = await listCatalogueAdminWorks();

  return (
    <html lang="en" className={`${golos.variable} ${spectral.variable}`}>
      <body className="bg-cream text-ink font-serif antialiased">
        <main id="main-content">
          <Suspense fallback={<p className="p-10 font-sans text-sm text-label">Loading catalogue…</p>}>
            <CatalogueAdminBrowser works={works} />
          </Suspense>
        </main>
      </body>
    </html>
  );
}
