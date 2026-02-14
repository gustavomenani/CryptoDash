import express from 'express';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// ── In-memory cache ──────────────────────────────────────
const cache = new Map();
const CACHE_TTL = 300_000; // 5 minutes

function getCached(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    const ttl = entry.ttl || CACHE_TTL;
    if (Date.now() - entry.timestamp > ttl) {
        cache.delete(key);
        return null;
    }
    return entry.data;
}

function setCache(key, data, ttl = CACHE_TTL) {
    cache.set(key, { data, timestamp: Date.now(), ttl });
    // Cleanup old entries every 100 inserts
    if (cache.size > 200) {
        const now = Date.now();
        for (const [k, v] of cache) {
            if (now - v.timestamp > CACHE_TTL * 5) cache.delete(k);
        }
    }
}

// ── CoinGecko API Proxy ──────────────────────────────────
app.use('/api/coingecko', async (req, res) => {
    const apiPath = req.url; // e.g. /coins/markets?vs_currency=usd&...
    const cacheKey = `coingecko:${apiPath}`;

    // Check cache first
    const cached = getCached(cacheKey);
    if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
    }

    const targetUrl = `https://api.coingecko.com/api/v3${apiPath}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'CryptoDash/1.0',
            },
        });

        clearTimeout(timeout);

        if (response.status === 429) {
            console.warn(`[API] Rate limit hit for ${apiPath}`);
            const errorPayload = { status: { error_code: 429, error_message: 'Rate limit exceeded' } };
            // Cache rate limit for 60s
            setCache(cacheKey, errorPayload, 60_000);
            return res.status(429).json(errorPayload);
        }

        if (!response.ok) {
            return res.status(response.status).json({
                error: `CoinGecko API returned ${response.status}`,
                status: response.status,
            });
        }

        const data = await response.json();

        // Cache successful responses
        setCache(cacheKey, data);

        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', 'public, max-age=60');
        res.json(data);
    } catch (err) {
        console.error(`[API] Error fetching ${apiPath}:`, err.message);
        res.status(502).json({
            error: 'Failed to fetch data from CoinGecko',
            message: err.message,
        });
    }
});

// ── CryptoCompare News Proxy ──────────────────────────────
app.get('/api/news', async (req, res) => {
    const lang = req.query.lang || 'EN';
    const cacheKey = `news:${lang}`;
    const cached = getCached(cacheKey);
    if (cached) {
        res.set('X-Cache', 'HIT');
        return res.json(cached);
    }

    const lTs = Math.floor(Date.now() / 1000);
    const targetUrl = `https://min-api.cryptocompare.com/data/v2/news/?lang=${lang}&sortOrder=latest&lTs=${lTs}`;

    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(targetUrl, {
            signal: controller.signal,
            headers: { 'Accept': 'application/json', 'User-Agent': 'CryptoDash/1.0' },
        });

        clearTimeout(timeout);

        if (!response.ok) {
            return res.status(response.status).json({ error: `CryptoCompare returned ${response.status}` });
        }

        const data = await response.json();
        // Cache news for 10 minutes
        setCache(cacheKey, data, 600_000);

        res.set('X-Cache', 'MISS');
        res.set('Cache-Control', 'public, max-age=300');
        res.json(data);
    } catch (err) {
        console.error('[News] Error:', err.message);
        res.status(502).json({ error: 'Failed to fetch news' });
    }
});

// ── API Health Check ─────────────────────────────────────
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        cache_size: cache.size,
        timestamp: new Date().toISOString(),
    });
});

// ── API Info ─────────────────────────────────────────────
app.get('/api', (_req, res) => {
    res.json({
        name: 'CryptoDash API',
        version: '1.0.0',
        endpoints: {
            '/api/coingecko/*': 'Proxied CoinGecko API with 5min caching',
            '/api/news': 'Proxied CryptoCompare news with 10min caching',
            '/api/health': 'Server health check',
        },
        docs: 'https://www.coingecko.com/en/api/documentation',
    });
});

// ── Serve static files (production) ──────────────────────
app.use(express.static(join(__dirname, 'dist')));

// SPA fallback — serve index.html for all non-API routes
app.get('/{*path}', (_req, res) => {
    res.sendFile(join(__dirname, 'dist', 'index.html'));
});

// ── Start server ─────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🚀 CryptoDash API running at http://localhost:${PORT}`);
    console.log(`   📡 Proxy:  /api/coingecko/* → api.coingecko.com`);
    console.log(`   💚 Health: /api/health`);
    console.log(`   📦 Static: ./dist\n`);
});
