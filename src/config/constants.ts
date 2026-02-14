// CryptoDash — Configuration & Constants

import type { MarketCoin, GlobalData, NewsItem } from '../types/index';

// ============================================
// Configuration
// ============================================

export const CONFIG = {
  API_BASE: '/api/coingecko',
  NEWS_API: '/api/news',
  CORS_PROXIES: [
    'https://corsproxy.io/?url=',
    'https://api.allorigins.win/raw?url=',
    'https://api.codetabs.com/v1/proxy?quest=',
  ],
  COINGECKO_BASE: 'https://api.coingecko.com/api/v3',
  CRYPTOCOMPARE_NEWS: 'https://min-api.cryptocompare.com/data/v2/news/?sortOrder=popular',
  REQUEST_DELAY: 4000,
  REQUEST_TIMEOUT: 12000,
  MAX_MARKET_PAGE: 5,
  PER_PAGE: 50,
  NEWS_CACHE_TTL: 600_000, // 10 minutes
  CURRENCY_RATES: { usd: 1, brl: 5.05, eur: 0.92 } as Record<string, number>,
  COINS: [
    { id: 'bitcoin', symbol: 'btc', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'eth', name: 'Ethereum' },
    { id: 'solana', symbol: 'sol', name: 'Solana' },
    { id: 'binancecoin', symbol: 'bnb', name: 'BNB' },
    { id: 'ripple', symbol: 'xrp', name: 'XRP' },
    { id: 'cardano', symbol: 'ada', name: 'Cardano' },
    { id: 'dogecoin', symbol: 'doge', name: 'Dogecoin' },
    { id: 'polkadot', symbol: 'dot', name: 'Polkadot' },
  ],
};

// ============================================
// Fiat Options (Converter)
// ============================================

export const FIAT_OPTIONS = [
  { id: '__usd', symbol: 'USD', name: 'Dólar Americano' },
  { id: '__brl', symbol: 'BRL', name: 'Real Brasileiro' },
  { id: '__eur', symbol: 'EUR', name: 'Euro' },
];

// ============================================
// Mock Data
// ============================================

export const MOCK_MARKETS: MarketCoin[] = CONFIG.COINS.map((coin, i) => ({
  ...coin,
  image: `https://assets.coingecko.com/coins/images/${i + 1}/small/${coin.id}.png`,
  current_price: [101500, 3850, 178, 615, 2.35, 1.05, 0.42, 8.2][i],
  market_cap: [2e12, 463e9, 82e9, 92e9, 135e9, 37e9, 61e9, 11.5e9][i],
  market_cap_rank: i + 1,
  total_volume: [38e9, 18e9, 3.5e9, 1.8e9, 5.2e9, 1.1e9, 3.2e9, 420e6][i],
  price_change_percentage_24h: [2.1, 1.5, 4.2, -0.3, 3.8, -1.2, 5.6, -0.7][i],
  sparkline_in_7d: { price: Array.from({ length: 168 }, (_, j) => 100 + Math.sin(j / 10) * 10) },
}));

export const MOCK_GLOBAL: GlobalData = {
  data: {
    active_cryptocurrencies: 15240,
    total_market_cap: { usd: 3.5e12, brl: 17.675e12, eur: 3.22e12 },
    total_volume: { usd: 98e9, brl: 494.9e9, eur: 90.16e9 },
    market_cap_percentage: { btc: 57.2, eth: 13.2 },
  },
};

export const MOCK_NEWS: NewsItem[] = [
  { title: 'Bitcoin ultrapassa US$ 100.000 pela primeira vez', description: 'A criptomoeda mais valiosa do mundo alcançou um novo recorde histórico, impulsionada pela adoção institucional crescente.', url: '#', source: 'CryptoNews', image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?auto=format&fit=crop&w=800&q=80', publishedAt: new Date(Date.now() - 3600000).toISOString() },
  { title: 'Ethereum 2.0: nova atualização promete reduzir taxas em 90%', description: 'A rede Ethereum implementou com sucesso sua última atualização, prometendo transações mais rápidas e baratas.', url: '#', source: 'BlockchainToday', image: 'https://images.unsplash.com/photo-1622630998477-20aa696fa4f5?auto=format&fit=crop&w=800&q=80', publishedAt: new Date(Date.now() - 7200000).toISOString() },
  { title: 'Solana bate recorde de transações por segundo', description: 'A blockchain Solana processou mais de 65.000 TPS em teste recente, solidificando sua posição como uma das redes mais rápidas.', url: '#', source: 'DeFi Pulse', image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?auto=format&fit=crop&w=800&q=80', publishedAt: new Date(Date.now() - 10800000).toISOString() },
  { title: 'Regulamentação cripto avança no Brasil', description: 'O Banco Central do Brasil anunciou novas diretrizes para exchanges de criptomoedas, trazendo mais segurança ao mercado.', url: '#', source: 'InfoMoney', image: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?auto=format&fit=crop&w=800&q=80', publishedAt: new Date(Date.now() - 14400000).toISOString() },
  { title: 'NFTs ganham novo fôlego com integração em jogos AAA', description: 'Grandes estúdios de jogos anunciaram parcerias para integrar NFTs em títulos populares, reacendendo o mercado.', url: '#', source: 'GameFi News', image: 'https://images.unsplash.com/photo-1620321023374-d1a68fbc720d?auto=format&fit=crop&w=800&q=80', publishedAt: new Date(Date.now() - 18000000).toISOString() },
  { title: 'DeFi atinge US$ 200 bilhões em valor total bloqueado', description: 'O setor de finanças descentralizadas continua crescendo, com protocolos de lending e staking liderando o crescimento.', url: '#', source: 'DeFi Watch', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=800&q=80', publishedAt: new Date(Date.now() - 21600000).toISOString() },
];
