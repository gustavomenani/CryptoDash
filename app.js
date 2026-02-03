const COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
];

const API_BASE = "https://api.coingecko.com/api/v3";
const PORTFOLIO_KEY = "cryptodash-portfolio";
const CURRENCY_KEY = "cryptodash-currency";

const MOCK_MARKETS = [
  {
    id: "bitcoin",
    name: "Bitcoin",
    symbol: "btc",
    image: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    current_price: 65000,
    market_cap: 1280000000000,
    market_cap_rank: 1,
    price_change_percentage_24h: 2.8,
  },
  {
    id: "ethereum",
    name: "Ethereum",
    symbol: "eth",
    image: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    current_price: 3400,
    market_cap: 420000000000,
    market_cap_rank: 2,
    price_change_percentage_24h: -1.6,
  },
  {
    id: "solana",
    name: "Solana",
    symbol: "sol",
    image: "https://assets.coingecko.com/coins/images/4128/large/solana.png",
    current_price: 145,
    market_cap: 66000000000,
    market_cap_rank: 5,
    price_change_percentage_24h: 3.2,
  },
  {
    id: "cardano",
    name: "Cardano",
    symbol: "ada",
    image: "https://assets.coingecko.com/coins/images/975/large/cardano.png",
    current_price: 0.68,
    market_cap: 24000000000,
    market_cap_rank: 9,
    price_change_percentage_24h: -0.8,
  },
  {
    id: "ripple",
    name: "XRP",
    symbol: "xrp",
    image: "https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png",
    current_price: 0.72,
    market_cap: 39000000000,
    market_cap_rank: 6,
    price_change_percentage_24h: 1.1,
  },
  {
    id: "binancecoin",
    name: "BNB",
    symbol: "bnb",
    image: "https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png",
    current_price: 480,
    market_cap: 75000000000,
    market_cap_rank: 4,
    price_change_percentage_24h: 0.4,
  },
  {
    id: "dogecoin",
    name: "Dogecoin",
    symbol: "doge",
    image: "https://assets.coingecko.com/coins/images/5/large/dogecoin.png",
    current_price: 0.16,
    market_cap: 23000000000,
    market_cap_rank: 10,
    price_change_percentage_24h: 4.3,
  },
  {
    id: "polkadot",
    name: "Polkadot",
    symbol: "dot",
    image: "https://assets.coingecko.com/coins/images/12171/large/polkadot.png",
    current_price: 8.4,
    market_cap: 12000000000,
    market_cap_rank: 13,
    price_change_percentage_24h: -2.1,
  },
  {
    id: "avalanche-2",
    name: "Avalanche",
    symbol: "avax",
    image: "https://assets.coingecko.com/coins/images/12559/large/coin-round-red.png",
    current_price: 34,
    market_cap: 13000000000,
    market_cap_rank: 12,
    price_change_percentage_24h: 1.9,
  },
  {
    id: "chainlink",
    name: "Chainlink",
    symbol: "link",
    image: "https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png",
    current_price: 18.5,
    market_cap: 10500000000,
    market_cap_rank: 14,
    price_change_percentage_24h: -0.3,
  },
];

const MOCK_GLOBAL = {
  data: {
    market_cap_percentage: { btc: 48.6 },
    total_market_cap: { usd: 2500000000000, brl: 12800000000000 },
    total_volume: { usd: 118000000000, brl: 605000000000 },
  },
};

const MOCK_CHART = {
  prices: Array.from({ length: 30 }, (_, index) => {
    const timestamp = Date.now() - (30 - index) * 24 * 60 * 60 * 1000;
    const price = 62000 + Math.sin(index / 4) * 1800 + index * 65;
    return [timestamp, price];
  }),
};

