// CryptoDash — Wallet Feature (Redesigned)

import Chart from 'chart.js/auto';
import { state } from '../core/state';
import { el } from '../core/dom';
import { escapeHtml, formatCurrency, formatPct, toast } from '../utils/helpers';

// ============================================
// Internal state
// ============================================

let editIndex = -1;
let currentSort: string = 'value-desc';

// ============================================
// Searchable Coin Picker
// ============================================

const openDropdown = (): void => {
  if (el.walletCoinDropdown) el.walletCoinDropdown.hidden = false;
  filterCoinList('');
};

const closeDropdown = (): void => {
  if (el.walletCoinDropdown) el.walletCoinDropdown.hidden = true;
};

const filterCoinList = (query: string): void => {
  const coins = state.markets.length ? state.markets : [];
  const q = query.toLowerCase().trim();
  const filtered = q
    ? coins.filter(c => c.name.toLowerCase().includes(q) || c.symbol.toLowerCase().includes(q))
    : coins.slice(0, 50);

  if (el.walletCoinList) {
    el.walletCoinList.innerHTML = filtered.length
      ? filtered.map(c => `
        <li class="coin-dropdown-item" data-id="${c.id}" data-name="${escapeHtml(c.name)}" data-symbol="${escapeHtml(c.symbol.toUpperCase())}" data-image="${c.image || ''}" data-price="${c.current_price ?? 0}">
          <img src="${c.image || ''}" alt="" width="20" height="20" loading="lazy" />
          <span class="coin-dd-name">${escapeHtml(c.name)}</span>
          <span class="coin-dd-symbol">${escapeHtml(c.symbol.toUpperCase())}</span>
          <span class="coin-dd-price">${formatCurrency(c.current_price ?? 0)}</span>
        </li>`).join('')
      : '<li class="coin-dropdown-empty">Nenhuma moeda encontrada</li>';
  }
};

const selectCoin = (id: string, name: string, symbol: string, image: string, price: number): void => {
  if (el.walletCoin) (el.walletCoin as HTMLInputElement).value = id;
  if (el.walletCoinSearch) {
    (el.walletCoinSearch as HTMLInputElement).value = `${name} (${symbol})`;
    (el.walletCoinSearch as HTMLInputElement).dataset.image = image;
    (el.walletCoinSearch as HTMLInputElement).dataset.price = String(price);
  }
  closeDropdown();
  updatePreview();
};

const updatePreview = (): void => {
  const coin = (el.walletCoin as HTMLInputElement)?.value;
  const amount = parseFloat((el.walletAmount as HTMLInputElement)?.value || '0');
  const buyPrice = parseFloat((el.walletBuyPrice as HTMLInputElement)?.value || '0');
  const market = state.markets.find(c => c.id === coin);

  if (!coin || !amount || amount <= 0 || !market) {
    if (el.walletFormPreview) el.walletFormPreview.hidden = true;
    return;
  }

  const currentPrice = market.current_price ?? 0;
  const currentValue = currentPrice * amount;
  let previewText = `Valor atual: <strong>${formatCurrency(currentValue)}</strong>`;

  if (buyPrice > 0) {
    const invested = buyPrice * amount;
    const pnl = currentValue - invested;
    const pnlPct = invested > 0 ? ((currentValue - invested) / invested) * 100 : 0;
    const cls = pnl >= 0 ? 'positive' : 'negative';
    previewText += ` · Investido: ${formatCurrency(invested)} · P&L: <span class="wallet-item-pnl ${cls}">${formatCurrency(pnl)} (${formatPct(pnlPct)})</span>`;
  }

  if (el.walletPreviewText) el.walletPreviewText.innerHTML = previewText;
  if (el.walletFormPreview) el.walletFormPreview.hidden = false;
};

// ============================================
// Sorting
// ============================================

interface WalletComputedItem {
  coin: string;
  amount: number;
  buyPrice: number;
  market: typeof state.markets[number] | undefined;
  price: number;
  val: number;
  pnl: number | null;
  pnlPct: number | null;
  invested: number;
  index: number;
}

