// CryptoDash — News Feature (Real-time via CryptoCompare + CoinGecko fallback)

import { CONFIG, MOCK_NEWS } from '../config/constants';
import { state } from '../core/state';
import { el } from '../core/dom';
import { escapeHtml } from '../utils/helpers';
import { i18n } from '../i18n/index';

import type { NewsItem } from '../types/index';

// ============================================
// News Cache
// ============================================
let newsCache: { data: NewsItem[]; ts: number } | null = null;

/** Clear the news cache so next fetch gets fresh data */
export const invalidateNewsCache = (): void => { newsCache = null; };

// ============================================
// Fetch Real News (CryptoCompare → CoinGecko Trending → Mock)
// ============================================

export const fetchNews = async (): Promise<NewsItem[]> => {
  // Return cached news if still fresh
  if (newsCache && Date.now() - newsCache.ts < CONFIG.NEWS_CACHE_TTL) {
    return newsCache.data;
  }

  // 1️⃣ Try CryptoCompare News API (best source — real articles)
  try {
    const locale = i18n.getLocale();
    const langMap: Record<string, string> = { 'pt-BR': 'PT', es: 'ES', en: 'EN' };
    const preferredLang = langMap[locale] || 'EN';
    // Try preferred language first, fallback to EN if no recent articles
    const langsToTry = preferredLang !== 'EN' ? [preferredLang, 'EN'] : ['EN'];

    for (const lang of langsToTry) {
      const lTs = Math.floor(Date.now() / 1000);
      const res = await fetch(`${CONFIG.NEWS_API}?lang=${lang}&sortOrder=latest&lTs=${lTs}`);

      if (res.ok) {
        const json = await res.json();
        if (json.Data && Array.isArray(json.Data) && json.Data.length > 0) {
          const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
          const articles: NewsItem[] = json.Data
            .filter((item: any) => (item.published_on || 0) * 1000 >= thirtyDaysAgo)
            .slice(0, 12)
            .map((item: any) => ({
              title: item.title || 'Crypto News',
              description: (item.body || '').substring(0, 160) + '…',
              url: item.url || item.guid || '#',
              source: item.source_info?.name || item.source || 'CryptoCompare',
              image: item.imageurl || '',
              publishedAt: new Date((item.published_on || 0) * 1000).toISOString(),
            }));

          if (articles.length > 0) {
            newsCache = { data: articles, ts: Date.now() };
            return articles;
          }
        }
      }
    }
  } catch {
    // CryptoCompare failed, try fallback
  }

  // 2️⃣ Fallback: CoinGecko Trending (converts trending coins to news-like items)
  try {
    const res = await fetch(`${CONFIG.API_BASE}/search/trending`);
    if (res.ok) {
      const json = await res.json();
      if (json.coins?.length) {
        const articles: NewsItem[] = json.coins.slice(0, 8).map((c: any) => ({
          title: `${c.item.name} (${c.item.symbol}) está em alta`,
          description: `Market cap rank #${c.item.market_cap_rank ?? '—'}. Uma das moedas mais pesquisadas no momento.`,
          url: `https://www.coingecko.com/coins/${c.item.id}`,
          source: 'CoinGecko Trending',
          image: c.item.large || c.item.thumb || '',
          publishedAt: new Date().toISOString(),
        }));

        newsCache = { data: articles, ts: Date.now() };
        return articles;
      }
    }
  } catch {
    // CoinGecko trending also failed
  }

  // 3️⃣ Final fallback: mock news
  return MOCK_NEWS;
};

// ============================================
// Render News
// ============================================

export const renderNews = (news: NewsItem[]): void => {
  const grid = el.newsGrid;
  if (!grid) return;

  state.news = news;

  grid.innerHTML = news.map(n => {
    const time = i18n.formatRelativeTime(new Date(n.publishedAt));
    const imgHtml = n.image
      ? `<img class="news-img" src="${escapeHtml(n.image)}" alt="${escapeHtml(n.title)}" loading="lazy" onerror="this.style.display='none'" />`
      : `<div class="news-img" style="display:flex;align-items:center;justify-content:center;background:var(--bg-input)"><i class="ph-light ph-newspaper" style="font-size:2.5rem;color:var(--text-muted)"></i></div>`;
    return `<article class="news-card">
      <a href="${escapeHtml(n.url)}" target="_blank" rel="noopener noreferrer">
        ${imgHtml}
        <div class="news-body">
          <h3 class="news-title">${escapeHtml(n.title)}</h3>
          <p class="news-desc">${escapeHtml(n.description)}</p>
          <div class="news-meta"><span>${escapeHtml(n.source)}</span><span>·</span><span>${time}</span></div>
        </div>
      </a>
    </article>`;
  }).join('');
};