const elements = {
  priceCards: document.getElementById("priceCards"),
  errorBanner: document.getElementById("errorBanner"),
  selectedCoin: document.getElementById("selectedCoin"),
  chartSubtitle: document.getElementById("chartSubtitle"),
  refreshButton: document.getElementById("refreshButton"),
  btcDominance: document.getElementById("btcDominance"),
  totalMarketCap: document.getElementById("totalMarketCap"),
  totalVolume: document.getElementById("totalVolume"),
  currencyToggle: document.getElementById("currencyToggle"),
  toggleOptions: document.querySelectorAll(".toggle-option"),
  timeframeButtons: document.querySelectorAll(".timeframe-button"),
  chartLoader: document.getElementById("chartLoader"),
  mockIndicator: document.getElementById("mockIndicator"),
  navItems: document.querySelectorAll(".nav-item[data-view]"),
  views: document.querySelectorAll(".view"),
  marketTableBody: document.getElementById("marketTableBody"),
  marketRefreshButton: document.getElementById("marketRefreshButton"),
  marketSearch: document.getElementById("marketSearch"),
  marketLoadMore: document.getElementById("marketLoadMore"),
  marketLoader: document.getElementById("marketLoader"),
  walletForm: document.getElementById("walletForm"),
  walletCoin: document.getElementById("walletCoin"),
  walletAmount: document.getElementById("walletAmount"),
  walletList: document.getElementById("walletList"),
  walletTotal: document.getElementById("walletTotal"),
  walletChart: document.getElementById("walletChart"),
};

const state = {
  selectedId: COINS[0].id,
  chart: null,
  walletChart: null,
  marketData: [],
  marketPage: 1,
  marketQuery: "",
  dashboardLoaded: false,
  marketLoaded: false,
  chartDays: 1,
  currency: localStorage.getItem(CURRENCY_KEY) || "usd",
  usingMock: false,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: state.currency.toUpperCase(),
    maximumFractionDigits: 2,
  }).format(value);

const formatCompact = (value) =>
  new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(value);

const formatPercent = (value) => {
  if (typeof value !== "number") {
    return "0.00%";
  }
  return `${value.toFixed(2)}%`;
};

const setError = (visible) => {
  elements.errorBanner.hidden = !visible;
};

const setMockMode = (enabled) => {
  state.usingMock = enabled;
  if (elements.mockIndicator) {
    elements.mockIndicator.hidden = !enabled;
  }
};

const setCurrency = (currency) => {
  state.currency = currency;
  localStorage.setItem(CURRENCY_KEY, currency);
  elements.toggleOptions.forEach((option) => {
    option.classList.toggle("active", option.dataset.currency === currency);
  });
};

const setLoadingCards = () => {
  elements.priceCards.innerHTML = "";
  for (let i = 0; i < COINS.length; i += 1) {
    const card = document.createElement("div");
    card.className = "card loading";
    card.textContent = "Carregando...";
    elements.priceCards.appendChild(card);
  }
};

const buildMockMarkets = (count = 4) => {
  const sample = COINS.map((coin, index) => ({
    id: coin.id,
    name: coin.name,
    symbol: coin.symbol.toLowerCase(),
    image: "https://via.placeholder.com/28",
    current_price: 32000 + index * 1200,
    market_cap: 480000000000 - index * 8000000000,
    market_cap_rank: index + 1,
    price_change_percentage_24h: index % 2 === 0 ? 2.5 : -1.8,
  }));

  return sample.slice(0, count);
};

const buildMockGlobal = () => ({
  data: {
    market_cap_percentage: { btc: 48.2 },
    total_market_cap: { [state.currency]: 1500000000000 },
    total_volume: { [state.currency]: 78000000000 },
  },
});

const buildMockChart = (days) => {
  const points = days === 1 ? 24 : Math.min(days, 90);
  const now = Date.now();
  const base = 32000;
  const prices = Array.from({ length: points }, (_, index) => {
    const timestamp = now - (points - index) * 3600 * 1000;
    const price = base + Math.sin(index / 3) * 800 + index * 12;
    return [timestamp, Math.max(1, price)];
  });
  return { prices };
};

const fetchJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Falha ao carregar dados");
  }
  return response.json();
};

const filterMockMarketsByIds = (ids) =>
  MOCK_MARKETS.filter((coin) => ids.includes(coin.id));

const fetchMarketData = async () => {
  const ids = COINS.map((coin) => coin.id).join(",");
  const url = `${API_BASE}/coins/markets?vs_currency=${state.currency}&ids=${ids}&order=market_cap_desc&price_change_percentage=24h`;
  try {
    const data = await fetchJSON(url);
    setMockMode(false);
    return data;
  } catch (error) {
    console.warn("Usando dados mock por falha na API");
    setMockMode(true);
    return filterMockMarketsByIds(ids.split(","));
  }
};

const fetchGlobalData = async () => {
  const url = `${API_BASE}/global`;
  try {
    const data = await fetchJSON(url);
    setMockMode(false);
    return data;
  } catch (error) {
    console.warn("Usando dados mock por falha na API");
    setMockMode(true);
    return MOCK_GLOBAL;
  }
};

const fetchChartData = async (coinId, days) => {
  const url = `${API_BASE}/coins/${coinId}/market_chart?vs_currency=${state.currency}&days=${days}`;
  try {
    const data = await fetchJSON(url);
    setMockMode(false);
    return data;
  } catch (error) {
    console.warn("Usando dados mock por falha na API");
    setMockMode(true);
    return MOCK_CHART;
  }
};

const fetchTopMarketData = async (page) => {
  const url = `${API_BASE}/coins/markets?vs_currency=${state.currency}&order=market_cap_desc&per_page=20&page=${page}&price_change_percentage=24h`;
  try {
    const data = await fetchJSON(url);
    setMockMode(false);
    return data;
  } catch (error) {
    console.warn("Usando dados mock por falha na API");
    setMockMode(true);
    const start = (page - 1) * 20;
    return MOCK_MARKETS.slice(start, start + 20);
  }
};

const fetchPortfolioPrices = async (ids) => {
  const url = `${API_BASE}/coins/markets?vs_currency=${state.currency}&ids=${ids.join(",")}&order=market_cap_desc&price_change_percentage=24h`;
  try {
    const data = await fetchJSON(url);
    setMockMode(false);
    return data;
  } catch (error) {
    console.warn("Usando dados mock por falha na API");
    setMockMode(true);
    return filterMockMarketsByIds(ids);
  }
};

const renderCards = (data) => {
  elements.priceCards.innerHTML = "";

  COINS.forEach((coin) => {
    const info = data.find((item) => item.id === coin.id);
    const card = document.createElement("div");
    card.className = "card";
    card.dataset.id = coin.id;

    const change = info?.price_change_percentage_24h ?? 0;
    const changeClass = change >= 0 ? "positive" : "negative";

    card.innerHTML = `
      <div class="card-header">
        <div>
          <div class="card-title">${coin.name}</div>
          <div class="card-symbol">${coin.symbol}</div>
        </div>
        <span class="card-change ${changeClass}">${formatPercent(change)}</span>
      </div>
      <div class="card-price">${info ? formatCurrency(info.current_price) : "--"}</div>
      <div class="card-change ${changeClass}">${change >= 0 ? "Alta" : "Baixa"} 24h</div>
    `;

    card.addEventListener("click", () => {
      if (state.selectedId !== coin.id) {
        state.selectedId = coin.id;
        updateChart();
        highlightSelectedCard();
      }
    });

    elements.priceCards.appendChild(card);
  });

  highlightSelectedCard();
};

const highlightSelectedCard = () => {
  const cards = elements.priceCards.querySelectorAll(".card");
  cards.forEach((card) => {
    card.classList.toggle("active", card.dataset.id === state.selectedId);
  });
};

