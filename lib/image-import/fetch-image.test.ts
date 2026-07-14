import { describe, expect, it, vi } from 'vitest';
import { detectImageMime, IMAGE_IMPORT } from '@/lib/image-import/constants';
import { buildImportFilename, extensionForMime, sanitizeFilenameBase } from '@/lib/image-import/filename';
import { importImageFromUrl } from '@/lib/image-import/fetch-image';
import { isBlockedIpAddress, validateImageImportUrl } from '@/lib/image-import/validate-url';
import { assertKeystaticAuthenticated } from '@/lib/image-import/auth';
import { fields } from '@keystatic/core';
import { catalogueImageField } from '@/lib/keystatic/catalogue-image-field';

const JPEG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
const WEBP = Uint8Array.from([
  0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50,
]);

function imageResponse(bytes: Uint8Array, contentType: string, init: ResponseInit = {}): Response {
  const buffer = bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength
  ) as ArrayBuffer;
  return new Response(buffer, {
    status: 200,
    ...init,
    headers: { 'Content-Type': contentType, ...(init.headers ?? {}) },
  });
}

const publicResolve = async () => ['93.184.216.34'];

async function importOk(url: string, opts: Parameters<typeof importImageFromUrl>[1] = {}) {
  return importImageFromUrl(url, { resolveHostname: publicResolve, ...opts });
}

describe('validateImageImportUrl', () => {
  it('rejects malformed URLs', () => {
    expect(validateImageImportUrl('not a url').ok).toBe(false);
  });

  it('rejects non-http(s), credentials, localhost, and private IPs', () => {
    expect(validateImageImportUrl('ftp://example.com/a.jpg').ok).toBe(false);
    expect(validateImageImportUrl('https://user:pass@example.com/a.jpg').ok).toBe(false);
    expect(validateImageImportUrl('http://localhost/a.jpg').ok).toBe(false);
    expect(validateImageImportUrl('http://127.0.0.1/a.jpg').ok).toBe(false);
    expect(validateImageImportUrl('http://192.168.1.10/a.jpg').ok).toBe(false);
    expect(validateImageImportUrl('http://10.0.0.2/a.jpg').ok).toBe(false);
    expect(validateImageImportUrl('http://[::1]/a.jpg').ok).toBe(false);
  });

  it('accepts public https URLs', () => {
    const result = validateImageImportUrl('https://cdn.example.org/path/art.jpg?x=1');
    expect(result.ok).toBe(true);
  });
});

describe('isBlockedIpAddress', () => {
  it('blocks private and loopback ranges', () => {
    expect(isBlockedIpAddress('127.0.0.1')).toBe(true);
    expect(isBlockedIpAddress('10.1.2.3')).toBe(true);
    expect(isBlockedIpAddress('172.16.0.1')).toBe(true);
    expect(isBlockedIpAddress('169.254.1.1')).toBe(true);
    expect(isBlockedIpAddress('8.8.8.8')).toBe(false);
  });
});

describe('detectImageMime / filename helpers', () => {
  it('detects JPEG PNG WebP magic bytes', () => {
    expect(detectImageMime(JPEG)).toBe('image/jpeg');
    expect(detectImageMime(PNG)).toBe('image/png');
    expect(detectImageMime(WEBP)).toBe('image/webp');
    expect(detectImageMime(Uint8Array.from([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]))).toBeNull();
  });

  it('maps MIME to extension and sanitizes filenames', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg');
    expect(sanitizeFilenameBase('My Art!! Work?.jpg')).toBe('my-art-work-jpg');
    const name = buildImportFilename({
      slug: 'cubo-futurist-composition',
      mime: 'image/jpeg',
      bytes: JPEG,
    });
    expect(name).toMatch(/^cubo-futurist-composition-[a-f0-9]{8}\.jpg$/);
    expect(name.includes('?')).toBe(false);
  });
});

