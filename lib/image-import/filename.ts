import { createHash } from 'node:crypto';
import { MIME_TO_EXTENSION } from './constants';

export function extensionForMime(mime: string): string | null {
  return MIME_TO_EXTENSION[mime] ?? null;
}

export function sanitizeFilenameBase(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[^\w]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
      .toLowerCase() || 'artwork'
  );
}

export function buildImportFilename(opts: {
  slug?: string;
  mime: string;
  bytes: Uint8Array;
}): string {
  const ext = extensionForMime(opts.mime);
  if (!ext) throw new Error('Unsupported image type.');
  const hash = createHash('sha256').update(opts.bytes).digest('hex').slice(0, 8);
  const base = sanitizeFilenameBase(opts.slug || 'artwork');
  return `${base}-${hash}.${ext}`;
}