const renderStats = (globalData) => {
  if (!globalData?.data) {
    elements.btcDominance.textContent = "--";
    elements.totalMarketCap.textContent = "--";
    elements.totalVolume.textContent = "--";
    return;
  }

  const { data } = globalData;
  const btcDom = data.market_cap_percentage?.btc ?? 0;
  const totalCap = data.total_market_cap?.usd ?? 0;
  const totalVol = data.total_volume?.usd ?? 0;

  elements.btcDominance.textContent = `${btcDom.toFixed(2)}%`;
  elements.totalMarketCap.textContent = formatCompact(totalCap);
  elements.totalVolume.textContent = formatCompact(totalVol);
};

const updateChart = async () => {
  const selectedCoin = COINS.find((coin) => coin.id === state.selectedId);
  if (!selectedCoin) return;

  elements.selectedCoin.textContent = selectedCoin.symbol;
  const subtitleMap = {
    1: "Últimas 24h",
    7: "Últimos 7 dias",
    30: "Últimos 30 dias",
    365: "Últimos 12 meses",
  };
  elements.chartSubtitle.textContent = `${subtitleMap[state.chartDays]} - ${selectedCoin.name}`;

  try {
    elements.chartLoader.hidden = false;
    const data = await fetchChartData(selectedCoin.id, state.chartDays);
    const prices = data.prices.map(([timestamp, price]) => ({
      timestamp,
      price,
    }));

    const labels = prices.map((point) => {
      const date = new Date(point.timestamp);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "short",
      });
    });

    const values = prices.map((point) => point.price);
    const trend = values[values.length - 1] - values[0];
    const lineColor = trend >= 0 ? "#00f5a0" : "#ff4d6d";

    if (state.chart) {
      state.chart.data.labels = labels;
      state.chart.data.datasets[0].data = values;
      state.chart.data.datasets[0].borderColor = lineColor;
      state.chart.data.datasets[0].backgroundColor = `${lineColor}33`;
      state.chart.update();
      elements.chartLoader.hidden = true;
      return;
    }

    const ctx = document.getElementById("priceChart").getContext("2d");
    state.chart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Preço",
            data: values,
            borderColor: lineColor,
            backgroundColor: `${lineColor}33`,
            fill: true,
            tension: 0.35,
            pointRadius: 0,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => formatCurrency(context.parsed.y),
            },
          },
        },
        scales: {
          x: {
            grid: {
              display: false,
            },
            ticks: {
              color: "#a8b2d1",
            },
          },
          y: {
            grid: {
              color: "rgba(255, 255, 255, 0.08)",
            },
            ticks: {
              color: "#a8b2d1",
              callback: (value) => formatCurrency(value),
            },
          },
        },
      },
    });
    elements.chartLoader.hidden = true;
  } catch (error) {
    elements.chartLoader.hidden = true;
    setError(true);
  }
};

const loadDashboard = async () => {
  setError(false);
  setLoadingCards();

  try {
    const [marketData, globalData] = await Promise.all([
      fetchMarketData(),
      fetchGlobalData(),
    ]);

    state.marketData = marketData;
    renderCards(marketData);
    renderStats(globalData);
    await updateChart();
    state.dashboardLoaded = true;
  } catch (error) {
    setError(true);
  }
};

const renderMarketTable = (data) => {
  elements.marketTableBody.innerHTML = "";

  data.forEach((coin, index) => {
    const row = document.createElement("tr");
    row.className = "market-row";

    const change = coin.price_change_percentage_24h ?? 0;
    const changeClass = change >= 0 ? "positive" : "negative";

    row.innerHTML = `
      <td>${coin.market_cap_rank ?? index + 1}</td>
      <td>
        <div class="market-name">
          <img class="market-icon" src="${coin.image}" alt="${coin.name}" />
          <div class="market-coin">
            <strong>${coin.name}</strong>
            <span class="market-symbol">${coin.symbol.toUpperCase()}</span>
          </div>
        </div>
      </td>
      <td>${formatCurrency(coin.current_price)}</td>
      <td class="card-change ${changeClass}">${formatPercent(change)}</td>
      <td>${formatCompact(coin.market_cap)}</td>
    `;

    elements.marketTableBody.appendChild(row);
  });
};

