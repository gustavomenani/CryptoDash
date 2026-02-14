// ============================================
// CryptoDash - Type Definitions
// ============================================

export type Currency = 'usd' | 'brl' | 'eur';
export type Theme = 'dark' | 'light';
export type AccentColor = 'indigo' | 'emerald' | 'rose' | 'amber' | 'cyan' | 'violet';
export type AlertCondition = 'above' | 'below';
export type TimeFrame = 1 | 7 | 30 | 90 | 365;
export type ViewId = 
  | 'view-dashboard' 
  | 'view-market' 
  | 'view-converter' 
  | 'view-wallet' 
  | 'view-alerts' 
  | 'view-news' 
  | 'view-settings' 
  | 'view-coin-detail';

// ============================================
// API Types
// ============================================

export interface Coin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
}

export interface MarketCoin extends Coin {
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
  price_change_percentage_24h: number | null;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface GlobalData {
  data: {
    active_cryptocurrencies: number;
    total_market_cap: Record<Currency, number>;
    total_volume: Record<Currency, number>;
    market_cap_percentage: {
      btc: number;
      eth: number;
    };
  };
}

export interface FearGreedData {
  value: string;
  value_classification: string;
}

export interface ChartDataPoint {
  timestamp: number;
  price: number;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  image: {
    small: string;
  };
  market_cap_rank: number;
  market_data: {
    current_price: Record<Currency, number>;
    market_cap: Record<Currency, number>;
    total_volume: Record<Currency, number>;
    price_change_percentage_24h: number | null;
    price_change_percentage_7d: number | null;
    price_change_percentage_30d: number | null;
    ath: Record<Currency, number>;
    atl: Record<Currency, number>;
    circulating_supply: number;
    total_supply: number | null;
    max_supply: number | null;
  };
  description: {
    en: string;
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
  };
}

export interface NewsItem {
  title: string;
  description: string;
  url: string;
  source: string;
  image: string;
  publishedAt: string;
}

// ============================================
// Application State Types
// ============================================

export interface PortfolioItem {
  coin: string;
  amount: number;
  buyPrice: number;
}

export interface AlertItem {
  coin: string;
  condition: AlertCondition;
  target: number;
  triggered: boolean;
  created: number;
}

export interface UserSettings {
  currency: Currency;
  theme: Theme;
  accent: AccentColor;
  autoRefresh: boolean;
  refreshSec: number;
  reducedMotion: boolean;
  discreet: boolean;
}

export interface AppState {
  currency: Currency;
  theme: Theme;
  accent: AccentColor;
  markets: MarketCoin[];
  global: GlobalData | null;
  news: NewsItem[];
  selectedCoin: string;
  chartDays: TimeFrame;
  chartInstance: import('chart.js').Chart | null;
  sparklines: Record<string, import('chart.js').Chart>;
  marketPage: number;
  marketSort: {
    key: 'rank' | 'price' | 'change' | 'volume' | 'cap';
    asc: boolean;
  };
  portfolio: PortfolioItem[];
  alerts: AlertItem[];
  favorites: string[];
  walletChartInstance: import('chart.js').Chart | null;
  autoRefresh: boolean;
  refreshSec: number;
  refreshTimer: ReturnType<typeof setInterval> | null;
  countdownTimer: ReturnType<typeof setInterval> | null;
  countdownVal: number;
  reducedMotion: boolean;
  discreet: boolean;
  useMock: boolean;
  currentView: ViewId;
  coinDetailId: string | null;
  coinDetailDays: TimeFrame;
  coinDetailChartInstance: import('chart.js').Chart | null;
  notificationsEnabled: boolean;
  userId: string | null;
}

// ============================================
// i18n Types
// ============================================

export type Locale = 'pt-BR' | 'en' | 'es';

export interface TranslationKeys {
  // Navigation
  'nav.dashboard': string;
  'nav.market': string;
  'nav.converter': string;
  'nav.wallet': string;
  'nav.alerts': string;
  'nav.news': string;
  'nav.settings': string;
  
  // Dashboard
  'dashboard.title': string;
  'dashboard.subtitle': string;
  'dashboard.fearGreed': string;
  'dashboard.price': string;
  'dashboard.change24h': string;
  'dashboard.marketCap': string;
  'dashboard.volume': string;
  'dashboard.dominance': string;
  'dashboard.gainers': string;
  'dashboard.losers': string;
  
  // Market
  'market.title': string;
  'market.search': string;
  'market.rank': string;
  'market.name': string;
  'market.price': string;
  'market.24h': string;
  'market.volume': string;
  'market.marketCap': string;
  'market.7d': string;
  
  // Converter
  'converter.title': string;
  'converter.from': string;
  'converter.to': string;
  'converter.amount': string;
  'converter.result': string;
  'converter.rate': string;
  'converter.swap': string;
  
  // Wallet
  'wallet.title': string;
  'wallet.total': string;
  'wallet.assets': string;
  'wallet.best': string;
  'wallet.pnl': string;
  'wallet.addAsset': string;
  'wallet.coin': string;
  'wallet.quantity': string;
  'wallet.buyPrice': string;
  'wallet.yourAssets': string;
  
  // Alerts
  'alerts.title': string;
  'alerts.new': string;
  'alerts.condition': string;
  'alerts.above': string;
  'alerts.below': string;
  'alerts.target': string;
  'alerts.active': string;
  'alerts.clearTriggered': string;
  
  // News
  'news.title': string;
  
  // Settings
  'settings.title': string;
  'settings.currency': string;
  'settings.theme': string;
  'settings.dark': string;
  'settings.light': string;
  'settings.accent': string;
  'settings.autoRefresh': string;
  'settings.interval': string;
  'settings.reducedMotion': string;
  'settings.discreet': string;
  'settings.export': string;
  'settings.import': string;
  'settings.reset': string;
  
  // Common
  'common.loading': string;
  'common.refresh': string;
  'common.save': string;
  'common.cancel': string;
  'common.delete': string;
  'common.success': string;
  'common.error': string;
  'common.warning': string;
  'common.info': string;
}

// ============================================
// Encryption Types
// ============================================

export interface EncryptedData {
  encrypted: string;
  iv: string;
  salt: string;
}

export interface SecureStorageData {
  portfolio: EncryptedData;
  alerts: EncryptedData;
  favorites: EncryptedData;
  settings: EncryptedData;
  timestamp: number;
}

// ============================================
// Supabase Types
// ============================================

export interface UserProfile {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
}

export interface SyncData {
  user_id: string;
  encrypted_data: string;
  last_sync: string;
  device_id: string;
}
