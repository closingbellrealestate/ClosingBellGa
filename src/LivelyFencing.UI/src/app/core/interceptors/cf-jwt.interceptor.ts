import { HttpInterceptorFn } from '@angular/common/http';
import { from, switchMap } from 'rxjs';

// Module-level cache so every request after the first uses the stored token
let tokenPromise: Promise<string | null> | null = null;
let tokenFetchedAt = 0;
const TOKEN_TTL_MS = 4 * 60 * 1000; // refresh every 4 minutes

// Public API paths that do NOT require authentication. Requests to these
// endpoints must NOT block on the Cloudflare Access identity fetch, because
// in-app browsers (Facebook, Instagram, etc.) often hang or get challenged
// when calling /cdn-cgi/access/get-identity, which would otherwise prevent
// the public listings page from ever loading.
const PUBLIC_PATH_PATTERNS = [
  /\/listings(\/|$|\?)/,
  /\/contact(\/|$|\?)/,
  /\/reviews(\/|$|\?)/,
  /\/site-settings\/carousel(\/|$|\?)/,
  /\/health(\/|$|\?)/
];

function isPublicRequest(url: string): boolean {
  return PUBLIC_PATH_PATTERNS.some(re => re.test(url));
}

function getToken(): Promise<string | null> {
  const now = Date.now();

  // 1. If non-HttpOnly cookie is present, use it directly
  const cookie = getCookie('CF_Authorization');
  if (cookie) return Promise.resolve(cookie);

  // 2. Otherwise call the Cloudflare Access identity endpoint (same-origin, cookie sent automatically)
  if (!tokenPromise || now - tokenFetchedAt > TOKEN_TTL_MS) {
    tokenFetchedAt = now;
    // Hard timeout so a hung CF Access challenge (common in Facebook/Instagram
    // in-app browsers) doesn't block all subsequent API requests indefinitely.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    tokenPromise = fetch('/cdn-cgi/access/get-identity', {
      credentials: 'include',
      signal: controller.signal
    })
      .then(r => (r.ok ? r.json() : null))
      .then((data: { jwt?: string } | null) => data?.jwt ?? null)
      .catch(() => null)
      .finally(() => clearTimeout(timeoutId));
  }
  return tokenPromise;
}

/**
 * Cloudflare Zero Trust sets CF_Authorization (HttpOnly).
 * For SPAs, CF Access exposes /cdn-cgi/access/get-identity which returns
 * the JWT that can be forwarded as a Bearer token to the API.
 *
 * Public endpoints (listings, reviews, etc.) bypass the token fetch entirely
 * so the page works in environments where Cloudflare Access cannot complete
 * (e.g., Facebook/Instagram in-app browsers).
 */
export const cfJwtInterceptor: HttpInterceptorFn = (req, next) => {
  if (isPublicRequest(req.url)) {
    return next(req);
  }
  return from(getToken()).pipe(
    switchMap(token => {
      if (token) {
        req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
      }
      return next(req);
    })
  );
};

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}
