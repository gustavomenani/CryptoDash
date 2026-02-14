// CryptoDash — Alerts Feature

import { state } from '../core/state';
import { el } from '../core/dom';
import { escapeHtml, formatCurrency, toast } from '../utils/helpers';
import { i18n } from '../i18n/index';

// ============================================
// Alert Rendering
// ============================================

export const renderAlerts = (): void => {
  if (!el.alertList) return;

  if (!state.alerts.length) {
    el.alertList.innerHTML = `<li class="alert-empty"><i class="ph-light ph-bell-slash" style="font-size:32px;opacity:0.3"></i><span>Nenhum alerta configurado.</span></li>`;
    return;
  }

  el.alertList.innerHTML = state.alerts.map((a, i) => {
    const market = state.markets.find(c => c.id === a.coin);
    const name = market?.name || a.coin;
    const currentPrice = market?.current_price || 0;

    let status = '';
    if (currentPrice > 0) {
      if (a.condition === 'above' && currentPrice >= a.target) status = ' alert-triggered';
      if (a.condition === 'below' && currentPrice <= a.target) status = ' alert-triggered';
    }

    return `<li class="alert-item${status}">
      <img src="${market?.image || ''}" alt="${escapeHtml(name)}" width="24" height="24" loading="lazy" />
      <div class="alert-item-info">
        <strong>${escapeHtml(name)}</strong>
        <span>${a.condition === 'above' ? '↑ Acima de' : '↓ Abaixo de'} ${formatCurrency(a.target)}</span>
      </div>
      <span class="alert-item-remove" data-index="${i}" title="Remover"><i class="ph-light ph-trash"></i></span>
    </li>`;
  }).join('');
};

// ============================================
// Alert Checking (runs on each data refresh)
// ============================================

export const checkAlerts = (): void => {
  if (!state.alerts.length || !state.markets.length) return;

  state.alerts.forEach(a => {
    if (a.triggered) return;

    const market = state.markets.find(c => c.id === a.coin);
    if (!market) return;

    const price = market.current_price;
    const hit = (a.condition === 'above' && price >= a.target) || (a.condition === 'below' && price <= a.target);

    if (hit) {
      a.triggered = true;
      toast(`🔔 ${market.name} ${a.condition === 'above' ? 'atingiu' : 'caiu para'} ${formatCurrency(price)}!`, 'info');

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('CryptoDash Alert', {
          body: `${market.name} ${a.condition === 'above' ? 'reached' : 'dropped to'} ${formatCurrency(price)}`,
          icon: market.image,
        });
      }
    }
  });

  state.saveAlerts();
  renderAlerts();
};

// ============================================
// Alert Init
// ============================================

export const initAlerts = (): void => {
  const coins = state.markets.length ? state.markets : [];

  if (el.alertCoin) {
    (el.alertCoin as HTMLSelectElement).innerHTML = coins.map(c =>
      `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`
    ).join('');
  }

  el.alertForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    const coin = (el.alertCoin as HTMLSelectElement)?.value;
    const target = parseFloat((el.alertTarget as HTMLInputElement)?.value);
    const condition = (el.alertCondition as HTMLSelectElement)?.value as 'above' | 'below';

    if (!coin || !target || target <= 0) {
      toast('Preencha os campos corretamente', 'warning');
      return;
    }

    state.alerts.push({ coin, target, condition, triggered: false, created: Date.now() });
    state.saveAlerts();
    renderAlerts();
    if (el.alertForm) (el.alertForm as HTMLFormElement).reset();

    // Re-populate select after reset
    if (el.alertCoin) {
      (el.alertCoin as HTMLSelectElement).innerHTML = coins.map(c =>
        `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`
      ).join('');
    }

    toast(i18n.t('common.success') + '!', 'success');
  });

  el.alertList?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('.alert-item-remove');
    if (!btn) return;
    const idx = parseInt((btn as HTMLElement).dataset.index || '0');
    state.alerts.splice(idx, 1);
    state.saveAlerts();
    renderAlerts();
    toast(i18n.t('common.delete') + ' ✓', 'info');
  });

  // Request notification permission
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};
