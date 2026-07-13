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

export function GET(request: Request) {
  return keystaticGET(pinOrigin(request));
}

export function POST(request: Request) {
  return keystaticPOST(pinOrigin(request));
}
