// CryptoDash — Market Feature (Table, Sparklines, Coin Detail)

import Chart from 'chart.js/auto';
import { state } from '../core/state';
import { el } from '../core/dom';
import { fetchJSON } from '../core/api';
import { CONFIG } from '../config/constants';
import { escapeHtml, formatCurrency, formatCompact, formatPct } from '../utils/helpers';
import { i18n } from '../i18n/index';
import { fetchChartData } from './dashboard';
import type { CoinDetail, ViewId } from '../types/index';

// Callback registered by app.ts to avoid circular dependency
let _switchView: (viewId: ViewId) => void = () => {};
export const registerSwitchView = (fn: (viewId: ViewId) => void): void => { _switchView = fn; };

// ============================================
// Market Table
// ============================================

export const renderMarketTable = (): void => {
  const tbody = el.marketTableBody;
  if (!tbody) return;

  let filtered = [...state.markets];
  const search = (el.marketSearch as HTMLInputElement)?.value?.trim().toLowerCase() || '';
  if (search) filtered = filtered.filter(c => c.name.toLowerCase().includes(search) || c.symbol.toLowerCase().includes(search));

  const { key, asc } = state.marketSort;
  filtered.sort((a, b) => {
    let va: number, vb: number;
    if (key === 'rank') { va = a.market_cap_rank || 999; vb = b.market_cap_rank || 999; }
    else if (key === 'price') { va = a.current_price; vb = b.current_price; }
    else if (key === 'change') { va = a.price_change_percentage_24h || 0; vb = b.price_change_percentage_24h || 0; }
    else if (key === 'volume') { va = a.total_volume || 0; vb = b.total_volume || 0; }
    else { va = a.market_cap || 0; vb = b.market_cap || 0; }
    return asc ? va - vb : vb - va;
  });

  tbody.innerHTML = filtered.map(c => {
    const change = c.price_change_percentage_24h || 0;
    const cls = change >= 0 ? 'positive' : 'negative';
    return `<tr data-coin="${c.id}">
      <td>${c.market_cap_rank || '--'}</td>
      <td><div class="table-coin"><img src="${c.image}" alt="${escapeHtml(c.name)}" width="24" height="24" loading="lazy" /><div class="table-coin-names"><span class="table-coin-name">${escapeHtml(c.name)}</span><span class="table-coin-symbol">${escapeHtml(c.symbol)}</span></div></div></td>
      <td>${formatCurrency(c.current_price)}</td>
      <td class="table-change ${cls}">${formatPct(change)}</td>
      <td>${formatCompact(c.total_volume || 0)}</td>
      <td>${formatCompact(c.market_cap)}</td>
      <td><div class="table-sparkline"><canvas id="tblspark-${c.id}"></canvas></div></td>
    </tr>`;
  }).join('');
};

// ============================================
// Market Sparklines
// ============================================

export const renderMarketSparklines = (): void => {
  const markets = state.markets;
  setTimeout(() => {
    markets.forEach(c => {
      const canvas = document.getElementById(`tblspark-${c.id}`) as HTMLCanvasElement | null;
      if (!canvas || !c.sparkline_in_7d?.price) return;

      const prices = c.sparkline_in_7d.price;
      const change = c.price_change_percentage_24h || 0;
      const color = change >= 0 ? '#22c55e' : '#ef4444';

      if (state.marketTableSparklines[c.id]) {
        state.marketTableSparklines[c.id].destroy();
      }

      state.marketTableSparklines[c.id] = new Chart(canvas, {
        type: 'line',
        data: {
          labels: prices.map((_, i) => i),
          datasets: [{
            data: prices, borderColor: color, borderWidth: 1.5,
            fill: false, pointRadius: 0, tension: 0.4
          }]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: { legend: { display: false }, tooltip: { enabled: false } },
          scales: { x: { display: false }, y: { display: false } },
          animation: false,
        },
      });
    });
  }, 100);
};

// ============================================
// Coin Detail
// ============================================

