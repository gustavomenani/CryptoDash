// CryptoDash — Settings & Event Listeners

import { CONFIG, MOCK_MARKETS, MOCK_GLOBAL } from '../config/constants';
import { state } from '../core/state';
import { el } from '../core/dom';
import { fetchJSON } from '../core/api';
import { debounce, toast, confirmAction } from '../utils/helpers';
import { i18n } from '../i18n/index';
import { SecureStorage } from '../utils/secureStorage';

import { renderPriceCards, renderChart } from './dashboard';
import { renderMarketTable, renderMarketSparklines, openCoinDetail, renderCoinDetailChart } from './market';
import { fetchNews, renderNews, invalidateNewsCache } from './news';

import type { MarketCoin, ViewId, Theme, AccentColor, Currency, TimeFrame, GlobalData } from '../types/index';

// Forward declarations — filled in by app.ts
let _switchView: (viewId: ViewId) => void = () => {};
let _loadDashboard: (silent?: boolean) => Promise<void> = async () => {};
let _setupAutoRefresh: () => void = () => {};

export const registerAppCallbacks = (
  switchView: (viewId: ViewId) => void,
  loadDashboard: (silent?: boolean) => Promise<void>,
  setupAutoRefresh: () => void,
): void => {
  _switchView = switchView;
  _loadDashboard = loadDashboard;
  _setupAutoRefresh = setupAutoRefresh;
};

// ============================================
// Theme
// ============================================

export const applyTheme = (): void => {
  document.documentElement.classList.toggle('light', state.theme === 'light');
  document.documentElement.setAttribute('data-accent', state.accent);
  if (state.reducedMotion) document.body.classList.add('reduced-motion');
  if (state.discreet) document.body.classList.add('discreet');

  document.querySelectorAll('[data-theme]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-theme') === state.theme);
  });
  document.querySelectorAll('[data-accent]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-accent') === state.accent);
  });
  document.querySelectorAll('[data-currency]').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-currency') === state.currency);
  });
};

// ============================================
// Favorites
// ============================================

export const toggleFavorite = (coinId: string): void => {
  const idx = state.favorites.indexOf(coinId);
  if (idx >= 0) {
    state.favorites.splice(idx, 1);
    toast('☆ Removed', 'info');
  } else {
    state.favorites.push(coinId);
    toast('★ Favorited', 'success');
  }
  state.saveFavorites();
  renderPriceCards();
};

// ============================================
// Exchange Rates
// ============================================

export const fetchExchangeRates = async (): Promise<void> => {
  try {
    const data = await fetchJSON(`${CONFIG.API_BASE}/simple/price?ids=bitcoin&vs_currencies=usd,brl,eur`) as { bitcoin?: Record<string, number> } | null;
    if (data?.bitcoin) {
      const btcUsd = data.bitcoin.usd || 1;
      CONFIG.CURRENCY_RATES = {
        usd: 1,
        brl: data.bitcoin.brl / btcUsd,
        eur: data.bitcoin.eur / btcUsd,
      };
    }
  } catch {
    console.warn('Failed to fetch exchange rates, using fallback values');
  }
};

// ============================================
// Fetch Market Data
// ============================================

export const fetchMarketData = async (page = 1): Promise<MarketCoin[]> => {
  const url = `${CONFIG.API_BASE}/coins/markets?vs_currency=${state.currency}&order=market_cap_desc&per_page=${CONFIG.PER_PAGE}&page=${page}&sparkline=true&price_change_percentage=24h`;
  const data = await fetchJSON(url);
  if (Array.isArray(data) && data.length > 0 && (data[0] as MarketCoin).id) return data as MarketCoin[];

  state.useMock = true;
  return MOCK_MARKETS.map(c => ({
    ...c,
    current_price: c.current_price * CONFIG.CURRENCY_RATES[state.currency],
  }));
};

// ============================================
// Fetch Global Data
// ============================================

export const fetchGlobalData = async (): Promise<GlobalData> => {
  const data = await fetchJSON(`${CONFIG.API_BASE}/global`);
  if (data && (data as GlobalData).data?.total_market_cap) return data as GlobalData;
  state.useMock = true;
  return MOCK_GLOBAL;
};