const sortItems = (items: WalletComputedItem[]): WalletComputedItem[] => {
  const sorted = [...items];
  switch (currentSort) {
    case 'value-desc': sorted.sort((a, b) => b.val - a.val); break;
    case 'value-asc': sorted.sort((a, b) => a.val - b.val); break;
    case 'pnl-desc': sorted.sort((a, b) => (b.pnlPct ?? -Infinity) - (a.pnlPct ?? -Infinity)); break;
    case 'pnl-asc': sorted.sort((a, b) => (a.pnlPct ?? Infinity) - (b.pnlPct ?? Infinity)); break;
    case 'name-asc': sorted.sort((a, b) => (a.market?.name || a.coin).localeCompare(b.market?.name || b.coin)); break;
  }
  return sorted;
};

// ============================================
// Wallet Rendering
// ============================================

export const renderWallet = (): void => {
  const coins = state.markets.length ? state.markets : [];

  if (!state.portfolio.length) {
    if (el.walletList) {
      el.walletList.innerHTML = `
        <li class="wallet-empty">
          <i class="ph-light ph-wallet" style="font-size:2.5rem;opacity:0.3"></i>
          <span>Nenhum ativo adicionado ainda.</span>
          <span class="wallet-empty-hint">Use o formulário acima para adicionar sua primeira moeda.</span>
        </li>`;
    }
    if (el.walletTotalBig) el.walletTotalBig.textContent = formatCurrency(0);
    if (el.walletInvested) el.walletInvested.textContent = '--';
    if (el.walletCount) el.walletCount.textContent = '0';
    if (el.walletPnl) el.walletPnl.textContent = '--';
    if (el.walletTotal) el.walletTotal.textContent = formatCurrency(0);
    if (el.walletChartLegend) el.walletChartLegend.innerHTML = '';
    if (state.walletChartInstance) { state.walletChartInstance.destroy(); state.walletChartInstance = null; }
    return;
  }

  let total = 0;
  let totalPnl = 0;
  let totalInvested = 0;

  const items: WalletComputedItem[] = state.portfolio.map((p, index) => {
    const market = coins.find(c => c.id === p.coin);
    const price = market ? market.current_price : 0;
    const val = price * p.amount;
    total += val;

    let pnl: number | null = null;
    let pnlPct: number | null = null;
    let invested = 0;
    if (p.buyPrice && p.buyPrice > 0) {
      invested = p.buyPrice * p.amount;
      totalInvested += invested;
      pnl = val - invested;
      totalPnl += pnl;
      pnlPct = invested > 0 ? ((val - invested) / invested) * 100 : 0;
    }

    return { ...p, market, price, val, pnl, pnlPct, invested, index };
  });

  // Summary cards
  if (el.walletTotalBig) el.walletTotalBig.textContent = formatCurrency(total);
  if (el.walletCount) el.walletCount.textContent = state.portfolio.length.toString();
  if (el.walletTotal) el.walletTotal.textContent = formatCurrency(total);

  if (totalInvested > 0) {
    if (el.walletInvested) el.walletInvested.textContent = formatCurrency(totalInvested);
    const totalPnlPct = ((total - totalInvested) / totalInvested) * 100;
    const cls = totalPnl >= 0 ? 'positive' : 'negative';
    if (el.walletPnl) {
      el.walletPnl.innerHTML = `<span class="wallet-item-pnl ${cls}">${formatCurrency(totalPnl)} (${formatPct(totalPnlPct)})</span>`;
    }
  } else {
    if (el.walletInvested) el.walletInvested.textContent = '--';
    if (el.walletPnl) el.walletPnl.textContent = '--';
  }

  // Sort and render list
  const sorted = sortItems(items);

  if (el.walletList) {
    el.walletList.innerHTML = sorted.map(it => {
      const pctOfPortfolio = total > 0 ? (it.val / total * 100).toFixed(1) : '0.0';
      const pnlHtml = it.pnlPct !== null
        ? `<div class="wallet-item-pnl ${it.pnlPct >= 0 ? 'positive' : 'negative'}">${formatCurrency(it.pnl!)} (${formatPct(it.pnlPct)})</div>`
        : '';

      return `<li class="wallet-item" data-index="${it.index}" title="Clique para editar">
        <img src="${it.market?.image || ''}" alt="${escapeHtml(it.market?.name || it.coin)}" width="32" height="32" loading="lazy" />
        <div class="wallet-item-info">
          <div class="wallet-item-name">
            ${escapeHtml(it.market?.name || it.coin)}
            <span class="wallet-item-symbol">${escapeHtml(it.market?.symbol?.toUpperCase() || '')}</span>
          </div>
          <div class="wallet-item-meta">
            ${it.amount} un · Preço atual: ${formatCurrency(it.price)} · ${pctOfPortfolio}% do portfólio
          </div>
        </div>
        <div class="wallet-item-right">
          <div class="wallet-item-value">${formatCurrency(it.val)}</div>
          ${pnlHtml}
        </div>
      </li>`;
    }).join('');
  }

  // Doughnut chart
  const colors = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#ef4444'];
  if (state.walletChartInstance) state.walletChartInstance.destroy();
  const walletChartCanvas = el.walletChart as HTMLCanvasElement;
  if (walletChartCanvas) {
    state.walletChartInstance = new Chart(walletChartCanvas, {
      type: 'doughnut',
      data: {
        labels: sorted.map(it => it.market?.symbol?.toUpperCase() || it.coin),
        datasets: [{
          data: sorted.map(it => it.val),
          backgroundColor: sorted.map((_, i) => colors[i % colors.length]),
          borderWidth: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const pct = total > 0 ? (ctx.parsed / total * 100).toFixed(1) : '0';
                return `${ctx.label}: ${formatCurrency(ctx.parsed)} (${pct}%)`;
              },
            },
          },
        },
        animation: state.reducedMotion ? false : { duration: 600 },
      },
    });
  }

  // Chart legend
  if (el.walletChartLegend) {
    el.walletChartLegend.innerHTML = sorted.map((it, i) => {
      const pct = total > 0 ? (it.val / total * 100).toFixed(1) : '0';
      return `<div class="wallet-legend-item">
        <span class="wallet-legend-color" style="background:${colors[i % colors.length]}"></span>
        <span class="wallet-legend-label">${escapeHtml(it.market?.symbol?.toUpperCase() || it.coin)}</span>
        <span class="wallet-legend-pct">${pct}%</span>
      </div>`;
    }).join('');
  }
};

