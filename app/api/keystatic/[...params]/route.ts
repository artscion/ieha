import { makeRouteHandler } from '@keystatic/next/route-handler';
import keystaticConfig from '../../../../keystatic.config';

const { GET: keystaticGET, POST: keystaticPOST } = makeRouteHandler({
  config: keystaticConfig,
});

// On Netlify the serverless function receives the per-deploy host
// (e.g. <deploy-id>--ieha.netlify.app) as request.url, and Keystatic derives
// the GitHub OAuth redirect_uri from that origin. GitHub then rejects sign-in
// because only https://ieha.fr/... (and localhost) are registered callback
// URLs. Pin the origin to KEYSTATIC_URL when set (production); leave it unset
// locally so http://localhost dev keeps working.
function pinOrigin(request: Request): Request {
  const canonical = process.env.KEYSTATIC_URL;
  if (!canonical) return request;
  const current = new URL(request.url);
  const target = new URL(canonical);
  if (current.host === target.host && current.protocol === target.protocol) {
    return request;
  }
  current.protocol = target.protocol;
  current.host = target.host;
  return new Request(current.toString(), request);
}

const AUTH_FAILED_HELP = `Authorization failed

Keystatic could not exchange the GitHub OAuth code for tokens (or the code was
already used). The authorize step only needs the Client ID; this step needs a
matching Client Secret and a token response that includes refresh_token.

Check, then start again from /keystatic (do not reload this callback URL):

1. Netlify env vars match the GitHub App "IEHA Keystatic" (client id Iv23…):
   KEYSTATIC_GITHUB_CLIENT_ID
   KEYSTATIC_GITHUB_CLIENT_SECRET
   KEYSTATIC_SECRET  (random string ≥32 chars, NOT a SHA256: fingerprint)
   KEYSTATIC_URL=https://ieha.fr
   NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG=ieha-keystatic

2. GitHub App → Optional features → "Expire user authorization tokens" is ON.
   Keystatic requires expires_in + refresh_token in the token response.

3. GitHub App callback URLs include exactly:
   https://ieha.fr/api/keystatic/github/oauth/callback
`;

function isOauthCallback(request: Request): boolean {
  try {
    return new URL(request.url).pathname.includes('/github/oauth/callback');
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  const pinned = pinOrigin(request);
  const response = await keystaticGET(pinned);

  // Keystatic maps every failed token exchange (wrong secret, spent code,
  // missing refresh_token, …) to a bare "Authorization failed". Expand it.
  if (response.status === 401 && isOauthCallback(pinned)) {
    const body = await response.text();
    if (body.trim() === 'Authorization failed') {
      return new Response(AUTH_FAILED_HELP, {
        status: 401,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    return new Response(body, {
      status: response.status,
      headers: response.headers,
    });
  }

  return response;
}

export function POST(request: Request) {
  return keystaticPOST(pinOrigin(request));
}
