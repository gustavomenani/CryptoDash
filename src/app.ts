// CryptoDash — Application Entry Point

import './style.css';

import { state } from './core/state';
import { el, cacheDOM } from './core/dom';
import { toast } from './utils/helpers';
import { i18n } from './i18n/index';
import { encryptionService } from './utils/encryption';

import { renderPriceCards, renderFearGreed, renderStats, renderGainersLosers, renderChart } from './features/dashboard';
import { renderMarketTable, renderMarketSparklines, registerSwitchView } from './features/market';
import { buildConverterSelects, runConversion, initConverter } from './features/converter';
import { renderWallet, initWallet, populateWalletCoins } from './features/wallet';
import { renderAlerts, checkAlerts, initAlerts } from './features/alerts';
import { fetchNews, renderNews } from './features/news';
import {
  applyTheme, initEventListeners, registerAppCallbacks,
  fetchMarketData, fetchGlobalData, fetchExchangeRates,
} from './features/settings';

import type { ViewId } from './types/index';

// ============================================
// View Switching
// ============================================

const switchView = (viewId: ViewId): void => {
  document.querySelectorAll('.view').forEach(v => {
    v.setAttribute('hidden', '');
    (v as HTMLElement).style.display = 'none';
  });

  const target = document.getElementById(viewId);
  if (target) {
    target.removeAttribute('hidden');
    target.style.display = 'block';
  }

  document.querySelectorAll('.nav-item').forEach(n => {
    n.classList.toggle('active', n.getAttribute('data-view') === viewId);
  });

  state.currentView = viewId;

  if (viewId === 'view-converter') {
    buildConverterSelects();
    runConversion();
  }
  if (viewId === 'view-wallet') {
    renderWallet();
  }
  if (viewId === 'view-alerts') {
    renderAlerts();
  }
  if (viewId === 'view-news' && !state.news.length) {
    fetchNews().then(news => renderNews(news));
  }
};

// ============================================
// Auto Refresh
// ============================================

const setupAutoRefresh = (): void => {
  if (state.refreshTimer) clearInterval(state.refreshTimer);
  if (state.countdownTimer) clearInterval(state.countdownTimer);

  if (!state.autoRefresh) {
    if (el.autoRefreshBadge) el.autoRefreshBadge.setAttribute('hidden', '');
    return;
  }

  el.autoRefreshBadge?.removeAttribute('hidden');
  state.countdownVal = state.refreshSec;
  if (el.autoRefreshCountdown) el.autoRefreshCountdown.textContent = state.countdownVal + 's';

  state.countdownTimer = setInterval(() => {
    state.countdownVal--;
    if (state.countdownVal < 0) state.countdownVal = state.refreshSec;
    if (el.autoRefreshCountdown) el.autoRefreshCountdown.textContent = state.countdownVal + 's';
  }, 1000);

  state.refreshTimer = setInterval(() => {
    state.countdownVal = state.refreshSec;
    loadDashboard(true);
  }, state.refreshSec * 1000);
};

// ============================================
// Main Data Load
// ============================================

const loadDashboard = async (silent = false): Promise<void> => {
  state.useMock = false;

  const markets = await fetchMarketData(1);
  const global = await fetchGlobalData();
  await fetchExchangeRates();

  state.markets = markets;
  state.global = global;

  renderPriceCards();
  renderStats();
  renderGainersLosers();
  renderChart();
  renderMarketTable();
  renderMarketSparklines();
  renderFearGreed();
  checkAlerts();

  if (el.statusDot) {
    el.statusDot.className = 'status-dot ' + (state.useMock ? '' : 'online');
  }
  if (el.statusLabel) {
    el.statusLabel.textContent = state.useMock ? 'Modo Demo' : 'Conectado';
  }
  if (el.mockIndicator) {
    if (state.useMock) el.mockIndicator.removeAttribute('hidden');
    else el.mockIndicator.setAttribute('hidden', '');
  }
  if (el.lastUpdate) {
    el.lastUpdate.textContent = 'Atualizado ' + new Date().toLocaleTimeString(i18n.getLocale());
  }

  if (!silent) {
    toast(state.useMock ? 'Modo demo ativo' : 'Dados atualizados', state.useMock ? 'warning' : 'success');
  }
};

// ============================================
// Initialization
// ============================================

const init = async (): Promise<void> => {
  encryptionService.initialize();
  cacheDOM();
  applyTheme();

  // Register callbacks so feature modules can call back into app
  registerAppCallbacks(switchView, loadDashboard, setupAutoRefresh);
  registerSwitchView(switchView);

  // Update language UI
  document.querySelectorAll('.lang-option').forEach(el => {
    el.classList.toggle('active', el.getAttribute('data-lang') === i18n.getLocale());
  });

  // Update toggles
  if (el.autoRefreshToggle) (el.autoRefreshToggle as HTMLInputElement).checked = state.autoRefresh;
  if (el.reducedMotionToggle) (el.reducedMotionToggle as HTMLInputElement).checked = state.reducedMotion;
  if (el.discreetToggle) (el.discreetToggle as HTMLInputElement).checked = state.discreet;
  if (el.refreshInterval) (el.refreshInterval as HTMLSelectElement).value = state.refreshSec.toString();
  if (el.refreshIntervalRow) (el.refreshIntervalRow as HTMLElement).hidden = !state.autoRefresh;

  initEventListeners();
  initConverter();
  initWallet();

  await loadDashboard();

  // Populate selects after markets are loaded
  buildConverterSelects();
  populateWalletCoins();
  renderWallet();

  initAlerts();
  renderAlerts();

  fetchNews().then(news => renderNews(news));

  // Hide loading overlay
  const overlay = el.loadingOverlay;
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => overlay.remove(), 500);
  }

  setupAutoRefresh();
};

// Start
document.addEventListener('DOMContentLoaded', init);

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
