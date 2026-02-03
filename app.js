const COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
];

const API_BASE = "https://api.coingecko.com/api/v3";
const PORTFOLIO_KEY = "cryptodash-portfolio";

const elements = {
  priceCards: document.getElementById("priceCards"),
  errorBanner: document.getElementById("errorBanner"),
  selectedCoin: document.getElementById("selectedCoin"),
  chartSubtitle: document.getElementById("chartSubtitle"),
  refreshButton: document.getElementById("refreshButton"),
  btcDominance: document.getElementById("btcDominance"),
  totalMarketCap: document.getElementById("totalMarketCap"),
  totalVolume: document.getElementById("totalVolume"),
  navItems: document.querySelectorAll(".nav-item[data-view]"),
  views: document.querySelectorAll(".view"),
  marketTableBody: document.getElementById("marketTableBody"),
  marketRefreshButton: document.getElementById("marketRefreshButton"),
  walletForm: document.getElementById("walletForm"),
  walletCoin: document.getElementById("walletCoin"),
  walletAmount: document.getElementById("walletAmount"),
  walletList: document.getElementById("walletList"),
  walletTotal: document.getElementById("walletTotal"),
};

const state = {
  selectedId: COINS[0].id,
  chart: null,
  marketData: [],
  dashboardLoaded: false,
  marketLoaded: false,
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "USD",
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

const setLoadingCards = () => {
  elements.priceCards.innerHTML = "";
  for (let i = 0; i < COINS.length; i += 1) {
    const card = document.createElement("div");
    card.className = "card loading";
    card.textContent = "Carregando...";
    elements.priceCards.appendChild(card);
  }
};

const fetchJSON = async (url) => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error("Falha ao carregar dados");
  }
  return response.json();
};

const fetchMarketData = async () => {
  const ids = COINS.map((coin) => coin.id).join(",");
  const url = `${API_BASE}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&price_change_percentage=24h`;
  return fetchJSON(url);
};

const fetchGlobalData = async () => {
  const url = `${API_BASE}/global`;
  return fetchJSON(url);
};

const fetchChartData = async (coinId) => {
  const url = `${API_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=7`;
  return fetchJSON(url);
};

const fetchTopMarketData = async () => {
  const url = `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h`;
  return fetchJSON(url);
};

const fetchPortfolioPrices = async (ids) => {
  const url = `${API_BASE}/coins/markets?vs_currency=usd&ids=${ids.join(",")}&order=market_cap_desc&price_change_percentage=24h`;
  return fetchJSON(url);
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
  elements.chartSubtitle.textContent = `Últimos 7 dias - ${selectedCoin.name}`;

  try {
    const data = await fetchChartData(selectedCoin.id);
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
  } catch (error) {
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
          <strong>${coin.name}</strong>
          <span class="market-symbol">${coin.symbol.toUpperCase()}</span>
        </div>
      </td>
      <td>${formatCurrency(coin.current_price)}</td>
      <td class="card-change ${changeClass}">${formatPercent(change)}</td>
      <td>${formatCompact(coin.market_cap)}</td>
    `;

    elements.marketTableBody.appendChild(row);
  });
};

const renderMarket = async () => {
  setError(false);
  elements.marketTableBody.innerHTML = `
    <tr class="table-loading">
      <td colspan="5">Carregando...</td>
    </tr>
  `;

  try {
    const marketData = await fetchTopMarketData();
    renderMarketTable(marketData);
    state.marketLoaded = true;
  } catch (error) {
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
      <div>
        <strong>${formatCurrency(assetTotal)}</strong>
        <span>${formatCurrency(currentPrice)} / unidade</span>
      </div>
    `;

    elements.walletList.appendChild(item);
  });

  elements.walletTotal.textContent = formatCurrency(total);
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

const setActiveView = (viewId) => {
  elements.views.forEach((view) => {
    view.classList.toggle("active", view.id === viewId);
  });

  elements.navItems.forEach((item) => {
    item.classList.toggle("active", item.dataset.view === viewId);
  });

  if (viewId === "dashboard-view") {
    renderDashboard();
  }

  if (viewId === "market-view") {
    renderMarket();
  }

  if (viewId === "wallet-view") {
    renderWallet();
  }
};

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", loadDashboard);
}

if (elements.marketRefreshButton) {
  elements.marketRefreshButton.addEventListener("click", renderMarket);
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

if (elements.navItems.length) {
  elements.navItems.forEach((item) => {
    item.addEventListener("click", (event) => {
      event.preventDefault();
      const viewId = item.dataset.view;
      setActiveView(viewId);
      history.replaceState(null, "", item.getAttribute("href"));
    });
  });
}

buildWalletSelect();

const initialHash = window.location.hash;
const viewMap = {
  "#dashboard": "dashboard-view",
  "#mercado": "market-view",
  "#carteira": "wallet-view",
};

setActiveView(viewMap[initialHash] || "dashboard-view");
