// CryptoDash — API Service (fetch queue, rate-limiting, caching)

import { CONFIG } from '../config/constants';

let lastRequestTime = 0;
const fetchQueue: { url: string; resolve: (data: unknown) => void; reject: (error: Error) => void }[] = [];
let queueRunning = false;

export class RateLimitError extends Error {
  constructor() { super('Rate limited (429)'); this.name = 'RateLimitError'; }
}

export const rawFetch = async (url: string, timeout = CONFIG.REQUEST_TIMEOUT): Promise<unknown> => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  try {
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (res.status === 429) throw new RateLimitError();
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
};

const isValidResponse = (data: unknown): boolean => {
  if (data === null || data === undefined) return false;
  if (typeof data === 'string') return false;
  if (typeof data === 'object' && data !== null) {
    if ('error' in data) return false;
    const d = data as { status?: { error_code?: number } };
    if (d.status?.error_code) return false;
  }
  return true;
};

// In-memory response cache to avoid redundant API calls
const responseCache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 180_000; // 3 minutes — stay within CoinGecko free-tier limits
const STALE_TTL = 600_000; // 10 minutes — serve stale if API is unavailable

export const fetchWithFallback = async (url: string): Promise<unknown> => {
  // 0. Check local cache first (fresh)
  const cached = responseCache.get(url);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  // 1. Try proxied API path with a single retry on rate-limit
  const maxRetries = 2;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const data = await rawFetch(url, 10000);
      if (isValidResponse(data)) {
        responseCache.set(url, { data, ts: Date.now() });
        return data;
      }
    } catch (e) {
      if (e instanceof RateLimitError) {
        // On 429, return stale cache if available instead of burning more quota
        if (cached && Date.now() - cached.ts < STALE_TTL) {
          console.warn(`Rate limited on ${url}, using stale cache`);
          return cached.data;
        }
        if (attempt < maxRetries - 1) {
          const backoff = 8000 * (attempt + 1); // 8s, 16s
          console.warn(`Rate limited, retry ${attempt + 1}/${maxRetries} in ${backoff / 1000}s...`);
          await new Promise(r => setTimeout(r, backoff));
          continue;
        }
        throw e;
      }
    }
  }

  // 2. Fallback: CORS proxy services (only for static hosting without backend)
  if (location.hostname === 'localhost' || location.hostname === '127.0.0.1') {
    throw new Error('Proxy request failed');
  }

  const fullUrl = url.startsWith('/api/coingecko')
    ? CONFIG.COINGECKO_BASE + url.replace('/api/coingecko', '')
    : url;

  for (const proxyBase of CONFIG.CORS_PROXIES) {
    try {
      const encoded = encodeURIComponent(fullUrl);
      const data = await rawFetch(proxyBase + encoded);
      if (isValidResponse(data)) return data;
    } catch {
      continue;
    }
  }

  throw new Error('All fetch attempts failed');
};

const processQueue = async (): Promise<void> => {
  queueRunning = true;

  while (fetchQueue.length) {
    const { url, resolve, reject } = fetchQueue.shift()!;
    const now = Date.now();
    const wait = CONFIG.REQUEST_DELAY - (now - lastRequestTime);
    if (wait > 0) await new Promise(r => setTimeout(r, wait));
    lastRequestTime = Date.now();

    try {
      const data = await fetchWithFallback(url);
      resolve(data);
    } catch (e) {
      reject(e instanceof Error ? e : new Error('Fetch failed'));
    }
  }

  queueRunning = false;
};

export const fetchJSON = async (url: string): Promise<unknown | null> => {
  try {
    return await new Promise((resolve, reject) => {
      fetchQueue.push({ url, resolve, reject });
      if (!queueRunning) processQueue();
    });
  } catch (e) {
    console.warn('Fetch queue error', url, e);
    return null;
  }
};
