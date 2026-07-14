import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import { IMAGE_IMPORT, detectImageMime } from './constants';
import { buildImportFilename } from './filename';
import { isBlockedIpAddress, validateImageImportUrl } from './validate-url';

export type ImageImportSuccess = {
  filename: string;
  extension: string;
  mimeType: string;
  byteLength: number;
  /** Base64-encoded image bytes for transport to the Keystatic admin client. */
  dataBase64: string;
  sourceUrl: string;
};

export type ImageImportFailure = {
  error: string;
};

export type ResolveHostname = (hostname: string) => Promise<string[]>;

const defaultResolveHostname: ResolveHostname = async (hostname) => {
  const host = hostname.replace(/^\[|\]$/g, '');
  if (isIP(host)) return [host];
  const results = await lookup(host, { all: true, verbatim: true });
  return results.map((r) => r.address);
};

async function assertHostnameSafe(
  hostname: string,
  resolveHostname: ResolveHostname
): Promise<void> {
  const addresses = await resolveHostname(hostname);
  if (addresses.length === 0) {
    throw new Error('Could not resolve host.');
  }
  for (const address of addresses) {
    if (isBlockedIpAddress(address)) {
      throw new Error('Resolved address is not allowed.');
    }
  }
}

function contentTypeAllowed(header: string | null): boolean {
  if (!header) return false;
  const mime = header.split(';')[0]?.trim().toLowerCase();
  return IMAGE_IMPORT.allowedMimeTypes.has(mime);
}

async function readBodyWithLimit(
  response: Response,
  maxBytes: number
): Promise<Uint8Array> {
  if (!response.body) {
    const buf = new Uint8Array(await response.arrayBuffer());
    if (buf.byteLength > maxBytes) throw new Error('Image exceeds the maximum allowed size.');
    return buf;
  }

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    total += value.byteLength;
    if (total > maxBytes) {
      try {
        await reader.cancel();
      } catch {
        // ignore cancel errors
      }
      throw new Error('Image exceeds the maximum allowed size.');
    }
    chunks.push(value);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
}

/**
 * Securely fetch a remote image for Keystatic import.
 * `fetchImpl` is injectable for tests.
 */
export async function importImageFromUrl(
  rawUrl: string,
  opts: {
    slug?: string;
    fetchImpl?: typeof fetch;
    resolveHostname?: ResolveHostname;
    timeoutMs?: number;
    maxRedirects?: number;
    maxBytes?: number;
  } = {}
): Promise<ImageImportSuccess | ImageImportFailure> {
  const fetchImpl = opts.fetchImpl ?? fetch;
  const resolveHostname = opts.resolveHostname ?? defaultResolveHostname;
  const timeoutMs = opts.timeoutMs ?? IMAGE_IMPORT.timeoutMs;
  const maxRedirects = opts.maxRedirects ?? IMAGE_IMPORT.maxRedirects;
  const maxBytes = opts.maxBytes ?? IMAGE_IMPORT.maxBytes;

  const initial = validateImageImportUrl(rawUrl);
  if (!initial.ok) return { error: initial.error };

  let current = initial.url;
  let response: Response | null = null;

  try {
    for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount++) {
      await assertHostnameSafe(current.hostname, resolveHostname);

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        response = await fetchImpl(current.toString(), {
          method: 'GET',
          redirect: 'manual',
          signal: controller.signal,
          headers: {
            Accept: 'image/*,*/*;q=0.8',
            'User-Agent': 'IEHA-Keystatic-ImageImport/1.0',
          },
        });
      } finally {
        clearTimeout(timer);
      }

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get('location');
        if (!location) return { error: 'Redirect missing Location header.' };
        if (redirectCount === maxRedirects) {
          return { error: 'Too many redirects.' };
        }
        let next: URL;
        try {
          next = new URL(location, current);
        } catch {
          return { error: 'Invalid redirect URL.' };
        }
        const validated = validateImageImportUrl(next.toString());
        if (!validated.ok) return { error: validated.error };
        current = validated.url;
        continue;
      }

      break;
    }

    if (!response) return { error: 'Failed to fetch image.' };

    if (!response.ok) {
      return { error: `Remote server returned HTTP ${response.status}.` };
    }

    const declaredType = response.headers.get('content-type');
    if (declaredType && !contentTypeAllowed(declaredType) && !declaredType.startsWith('application/octet-stream')) {
      return { error: 'Remote Content-Type is not a supported image format.' };
    }

    const bytes = await readBodyWithLimit(response, maxBytes);
    if (bytes.byteLength === 0) return { error: 'Remote image was empty.' };

    const detected = detectImageMime(bytes);
    if (!detected || !IMAGE_IMPORT.allowedMimeTypes.has(detected)) {
      return { error: 'Downloaded bytes are not a supported image format.' };
    }

    // If Content-Type was present and specific, it should agree with magic bytes.
    if (declaredType) {
      const mime = declaredType.split(';')[0]?.trim().toLowerCase();
      if (
        IMAGE_IMPORT.allowedMimeTypes.has(mime) &&
        mime !== detected &&
        !(mime === 'image/jpg' && detected === 'image/jpeg')
      ) {
        return { error: 'Content-Type does not match the image contents.' };
      }
    }

    const filename = buildImportFilename({
      slug: opts.slug,
      mime: detected,
      bytes,
    });
    const extension = filename.split('.').pop()!;

    return {
      filename,
      extension,
      mimeType: detected,
      byteLength: bytes.byteLength,
      dataBase64: Buffer.from(bytes).toString('base64'),
      sourceUrl: initial.url.toString(),
    };
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return { error: 'Timed out while fetching the image.' };
    }
    const message = err instanceof Error ? err.message : 'Failed to import image.';
    // Avoid leaking internal details / paths.
    if (/not allowed|resolve|exceeds|Invalid|Localhost|Private/i.test(message)) {
      return { error: message };
    }
    return { error: 'Failed to import image.' };
  }
}
