// CryptoDash — Application State

import Chart from 'chart.js/auto';
import { storage } from '../utils/secureStorage';
import type {
  MarketCoin, GlobalData, NewsItem,
  PortfolioItem, AlertItem, ViewId, TimeFrame,
  Currency, Theme, AccentColor
} from '../types/index';

export class AppState {
  currency: Currency = 'usd';
  theme: Theme = 'dark';
  accent: AccentColor = 'indigo';
  markets: MarketCoin[] = [];
  global: GlobalData | null = null;
  news: NewsItem[] = [];
  selectedCoin = 'bitcoin';
  chartDays: TimeFrame = 7;
  chartInstance: Chart | null = null;
  sparklines: Record<string, Chart> = {};
  marketTableSparklines: Record<string, Chart> = {};
  marketPage = 1;
  marketSort = { key: 'rank' as const, asc: true };
  portfolio: PortfolioItem[] = [];
  alerts: AlertItem[] = [];
  favorites: string[] = [];
  walletChartInstance: Chart | null = null;
  autoRefresh = false;
  refreshSec = 60;
  refreshTimer: ReturnType<typeof setInterval> | null = null;
  countdownTimer: ReturnType<typeof setInterval> | null = null;
  countdownVal = 0;
  reducedMotion = false;
  discreet = false;
  useMock = false;
  currentView: ViewId = 'view-dashboard';
  coinDetailId: string | null = null;
  coinDetailDays: TimeFrame = 7;
  coinDetailChartInstance: Chart | null = null;
  notificationsEnabled = false;
  userId: string | null = null;

  constructor() {
    this.loadFromStorage();
  }

  loadFromStorage(): void {
    const settings = storage.settings.get();
    this.currency = settings.currency;
    this.theme = settings.theme;
    this.accent = settings.accent;
    this.autoRefresh = settings.autoRefresh;
    this.refreshSec = settings.refreshSec;
    this.reducedMotion = settings.reducedMotion;
    this.discreet = settings.discreet;

    this.portfolio = storage.portfolio.get();
    this.alerts = storage.alerts.get();
    this.favorites = storage.favorites.get();
  }

  saveSettings(): void {
    storage.settings.set({
      currency: this.currency,
      theme: this.theme,
      accent: this.accent,
      autoRefresh: this.autoRefresh,
      refreshSec: this.refreshSec,
      reducedMotion: this.reducedMotion,
      discreet: this.discreet,
    });
  }

  savePortfolio(): void {
    storage.portfolio.set(this.portfolio);
  }

  saveAlerts(): void {
    storage.alerts.set(this.alerts);
  }

  saveFavorites(): void {
    storage.favorites.set(this.favorites);
  }
}

export const state = new AppState();
