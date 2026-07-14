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

export default async function AdminCataloguePage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const params = await searchParams;
  const works = await listCatalogueAdminWorks();
  const branch = params.branch?.trim() || process.env.KEYSTATIC_BRANCH || 'feat/site-rebuild';

  return (
    <html lang="en" className={`${golos.variable} ${spectral.variable}`}>
      <body className="bg-cream text-ink font-serif antialiased">
        <main id="main-content">
          <Suspense fallback={<p className="p-10 font-sans text-sm text-label">Loading catalogue…</p>}>
            <CatalogueAdminBrowser works={works} branch={branch} />
          </Suspense>
        </main>
      </body>
    </html>
  );
}
