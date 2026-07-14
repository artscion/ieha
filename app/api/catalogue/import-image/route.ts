import { assertKeystaticAuthenticated } from '@/lib/image-import/auth';
import { importImageFromUrl } from '@/lib/image-import/fetch-image';

export const runtime = 'nodejs';

type Body = {
  url?: unknown;
  slug?: unknown;
};

export async function POST(request: Request) {
  const unauthorized = assertKeystaticAuthenticated(request);
  if (unauthorized) return unauthorized;

  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return Response.json({ error: 'Expected JSON body.' }, { status: 400 });
  }

  const url = typeof body.url === 'string' ? body.url : '';
  const slug = typeof body.slug === 'string' ? body.slug : undefined;
  if (!url.trim()) {
    return Response.json({ error: 'URL is required.' }, { status: 400 });
  }

  const result = await importImageFromUrl(url, { slug });
  if ('error' in result) {
    return Response.json({ error: result.error }, { status: 400 });
  }

  return Response.json(result);
}