const applyMarketFilter = () => {
  const query = state.marketQuery.trim().toLowerCase();
  if (!query) {
    renderMarketTable(state.marketData);
    return;
  }

  const filtered = state.marketData.filter((coin) =>
    `${coin.name} ${coin.symbol}`.toLowerCase().includes(query)
  );
  renderMarketTable(filtered);
};

const renderMarket = async (reset = false) => {
  setError(false);

  if (reset) {
    state.marketPage = 1;
    state.marketData = [];
    elements.marketTableBody.innerHTML = `
      <tr class="table-loading">
        <td colspan="5">Carregando...</td>
      </tr>
    `;
  }

  try {
    elements.marketLoader.hidden = false;
    const marketData = await fetchTopMarketData(state.marketPage);
    state.marketData = [...state.marketData, ...marketData];
    applyMarketFilter();
    state.marketLoaded = true;
    elements.marketLoader.hidden = true;
  } catch (error) {
    elements.marketLoader.hidden = true;
    setError(true);
  }
};

const getPortfolio = () => {
  const raw = localStorage.getItem(PORTFOLIO_KEY);
  if (!raw) {
    return [];
  }
  try {
    return JSON.parse(raw);
  } catch (error) {
    return [];
  }
};

const savePortfolio = (portfolio) => {
  localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(portfolio));
};

const renderWalletList = (portfolio, prices) => {
  if (!portfolio.length) {
    elements.walletList.innerHTML =
      '<li class="wallet-empty">Nenhum ativo adicionado ainda.</li>';
    elements.walletTotal.textContent = formatCurrency(0);
    if (state.walletChart) {
      state.walletChart.destroy();
      state.walletChart = null;
    }
    return;
  }

  const priceMap = prices.reduce((acc, item) => {
    acc[item.id] = item.current_price;
    return acc;
  }, {});

  let total = 0;
  elements.walletList.innerHTML = "";

  portfolio.forEach((asset) => {
    const currentPrice = priceMap[asset.id] ?? 0;
    const assetTotal = currentPrice * asset.amount;
    total += assetTotal;

    const item = document.createElement("li");
    item.className = "wallet-item";
    item.innerHTML = `
      <div>
        <strong>${asset.name}</strong>
        <span>${asset.symbol} · ${asset.amount} unidade(s)</span>
      </div>
      <div class="wallet-actions">
        <div>
          <strong>${formatCurrency(assetTotal)}</strong>
          <span>${formatCurrency(currentPrice)} / unidade</span>
        </div>
        <button class="wallet-remove" type="button" data-id="${asset.id}">✕</button>
      </div>
    `;

    elements.walletList.appendChild(item);
  });

  elements.walletTotal.textContent = formatCurrency(total);

  const chartLabels = portfolio.map((asset) => asset.symbol);
  const chartValues = portfolio.map((asset) =>
    (priceMap[asset.id] ?? 0) * asset.amount
  );

  if (state.walletChart) {
    state.walletChart.data.labels = chartLabels;
    state.walletChart.data.datasets[0].data = chartValues;
    state.walletChart.update();
    return;
  }

  if (elements.walletChart) {
    const ctx = elements.walletChart.getContext("2d");
    state.walletChart = new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: chartLabels,
        datasets: [
          {
            data: chartValues,
            backgroundColor: ["#5f6bff", "#00f5a0", "#ff4d6d", "#f1c453"],
            borderWidth: 0,
          },
        ],
      },
      options: {
        plugins: {
          legend: {
            labels: {
              color: "#a8b2d1",
            },
          },
        },
      },
    });
  }
};

