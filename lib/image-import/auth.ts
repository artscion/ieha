/**
 * Keystatic GitHub storage sets `keystatic-gh-access-token` after OAuth.
 * Reject anonymous callers so this route cannot be used as an open proxy.
 *
 * In local development without a token, allow only when explicitly opted in
 * via KEYSTATIC_IMAGE_IMPORT_DEV_OPEN=1 (never set in production).
 */
export function assertKeystaticAuthenticated(request: Request): Response | null {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const hasToken = /(?:^|;\s*)keystatic-gh-access-token=([^;]+)/.test(cookieHeader);
  if (hasToken) {
    return null;
  }

  if (
    process.env.NODE_ENV !== 'production' &&
    process.env.KEYSTATIC_IMAGE_IMPORT_DEV_OPEN === '1'
  ) {
    return null;
  }

  return Response.json(
    { error: 'Sign in to Keystatic before importing images.' },
    { status: 401 }
  );
}