// ============================================
// Edit Modal
// ============================================

const openEditModal = (index: number): void => {
  const item = state.portfolio[index];
  if (!item) return;

  editIndex = index;
  const market = state.markets.find(c => c.id === item.coin);

  if (el.walletModalCoin) {
    el.walletModalCoin.innerHTML = `
      <img src="${market?.image || ''}" alt="" width="28" height="28" />
      <span>${escapeHtml(market?.name || item.coin)}</span>
      <span class="wallet-modal-symbol">${escapeHtml(market?.symbol?.toUpperCase() || '')}</span>
    `;
  }

  (el.walletEditAmount as HTMLInputElement).value = String(item.amount);
  (el.walletEditBuyPrice as HTMLInputElement).value = item.buyPrice > 0 ? String(item.buyPrice) : '';

  if (el.walletModal) el.walletModal.classList.add('active');
};

const closeEditModal = (): void => {
  editIndex = -1;
  if (el.walletModal) el.walletModal.classList.remove('active');
};

// ============================================
// Wallet Coin Selector (populate)
// ============================================

export const populateWalletCoins = (): void => {
  filterCoinList('');
};

// ============================================
// Wallet Init
// ============================================

export const initWallet = (): void => {
  populateWalletCoins();

  // Searchable coin picker
  const searchInput = el.walletCoinSearch as HTMLInputElement;
  if (searchInput) {
    searchInput.addEventListener('focus', () => openDropdown());
    searchInput.addEventListener('input', () => {
      filterCoinList(searchInput.value);
      if (el.walletCoinDropdown) el.walletCoinDropdown.hidden = false;
    });
  }

  // Close dropdown on click outside
  document.addEventListener('click', (e) => {
    const picker = (e.target as HTMLElement).closest('.wallet-coin-picker');
    if (!picker) closeDropdown();
  });

  // Select coin from dropdown
  el.walletCoinList?.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.coin-dropdown-item') as HTMLElement;
    if (!item) return;
    selectCoin(
      item.dataset.id || '',
      item.dataset.name || '',
      item.dataset.symbol || '',
      item.dataset.image || '',
      parseFloat(item.dataset.price || '0')
    );
  });

  // Live preview on amount/buyPrice change
  el.walletAmount?.addEventListener('input', updatePreview);
  el.walletBuyPrice?.addEventListener('input', updatePreview);

  // Sort selector
  el.walletSort?.addEventListener('change', () => {
    currentSort = (el.walletSort as HTMLSelectElement).value;
    renderWallet();
  });

  // Add asset form submit
  el.walletForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const coin = (el.walletCoin as HTMLInputElement)?.value;
    const amount = parseFloat((el.walletAmount as HTMLInputElement)?.value);
    const buyPrice = parseFloat((el.walletBuyPrice as HTMLInputElement)?.value) || 0;

    if (!coin || !amount || amount <= 0) {
      toast('Preencha os campos corretamente', 'warning');
      return;
    }

    const existing = state.portfolio.find(p => p.coin === coin);
    if (existing) {
      if (buyPrice > 0 && existing.buyPrice > 0) {
        const totalQty = existing.amount + amount;
        existing.buyPrice = ((existing.buyPrice * existing.amount) + (buyPrice * amount)) / totalQty;
        existing.amount = totalQty;
      } else {
        existing.amount += amount;
        if (buyPrice > 0) existing.buyPrice = buyPrice;
      }
      toast('Ativo atualizado com sucesso!', 'success');
    } else {
      state.portfolio.push({ coin, amount, buyPrice });
      toast('Ativo adicionado!', 'success');
    }

    state.savePortfolio();
    renderWallet();

    // Reset form
    if (el.walletForm) (el.walletForm as HTMLFormElement).reset();
    if (el.walletCoin) (el.walletCoin as HTMLInputElement).value = '';
    if (el.walletFormPreview) el.walletFormPreview.hidden = true;
  });

  // Click on asset to edit
  el.walletList?.addEventListener('click', (e) => {
    const item = (e.target as HTMLElement).closest('.wallet-item') as HTMLElement;
    if (!item || item.classList.contains('wallet-empty')) return;
    const idx = parseInt(item.dataset.index || '-1');
    if (idx >= 0) openEditModal(idx);
  });

  // Edit form submit (save)
  el.walletEditForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    if (editIndex < 0 || editIndex >= state.portfolio.length) return;

    const newAmount = parseFloat((el.walletEditAmount as HTMLInputElement)?.value);
    const newBuyPrice = parseFloat((el.walletEditBuyPrice as HTMLInputElement)?.value) || 0;

    if (!newAmount || newAmount <= 0) {
      toast('Quantidade inválida', 'warning');
      return;
    }

    state.portfolio[editIndex].amount = newAmount;
    state.portfolio[editIndex].buyPrice = newBuyPrice;

    state.savePortfolio();
    renderWallet();
    closeEditModal();
    toast('Ativo atualizado!', 'success');
  });

  // Delete from modal
  el.walletEditDelete?.addEventListener('click', () => {
    if (editIndex < 0 || editIndex >= state.portfolio.length) return;
    const item = state.portfolio[editIndex];
    const market = state.markets.find(c => c.id === item.coin);
    const name = market?.name || item.coin;

    if (confirm(`Remover ${name} da carteira?`)) {
      state.portfolio.splice(editIndex, 1);
      state.savePortfolio();
      renderWallet();
      closeEditModal();
      toast('Ativo removido', 'info');
    }
  });

  // Close modal
  el.walletModalClose?.addEventListener('click', closeEditModal);
  el.walletModal?.addEventListener('click', (e) => {
    if (e.target === el.walletModal) closeEditModal();
  });
};