describe('importImageFromUrl', () => {
  it('imports a valid JPEG through the Keystatic-compatible payload', async () => {
    const fetchImpl = vi.fn(async () => imageResponse(JPEG, 'image/jpeg'));
    const result = await importOk('https://cdn.example.org/a.jpg', {
      slug: 'work-a',
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect('error' in result).toBe(false);
    if ('error' in result) return;
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.extension).toBe('jpg');
    expect(result.filename).toMatch(/^work-a-[a-f0-9]{8}\.jpg$/);
    expect(result.dataBase64).toBe(Buffer.from(JPEG).toString('base64'));
    expect(result.sourceUrl).toBe('https://cdn.example.org/a.jpg');

    const field = fields.image({
      label: 'Image',
      directory: 'public/catalogue',
      publicPath: '/catalogue/',
    });
    const serialized = field.serialize(
      {
        data: Buffer.from(result.dataBase64, 'base64'),
        extension: result.extension,
        filename: result.filename,
      },
      { suggestedFilenamePrefix: 'image', slug: 'work-a' }
    );
    expect(serialized.asset?.content.byteLength).toBe(JPEG.byteLength);
    expect(serialized.value).toBeTruthy();
  });

  it('imports PNG and WebP', async () => {
    for (const [bytes, mime, ext] of [
      [PNG, 'image/png', 'png'],
      [WEBP, 'image/webp', 'webp'],
    ] as const) {
      const result = await importOk('https://cdn.example.org/a', {
        fetchImpl: (async () => imageResponse(bytes, mime)) as unknown as typeof fetch,
      });
      expect('error' in result).toBe(false);
      if ('error' in result) continue;
      expect(result.extension).toBe(ext);
    }
  });

  it('rejects unsupported MIME / non-image bytes', async () => {
    const badMime = await importOk('https://cdn.example.org/a', {
      fetchImpl: (async () =>
        new Response('hello', {
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        })) as unknown as typeof fetch,
    });
    expect(badMime).toEqual({ error: expect.stringMatching(/Content-Type|supported/i) });

    const nonImage = await importOk('https://cdn.example.org/a', {
      fetchImpl: (async () =>
        imageResponse(
          Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
          'application/octet-stream'
        )) as unknown as typeof fetch,
    });
    expect(nonImage).toEqual({ error: expect.stringMatching(/supported image/i) });
  });

  it('rejects oversized responses', async () => {
    const big = new Uint8Array(100);
    big.set(JPEG, 0);
    const result = await importOk('https://cdn.example.org/a.jpg', {
      maxBytes: 20,
      fetchImpl: (async () => imageResponse(big, 'image/jpeg')) as unknown as typeof fetch,
    });
    expect(result).toEqual({ error: expect.stringMatching(/maximum allowed size/i) });
  });

  it('rejects timeouts', async () => {
    const result = await importOk('https://cdn.example.org/a.jpg', {
      timeoutMs: 20,
      fetchImpl: (async (_url: RequestInfo | URL, init?: RequestInit) => {
        await new Promise((_, reject) => {
          init?.signal?.addEventListener('abort', () => {
            const err = new Error('aborted');
            err.name = 'AbortError';
            reject(err);
          });
        });
        return imageResponse(JPEG, 'image/jpeg');
      }) as unknown as typeof fetch,
    });
    expect(result).toEqual({ error: expect.stringMatching(/Timed out/i) });
  });

  it('rejects redirect to a private address', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('cdn.example.org')) {
        return new Response(null, {
          status: 302,
          headers: { Location: 'http://127.0.0.1/secret.jpg' },
        });
      }
      return imageResponse(JPEG, 'image/jpeg');
    });
    const result = await importOk('https://cdn.example.org/a.jpg', {
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });
    expect(result).toEqual({ error: expect.stringMatching(/not allowed|Localhost|Private/i) });
  });

  it('rejects DNS that resolves to a private address', async () => {
    const result = await importImageFromUrl('https://cdn.example.org/a.jpg', {
      resolveHostname: async () => ['10.0.0.5'],
      fetchImpl: (async () => imageResponse(JPEG, 'image/jpeg')) as unknown as typeof fetch,
    });
    expect(result).toEqual({ error: expect.stringMatching(/not allowed/i) });
  });

  it('rejects failed remote responses and malformed URLs', async () => {
    expect(await importImageFromUrl('::::')).toEqual({ error: expect.any(String) });
    const failed = await importOk('https://cdn.example.org/missing.jpg', {
      fetchImpl: (async () => new Response('nope', { status: 404 })) as unknown as typeof fetch,
    });
    expect(failed).toEqual({ error: expect.stringMatching(/HTTP 404/) });
  });
});

describe('assertKeystaticAuthenticated', () => {
  it('rejects anonymous requests', () => {
    const res = assertKeystaticAuthenticated(new Request('http://localhost/api'));
    expect(res?.status).toBe(401);
  });

  it('allows requests with Keystatic GitHub cookie', () => {
    const res = assertKeystaticAuthenticated(
      new Request('http://localhost/api', {
        headers: { cookie: 'keystatic-gh-access-token=abc' },
      })
    );
    expect(res).toBeNull();
  });
});

describe('catalogue image field wrapper', () => {
  it('keeps AssetFormField storage compatible with fields.image', () => {
    const wrapped = catalogueImageField({
      label: 'Image',
      directory: 'public/catalogue',
      publicPath: '/catalogue/',
    });
    const base = fields.image({
      label: 'Image',
      directory: 'public/catalogue',
      publicPath: '/catalogue/',
    });
    expect(wrapped.formKind).toBe('asset');
    expect(wrapped.directory).toBe(base.directory);

    const serialized = wrapped.serialize(
      { data: JPEG, extension: 'jpg', filename: 'imported.jpg' },
      { suggestedFilenamePrefix: 'image', slug: 'demo' }
    );
    expect(serialized.asset?.filename).toMatch(/\.jpg$/);
    expect(serialized.value).toBeTruthy();
    expect(String(serialized.value).startsWith('http')).toBe(false);
  });
});

describe('IMAGE_IMPORT constants', () => {
  it('exposes configurable limits', () => {
    expect(IMAGE_IMPORT.timeoutMs).toBe(15_000);
    expect(IMAGE_IMPORT.maxRedirects).toBe(5);
    expect(IMAGE_IMPORT.maxBytes).toBe(20 * 1024 * 1024);
    expect(IMAGE_IMPORT.allowedMimeTypes.has('image/svg+xml')).toBe(false);
  });
});
