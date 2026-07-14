import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { CatalogueAdminWork } from './types';

const CATALOGUE_DIR = path.join(process.cwd(), 'content/catalogue');

/**
 * Parse the flat scalar fields we need for the admin list.
 * Avoids depending on the Keystatic reader at request time (Netlify serverless
 * may not include content/ in the function bundle for dynamic routes).
 */
function parseCatalogueYaml(text: string): {
  title: string;
  artist: string;
  date: string;
  medium: string;
  image: string;
  reviewStatus: string;
} {
  const fields: Record<string, string> = {};
  for (const rawLine of text.split('\n')) {
    const line = rawLine.replace(/\r$/, '');
    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) continue;
    let value = match[2].trim();
    if (value === '>' || value === '|' || value === '>-' || value === '|-') {
      // Multiline block — skip body for admin list fields we care about.
      fields[match[1]] = '';
      continue;
    }
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    fields[match[1]] = value;
  }

  return {
    title: fields.title ?? '',
    artist: fields.artist ?? '',
    date: fields.date ?? '',
    medium: fields.medium ?? '',
    image: fields.image ?? '',
    reviewStatus: fields.reviewStatus ?? 'draft',
  };
}

export async function listCatalogueAdminWorks(): Promise<CatalogueAdminWork[]> {
  let files: string[];
  try {
    files = await readdir(CATALOGUE_DIR);
  } catch {
    return [];
  }

  const yamlFiles = files.filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
  const works = await Promise.all(
    yamlFiles.map(async (file) => {
      const slug = file.replace(/\.ya?ml$/, '');
      const text = await readFile(path.join(CATALOGUE_DIR, file), 'utf8');
      const parsed = parseCatalogueYaml(text);
      const work: CatalogueAdminWork = {
        slug,
        title: parsed.title || slug,
        artist: parsed.artist,
        date: parsed.date,
        medium: parsed.medium,
        hasImage: Boolean(parsed.image),
        reviewStatus: parsed.reviewStatus,
      };
      return work;
    })
  );

  return works;
}
