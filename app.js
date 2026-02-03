const COINS = [
  { id: "bitcoin", name: "Bitcoin", symbol: "BTC" },
  { id: "ethereum", name: "Ethereum", symbol: "ETH" },
  { id: "solana", name: "Solana", symbol: "SOL" },
  { id: "cardano", name: "Cardano", symbol: "ADA" },
];

const API_BASE = "https://api.coingecko.com/api/v3";

const elements = {
  priceCards: document.getElementById("priceCards"),
  errorBanner: document.getElementById("errorBanner"),
  selectedCoin: document.getElementById("selectedCoin"),
  chartSubtitle: document.getElementById("chartSubtitle"),
  refreshButton: document.getElementById("refreshButton"),
  btcDominance: document.getElementById("btcDominance"),
  totalMarketCap: document.getElementById("totalMarketCap"),
  totalVolume: document.getElementById("totalVolume"),
};

const state = {
  selectedId: COINS[0].id,
  chart: null,
  marketData: [],
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
  } catch (error) {
    setError(true);
  }
};

if (elements.refreshButton) {
  elements.refreshButton.addEventListener("click", loadDashboard);
}

loadDashboard();
