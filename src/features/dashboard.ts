// CryptoDash — Dashboard Feature (Price Cards, Stats, Gainers/Losers, Chart, Fear & Greed)

import Chart from 'chart.js/auto';
import { state } from '../core/state';
import { el } from '../core/dom';
import { fetchJSON, rawFetch } from '../core/api';
import { CONFIG, MOCK_MARKETS } from '../config/constants';
import { escapeHtml, formatCurrency, formatCompact, formatPct } from '../utils/helpers';
import { i18n } from '../i18n/index';
import type { FearGreedData, MarketCoin, TimeFrame } from '../types/index';

// ============================================
// Price Cards
// ============================================

export const renderPriceCards = (): void => {
  const container = el.priceCards;
  if (!container) return;

  const top = state.markets.slice(0, 8);
  container.innerHTML = top.map(c => {
    const change = c.price_change_percentage_24h || 0;
    const cls = change >= 0 ? 'positive' : 'negative';
    const icon = change >= 0 ? 'trend-up' : 'trend-down';
    const isFav = state.favorites.includes(c.id);
    return `
      <div class="card" data-coin="${c.id}">
        <div class="card-head">
          <div class="card-coin">
            <img src="${c.image}" alt="${escapeHtml(c.name)}" width="28" height="28" loading="lazy" />
            <div><strong>${escapeHtml(c.name)}</strong><br><span>${escapeHtml(c.symbol.toUpperCase())}</span></div>
          </div>
          <span class="card-fav ${isFav ? 'active' : ''}" data-fav="${c.id}" title="Favoritar"><i class="ph-light ph-star${isFav ? '-fill' : ''}"></i></span>
        </div>
        <div class="card-price">${formatCurrency(c.current_price)}</div>
        <div class="card-change ${cls}"><i class="ph-light ph-${icon}"></i> ${formatPct(change)}</div>
        <div class="card-sparkline"><canvas id="spark-${c.id}"></canvas></div>
      </div>`;
  }).join('');

  // Render sparklines
  setTimeout(() => {
    top.forEach(c => {
      const canvas = document.getElementById(`spark-${c.id}`) as HTMLCanvasElement | null;
      if (!canvas || !c.sparkline_in_7d?.price) return;

      const prices = c.sparkline_in_7d.price;
      const change = c.price_change_percentage_24h || 0;
      const color = change >= 0 ? '#22c55e' : '#ef4444';

      if (state.sparklines[c.id]) state.sparklines[c.id].destroy();

      state.sparklines[c.id] = new Chart(canvas, {
        type: 'line',
        data: {
          labels: prices.map((_, i) => i),
          datasets: [{
            data: prices,
            borderColor: color,
            borderWidth: 1.5,
            fill: true,
            backgroundColor: color + '15',
            pointRadius: 0,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: state.reducedMotion ? false : { duration: 600 }
        },
      });
    });
  }, 0);
};

// ============================================
// Fear & Greed Index
// ============================================

export const fetchFearGreed = async (): Promise<FearGreedData> => {
  try {
    const data = await rawFetch('https://api.alternative.me/fng/?limit=1', 8000) as { data: FearGreedData[] };
    if (data?.data?.[0]) return data.data[0];
  } catch (e) { console.warn('FearGreed fetch failed', e); }
  return { value: '72', value_classification: 'Greed' };
};

export const renderFearGreed = async (): Promise<void> => {
  const fg = await fetchFearGreed();
  const val = parseInt(fg.value);
  if (el.fgValue) el.fgValue.textContent = val.toString();
  if (el.fgSentiment) el.fgSentiment.textContent = fg.value_classification;
  if (el.fgFill) el.fgFill.style.width = val + '%';
};

// ============================================
// Stats
// ============================================

export const renderStats = (): void => {
  if (!state.global?.data) return;
  const d = state.global.data;
  const cur = state.currency;
  const btcDom = d.market_cap_percentage?.btc || 0;

  if (el.btcDominance) el.btcDominance.textContent = btcDom.toFixed(1) + '%';
  if (el.btcDominanceBar) el.btcDominanceBar.style.width = btcDom + '%';
  if (el.totalMarketCap) el.totalMarketCap.textContent = formatCompact(d.total_market_cap?.[cur] || 0);
  if (el.totalVolume) el.totalVolume.textContent = formatCompact(d.total_volume?.[cur] || 0);
  if (el.activeCryptos) el.activeCryptos.textContent = (d.active_cryptocurrencies || 0).toLocaleString(i18n.getLocale());
};

// ============================================
// Gainers & Losers
// ============================================

export const renderGainersLosers = (): void => {
  const sorted = [...state.markets].sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
  const gainers = sorted.slice(0, 5);
  const losers = sorted.slice(-5).reverse();

  const renderList = (list: MarketCoin[], container: HTMLElement | null) => {
    if (!container) return;
    container.innerHTML = list.map(c => {
      const change = c.price_change_percentage_24h || 0;
      const cls = change >= 0 ? 'positive' : 'negative';
      return `<li class="mover" data-coin="${c.id}">
        <img src="${c.image}" alt="${escapeHtml(c.name)}" width="24" height="24" loading="lazy" />
        <div class="mover-info"><div class="mover-name">${escapeHtml(c.name)}</div><div class="mover-price">${formatCurrency(c.current_price)}</div></div>
        <span class="mover-change ${cls}">${formatPct(change)}</span>
      </li>`;
    }).join('');
  };

  renderList(gainers, el.topGainers);
  renderList(losers, el.topLosers);
};

// ============================================
// Price Chart
// ============================================

export const fetchChartData = async (coinId: string, days: TimeFrame): Promise<[number, number][]> => {
  const url = `${CONFIG.API_BASE}/coins/${coinId}/market_chart?vs_currency=${state.currency}&days=${days}`;
  const data = await fetchJSON(url) as { prices?: [number, number][] } | null;
  if (data?.prices?.length) return data.prices;

  // Mock chart
  const basePrice = MOCK_MARKETS.find(c => c.id === coinId)?.current_price || 50000;
  const pts = days <= 1 ? 96 : days <= 7 ? 168 : days <= 30 ? 360 : days <= 90 ? 540 : 730;
  const now = Date.now();
  const step = (days * 86400000) / pts;
  return Array.from({ length: pts }, (_, i) => {
    const t = now - (pts - i) * step;
    const variation = basePrice * 0.05;
    return [t, basePrice + Math.sin(i / (pts * 0.1)) * variation + (Math.random() - 0.5) * variation * 0.5];
  });
};

export const renderChart = async (): Promise<void> => {
  if (el.chartLoader) el.chartLoader.hidden = false;
  const prices = await fetchChartData(state.selectedCoin, state.chartDays);
  if (el.chartLoader) el.chartLoader.hidden = true;
  if (!prices?.length) return;

  const labels = prices.map(p => {
    const d = new Date(p[0]);
    return state.chartDays <= 1
      ? d.toLocaleTimeString(i18n.getLocale(), { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(i18n.getLocale(), { day: '2-digit', month: 'short' });
  });

  const data = prices.map(p => p[1]);
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  const coin = MOCK_MARKETS.find(c => c.id === state.selectedCoin);
  if (el.chartSubtitle) el.chartSubtitle.textContent = i18n.t('dashboard.price') + ` — ${coin?.name || state.selectedCoin}`;
  if (el.selectedCoin) el.selectedCoin.textContent = coin?.symbol?.toUpperCase() || state.selectedCoin.toUpperCase();

  if (state.chartInstance) state.chartInstance.destroy();

  const canvas = el.priceChart as HTMLCanvasElement;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color + '30');
  gradient.addColorStop(1, color + '00');

  state.chartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels, datasets: [{
        label: 'Preço', data, borderColor: color, borderWidth: 2, backgroundColor: gradient,
        fill: true, pointRadius: 0, tension: 0.3, pointHitRadius: 10
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(17,24,39,.9)', titleColor: '#f1f5f9', bodyColor: '#94a3b8',
          borderColor: 'rgba(255,255,255,.1)', borderWidth: 1, padding: 12, displayColors: false,
          callbacks: { label: (ctx) => formatCurrency(ctx.parsed.y ?? 0) }
        }
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: '#475569', font: { size: 10 }, maxTicksLimit: 8 } },
        y: { grid: { color: 'rgba(255,255,255,.04)' }, ticks: { color: '#475569', font: { size: 10 }, callback: (v: number | string) => formatCompact(v as number) } }
      },
      animation: state.reducedMotion ? false : { duration: 800 },
    },
  });
};
