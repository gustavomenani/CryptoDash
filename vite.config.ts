import { defineConfig } from 'vite';
import { resolve } from 'path';

// ── Dev-proxy cache (avoids 429s from CoinGecko during development) ──
const devCache = new Map<string, { body: string; ts: number }>();
const DEV_CACHE_TTL = 180_000; // 3 minutes

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@types': resolve(__dirname, 'src/types'),
      '@utils': resolve(__dirname, 'src/utils'),
      '@services': resolve(__dirname, 'src/services'),
      '@i18n': resolve(__dirname, 'src/i18n'),
    },
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api/coingecko': {
        target: 'https://api.coingecko.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/coingecko/, '/api/v3'),
        configure: (proxy) => {
          proxy.on('error', () => {});
          // Cache successful proxy responses in memory
          proxy.on('proxyRes', (proxyRes, req) => {
            if (proxyRes.statusCode === 200) {
              const chunks: Buffer[] = [];
              proxyRes.on('data', (chunk: Buffer) => chunks.push(chunk));
              proxyRes.on('end', () => {
                const body = Buffer.concat(chunks).toString();
                if (body) devCache.set(req.url || '', { body, ts: Date.now() });
              });
            }
          });
        },
        bypass(req, res) {
          const key = req.url || '';
          const cached = devCache.get(key);
          if (cached && Date.now() - cached.ts < DEV_CACHE_TTL && res) {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('X-Dev-Cache', 'HIT');
            res.end(cached.body);
            return false; // skip proxy
          }
        },
      },
      '/api/news': {
        target: 'https://min-api.cryptocompare.com',
        changeOrigin: true,
        rewrite: (path) => {
          const url = new URL(path, 'http://localhost');
          url.pathname = '/data/v2/news/';
          if (!url.searchParams.has('sortOrder')) url.searchParams.set('sortOrder', 'latest');
          return url.pathname + url.search;
        },
        configure: (proxy) => {
          proxy.on('error', () => {});
        },
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'chart.js': ['chart.js'],
        },
      },
    },
  },
});