const renderWallet = async () => {
  setError(false);
  const portfolio = getPortfolio();

  if (!portfolio.length) {
    renderWalletList([], []);
    return;
  }

  try {
    const prices = await fetchPortfolioPrices(portfolio.map((item) => item.id));
    renderWalletList(portfolio, prices);
  } catch (error) {
    setError(true);
  }
};

const buildWalletSelect = () => {
  elements.walletCoin.innerHTML = "";
  COINS.forEach((coin) => {
    const option = document.createElement("option");
    option.value = coin.id;
    option.textContent = `${coin.name} (${coin.symbol})`;
    elements.walletCoin.appendChild(option);
  });
};

const addToPortfolio = (coinId, amount) => {
  const coin = COINS.find((item) => item.id === coinId);
  if (!coin || amount <= 0) return;

  const portfolio = getPortfolio();
  const existing = portfolio.find((item) => item.id === coinId);

  if (existing) {
    existing.amount += amount;
  } else {
    portfolio.push({
      id: coin.id,
      symbol: coin.symbol,
      name: coin.name,
      amount,
    });
  }

  savePortfolio(portfolio);
  renderWallet();
};

const renderDashboard = async () => {
  if (!state.dashboardLoaded) {
    await loadDashboard();
  }
};

const MapsTo = (viewId) => {
  elements.views.forEach((view) => {
    view.hidden = view.id !== viewId;
  });

  elements.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });

  if (viewId === "view-dashboard") {
    renderDashboard();
  }

  if (viewId === "view-market") {
    renderMarket(!state.marketLoaded);
  }

  if (viewId === "view-wallet") {
    renderWallet();
  }
};

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", loadDashboard);
}

if (elements.marketRefreshButton) {
  elements.marketRefreshButton.addEventListener("click", () => renderMarket(true));
}

if (elements.walletForm) {
  elements.walletForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const coinId = elements.walletCoin.value;
    const amount = Number(elements.walletAmount.value);
    addToPortfolio(coinId, amount);
    elements.walletAmount.value = "";
  });
}

if (elements.walletList) {
  elements.walletList.addEventListener("click", (event) => {
    const target = event.target;
    if (target.classList.contains("wallet-remove")) {
      const id = target.dataset.id;
      const portfolio = getPortfolio().filter((asset) => asset.id !== id);
      savePortfolio(portfolio);
      renderWallet();
    }
  });
}

if (elements.marketSearch) {
  elements.marketSearch.addEventListener("input", (event) => {
    state.marketQuery = event.target.value;
    applyMarketFilter();
  });
}

if (elements.marketLoadMore) {
  elements.marketLoadMore.addEventListener("click", () => {
    state.marketPage += 1;
    renderMarket();
  });
}

if (elements.timeframeButtons.length) {
  elements.timeframeButtons.forEach((button) => {
    button.addEventListener("click", () => {
      elements.timeframeButtons.forEach((item) => item.classList.remove("active"));
      button.classList.add("active");
      state.chartDays = Number(button.dataset.days);
      updateChart();
    });
  });
}

if (elements.currencyToggle) {
  elements.currencyToggle.addEventListener("click", (event) => {
    const option = event.target.closest(".toggle-option");
    if (!option) return;
    setCurrency(option.dataset.currency);
    state.dashboardLoaded = false;
    state.marketLoaded = false;
    state.marketPage = 1;
    state.marketData = [];
    renderDashboard();
    if (!elements.views[0]?.hidden) {
      renderDashboard();
    }
    renderMarket(true);
    renderWallet();
  });
}

if (elements.navItems.length) {
  elements.navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const viewId = item.dataset.view;
      MapsTo(viewId);
      history.replaceState(null, "", item.getAttribute("href"));
    });
  });
}

buildWalletSelect();
setCurrency(state.currency);

const initialHash = window.location.hash;
const viewMap = {
  "#dashboard": "view-dashboard",
  "#mercado": "view-market",
  "#carteira": "view-wallet",
};

MapsTo(viewMap[initialHash] || "view-dashboard");