export const openCoinDetail = async (coinId: string): Promise<void> => {
  state.coinDetailId = coinId;
  state.coinDetailDays = 7;
  _switchView('view-coin-detail');

  const market = state.markets.find(c => c.id === coinId);

  if (el.coinDetailIcon && market?.image) (el.coinDetailIcon as HTMLImageElement).src = market.image;
  if (el.coinDetailName) el.coinDetailName.textContent = market?.name || coinId;
  if (el.coinDetailSymbol) el.coinDetailSymbol.textContent = market?.symbol?.toUpperCase() || '';

  if (el.coinDetailFav) {
    const isFav = state.favorites.includes(coinId);
    el.coinDetailFav.innerHTML = `<i class="ph-light ph-star${isFav ? '-fill' : ''}"></i><span>${isFav ? 'Favoritado' : 'Favoritar'}</span>`;
  }

  if (el.coinDetailStats && market) {
    const change = market.price_change_percentage_24h || 0;
    const changeCls = change >= 0 ? 'positive' : 'negative';
    el.coinDetailStats.innerHTML = `
      <div class="coin-detail-stat"><div class="cds-label">Preço</div><div class="cds-value">${formatCurrency(market.current_price)}</div></div>
      <div class="coin-detail-stat"><div class="cds-label">Variação 24h</div><div class="cds-value ${changeCls}">${formatPct(change)}</div></div>
      <div class="coin-detail-stat"><div class="cds-label">Market Cap</div><div class="cds-value">${formatCompact(market.market_cap)}</div></div>
      <div class="coin-detail-stat"><div class="cds-label">Volume 24h</div><div class="cds-value">${formatCompact(market.total_volume || 0)}</div></div>
      <div class="coin-detail-stat"><div class="cds-label">Rank</div><div class="cds-value">#${market.market_cap_rank || '--'}</div></div>
    `;
  }

  try {
    const detail = await fetchJSON(`${CONFIG.API_BASE}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`) as CoinDetail | null;
    if (detail && el.coinDetailInfo) {
      const md = detail.market_data;
      const cur = state.currency;
      el.coinDetailInfo.innerHTML = `
        <div class="coin-info-item"><span class="coin-info-label">Preço atual</span><span class="coin-info-value">${formatCurrency(md?.current_price?.[cur])}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Market Cap</span><span class="coin-info-value">${formatCompact(md?.market_cap?.[cur] || 0)}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Volume 24h</span><span class="coin-info-value">${formatCompact(md?.total_volume?.[cur] || 0)}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">ATH</span><span class="coin-info-value">${formatCurrency(md?.ath?.[cur])}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">ATL</span><span class="coin-info-value">${formatCurrency(md?.atl?.[cur])}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Supply circulante</span><span class="coin-info-value">${md?.circulating_supply ? md.circulating_supply.toLocaleString(i18n.getLocale()) : '--'}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Supply máximo</span><span class="coin-info-value">${md?.max_supply ? md.max_supply.toLocaleString(i18n.getLocale()) : '∞'}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Variação 7d</span><span class="coin-info-value">${formatPct(md?.price_change_percentage_7d)}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Variação 30d</span><span class="coin-info-value">${formatPct(md?.price_change_percentage_30d)}</span></div>
      `;
    } else if (el.coinDetailInfo && market) {
      el.coinDetailInfo.innerHTML = `
        <div class="coin-info-item"><span class="coin-info-label">Preço atual</span><span class="coin-info-value">${formatCurrency(market.current_price)}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Market Cap</span><span class="coin-info-value">${formatCompact(market.market_cap)}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Volume 24h</span><span class="coin-info-value">${formatCompact(market.total_volume || 0)}</span></div>
        <div class="coin-info-item"><span class="coin-info-label">Rank</span><span class="coin-info-value">#${market.market_cap_rank || '--'}</span></div>
      `;
    }
  } catch (e) { console.warn('Coin detail fetch failed', e); }

  renderCoinDetailChart();
};

export const renderCoinDetailChart = async (): Promise<void> => {
  if (!state.coinDetailId) return;
  if (el.coinDetailChartLoader) el.coinDetailChartLoader.hidden = false;

  const prices = await fetchChartData(state.coinDetailId, state.coinDetailDays);
  if (el.coinDetailChartLoader) el.coinDetailChartLoader.hidden = true;
  if (!prices?.length) return;

  const labels = prices.map(p => {
    const d = new Date(p[0]);
    return state.coinDetailDays <= 1
      ? d.toLocaleTimeString(i18n.getLocale(), { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString(i18n.getLocale(), { day: '2-digit', month: 'short' });
  });

  const data = prices.map(p => p[1]);
  const isUp = data[data.length - 1] >= data[0];
  const color = isUp ? '#22c55e' : '#ef4444';

  const daysLabel: Record<number, string> = { 1: '24 horas', 7: '7 dias', 30: '30 dias', 90: '90 dias', 365: '1 ano' };
  if (el.coinDetailChartSubtitle) el.coinDetailChartSubtitle.textContent = `Últimos ${daysLabel[state.coinDetailDays] || state.coinDetailDays + ' dias'}`;

  if (state.coinDetailChartInstance) state.coinDetailChartInstance.destroy();

  const canvas = el.coinDetailChart as HTMLCanvasElement;
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const gradient = ctx.createLinearGradient(0, 0, 0, 300);
  gradient.addColorStop(0, color + '30');
  gradient.addColorStop(1, color + '00');

  state.coinDetailChartInstance = new Chart(ctx, {
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