// ============================================
// Event Listeners
// ============================================

export const initEventListeners = (): void => {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const viewId = item.getAttribute('data-view') as ViewId;
      if (viewId) _switchView(viewId);
    });
  });

  // Refresh
  el.refreshButton?.addEventListener('click', () => _loadDashboard());

  // Theme toggle
  el.themeToggle?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.toggle-option');
    if (!target) return;
    const theme = target.getAttribute('data-theme') as Theme;
    if (theme) {
      state.theme = theme;
      state.saveSettings();
      applyTheme();
      toast(`${i18n.t('settings.theme')} ✓`, 'success');
    }
  });

  // Accent picker
  el.accentPicker?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('[data-accent]');
    if (!target) return;
    const accent = target.getAttribute('data-accent') as AccentColor;
    if (accent) {
      state.accent = accent;
      state.saveSettings();
      applyTheme();
      toast(`${i18n.t('settings.accent')} ✓`, 'success');
    }
  });

  // Currency toggle
  el.currencyToggle?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.toggle-option');
    if (!target) return;
    const currency = target.getAttribute('data-currency') as Currency;
    if (currency) {
      state.currency = currency;
      state.saveSettings();
      document.querySelectorAll('[data-currency]').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-currency') === currency);
      });
      _loadDashboard();
      toast(`${i18n.t('settings.currency')} ✓`, 'success');
    }
  });

  // Language selector
  el.languageSelector?.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest('.lang-option');
    if (!target) return;
    const lang = target.getAttribute('data-lang');
    if (lang) {
      i18n.setLocale(lang as 'pt-BR' | 'en' | 'es');
      document.querySelectorAll('.lang-option').forEach(el => {
        el.classList.toggle('active', el.getAttribute('data-lang') === lang);
      });
      toast(`${i18n.t('common.success')} ✓`, 'success');
    }
  });

  // Auto refresh
  el.autoRefreshToggle?.addEventListener('change', (e) => {
    state.autoRefresh = (e.target as HTMLInputElement).checked;
    state.saveSettings();
    if (el.refreshIntervalRow) {
      (el.refreshIntervalRow as HTMLElement).hidden = !state.autoRefresh;
    }
    _setupAutoRefresh();
  });

  // Reduced motion
  el.reducedMotionToggle?.addEventListener('change', (e) => {
    state.reducedMotion = (e.target as HTMLInputElement).checked;
    state.saveSettings();
    document.body.classList.toggle('reduced-motion', state.reducedMotion);
  });

  // Discreet mode
  el.discreetToggle?.addEventListener('change', (e) => {
    state.discreet = (e.target as HTMLInputElement).checked;
    state.saveSettings();
    document.body.classList.toggle('discreet', state.discreet);
  });

  // Reset
  el.resetButton?.addEventListener('click', async () => {
    const confirmed = await confirmAction(i18n.t('common.warning') + ': ' + i18n.t('settings.reset') + '?', {
      confirmText: i18n.t('common.delete'),
      cancelText: i18n.t('common.cancel'),
    });
    if (!confirmed) return;
    SecureStorage.clear();
    location.reload();
  });

  // Timeframe buttons (dashboard)
  document.querySelectorAll('#view-dashboard .timeframe-button').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('#view-dashboard .timeframe-button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      state.chartDays = parseInt(btn.getAttribute('data-days') || '7') as TimeFrame;
      renderChart();
    });
  });

  // Coin Detail timeframe buttons
  el.coinDetailTimeframe?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.timeframe-button');
    if (!btn) return;
    el.coinDetailTimeframe?.querySelectorAll('.timeframe-button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.coinDetailDays = parseInt(btn.getAttribute('data-days') || '7') as TimeFrame;
    renderCoinDetailChart();
  });

  // Coin Detail back button
  el.coinDetailBack?.addEventListener('click', () => _switchView('view-dashboard'));

  // Coin Detail favorite
  el.coinDetailFav?.addEventListener('click', () => {
    if (!state.coinDetailId) return;
    toggleFavorite(state.coinDetailId);
    const isFav = state.favorites.includes(state.coinDetailId);
    if (el.coinDetailFav) {
      el.coinDetailFav.innerHTML = `<i class="ph-light ph-star${isFav ? '-fill' : ''}"></i><span>${isFav ? 'Favoritado' : 'Favoritar'}</span>`;
    }
  });

  // Market search
  el.marketSearch?.addEventListener('input', debounce(() => renderMarketTable(), 300));

  // Market table sort
  document.querySelectorAll('.market-table th[data-sort]').forEach(th => {
    th.addEventListener('click', () => {
      const key = th.getAttribute('data-sort') as typeof state.marketSort.key;
      if (state.marketSort.key === key) {
        state.marketSort.asc = !state.marketSort.asc;
      } else {
        state.marketSort = { key, asc: key === 'rank' as typeof key };
      }
      renderMarketTable();
      renderMarketSparklines();
    });
  });

  // Market Load More
  el.marketLoadMore?.addEventListener('click', async () => {
    if (state.marketPage >= CONFIG.MAX_MARKET_PAGE) {
      toast('Todas as moedas carregadas', 'info');
      return;
    }
    if (el.marketLoader) el.marketLoader.hidden = false;
    state.marketPage++;
    const more = await fetchMarketData(state.marketPage);
    if (el.marketLoader) el.marketLoader.hidden = true;
    if (more.length) {
      state.markets = [...state.markets, ...more.filter(m => !state.markets.find(e => e.id === m.id))];
      renderMarketTable();
      renderMarketSparklines();
      toast(`+${more.length} moedas carregadas`, 'success');
    } else {
      toast('Não há mais moedas para carregar', 'info');
    }
  });

  // Market table row click
  el.marketTableBody?.addEventListener('click', (e) => {
    const row = (e.target as HTMLElement).closest('tr[data-coin]');
    if (row) {
      const coinId = row.getAttribute('data-coin');
      if (coinId) openCoinDetail(coinId);
    }
  });

  // Market refresh
  el.marketRefreshButton?.addEventListener('click', () => _loadDashboard());

  // News refresh
  el.newsRefreshButton?.addEventListener('click', async () => {
    invalidateNewsCache();
    const news = await fetchNews();
    renderNews(news);
    toast('Notícias atualizadas', 'success');
  });

  // Dismiss error banner
  el.dismissError?.addEventListener('click', () => {
    if (el.errorBanner) (el.errorBanner as HTMLElement).hidden = true;
  });

  // Refresh interval change
  el.refreshInterval?.addEventListener('change', () => {
    state.refreshSec = parseInt((el.refreshInterval as HTMLSelectElement).value) || 60;
    state.saveSettings();
    _setupAutoRefresh();
  });

  // Export data
  el.exportDataButton?.addEventListener('click', () => {
    const data = SecureStorage.exportAll();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cryptodash-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast('Dados exportados!', 'success');
  });

  // Import data
  el.importDataInput?.addEventListener('change', (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const jsonStr = reader.result as string;
      const success = SecureStorage.importAll(jsonStr);
      if (success) {
        toast('Dados importados! Recarregando...', 'success');
        setTimeout(() => location.reload(), 1500);
      } else {
        toast('Erro ao importar dados', 'error');
      }
    };
    reader.readAsText(file);
  });

  // Price cards - click para favoritar e selecionar moeda
  el.priceCards?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const favBtn = target.closest('.card-fav');
    const card = target.closest('.card');

    if (favBtn) {
      const coinId = favBtn.getAttribute('data-fav');
      if (coinId) toggleFavorite(coinId);
      return;
    }

    if (card) {
      const coinId = card.getAttribute('data-coin');
      if (coinId) {
        state.selectedCoin = coinId;
        renderChart();
      }
    }
  });

  // Gainers/Losers click -> open coin detail
  el.topGainers?.addEventListener('click', (e) => {
    const mover = (e.target as HTMLElement).closest('.mover');
    if (mover) {
      const coinId = mover.getAttribute('data-coin');
      if (coinId) openCoinDetail(coinId);
    }
  });

  el.topLosers?.addEventListener('click', (e) => {
    const mover = (e.target as HTMLElement).closest('.mover');
    if (mover) {
      const coinId = mover.getAttribute('data-coin');
      if (coinId) openCoinDetail(coinId);
    }
  });
};
