import { isIP } from 'node:net';
import { IMAGE_IMPORT } from './constants';

export type UrlValidationResult =
  | { ok: true; url: URL }
  | { ok: false; error: string };

function isPrivateOrReservedIpv4(ip: string): boolean {
  const parts = ip.split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 100 && b >= 64 && b <= 127) return true; // carrier-grade NAT
  if (a >= 224) return true; // multicast / reserved
  return false;
}

function isPrivateOrReservedIpv6(ip: string): boolean {
  const normalized = ip.toLowerCase();
  if (normalized === '::' || normalized === '::1') return true;
  if (normalized.startsWith('fc') || normalized.startsWith('fd')) return true; // unique local
  if (normalized.startsWith('fe80')) return true; // link-local
  if (normalized.startsWith('ff')) return true; // multicast
  // IPv4-mapped IPv6
  if (normalized.includes('.')) {
    const v4 = normalized.slice(normalized.lastIndexOf(':') + 1);
    if (isIP(v4) === 4) return isPrivateOrReservedIpv4(v4);
  }
  return false;
}

export function isBlockedIpAddress(address: string): boolean {
  const version = isIP(address);
  if (version === 4) return isPrivateOrReservedIpv4(address);
  if (version === 6) return isPrivateOrReservedIpv6(address);
  return true;
}

export function validateImageImportUrl(raw: string): UrlValidationResult {
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    return { ok: false, error: 'Invalid URL.' };
  }

  if (!IMAGE_IMPORT.allowedProtocols.has(url.protocol)) {
    return { ok: false, error: 'Only http and https URLs are allowed.' };
  }

  if (url.username || url.password) {
    return { ok: false, error: 'URLs with embedded credentials are not allowed.' };
  }

  const hostname = url.hostname.replace(/^\[|\]$/g, '').toLowerCase();
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname === '0.0.0.0' ||
    hostname === '::1'
  ) {
    return { ok: false, error: 'Localhost URLs are not allowed.' };
  }

  if (isIP(hostname) && isBlockedIpAddress(hostname)) {
    return { ok: false, error: 'Private or reserved IP addresses are not allowed.' };
  }

  return { ok: true, url };
}
