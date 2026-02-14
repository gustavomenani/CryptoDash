// CryptoDash — Converter Feature

import { state } from '../core/state';
import { el } from '../core/dom';
import { CONFIG, FIAT_OPTIONS } from '../config/constants';
import { debounce } from '../utils/helpers';
import { i18n } from '../i18n/index';

// ============================================
// Converter
// ============================================

export const buildConverterSelects = (): void => {
  const coins = state.markets.length ? state.markets.slice(0, 30) : [];
  const cryptoOpts = coins.map(c => `<option value="${c.id}">${c.name} (${c.symbol.toUpperCase()})</option>`).join('');
  const fiatOpts = FIAT_OPTIONS.map(f => `<option value="${f.id}">${f.name} (${f.symbol})</option>`).join('');
  const allOpts = cryptoOpts + `<optgroup label="Moedas Fiduciárias">${fiatOpts}</optgroup>`;

  if (el.converterFrom) (el.converterFrom as HTMLSelectElement).innerHTML = allOpts;
  if (el.converterTo) (el.converterTo as HTMLSelectElement).innerHTML = allOpts;

  if (el.converterFrom) (el.converterFrom as HTMLSelectElement).value = 'bitcoin';
  if (el.converterTo) (el.converterTo as HTMLSelectElement).value = '__usd';
};

export const runConversion = (): void => {
  const fromId = (el.converterFrom as HTMLSelectElement)?.value;
  const toId = (el.converterTo as HTMLSelectElement)?.value;
  const amount = parseFloat((el.converterAmount as HTMLInputElement)?.value) || 0;

  if (!fromId || !toId || amount <= 0) {
    if (el.converterResult) el.converterResult.textContent = '0.00';
    if (el.converterRate) el.converterRate.textContent = '';
    return;
  }

  const getPrice = (id: string): number => {
    if (id.startsWith('__')) {
      const fiat = id.replace('__', '');
      if (fiat === state.currency) return 1;
      const rateFrom = CONFIG.CURRENCY_RATES[state.currency] || 1;
      const rateTo = CONFIG.CURRENCY_RATES[fiat] || 1;
      return rateFrom / rateTo;
    }
    const market = state.markets.find(c => c.id === id);
    if (market) return market.current_price;
    return 0;
  };

  const fromPrice = getPrice(fromId);
  const toPrice = getPrice(toId);

  if (!fromPrice || !toPrice) {
    if (el.converterResult) el.converterResult.textContent = 'Erro';
    return;
  }

  const rate = fromPrice / toPrice;
  const result = amount * rate;

  const fromSymbol = fromId.startsWith('__') ? fromId.replace('__', '').toUpperCase() : state.markets.find(c => c.id === fromId)?.symbol.toUpperCase() || fromId;
  const toSymbol = toId.startsWith('__') ? toId.replace('__', '').toUpperCase() : state.markets.find(c => c.id === toId)?.symbol.toUpperCase() || toId;

  if (el.converterResult) {
    el.converterResult.textContent = result < 0.01 ? result.toFixed(8) : result < 100 ? result.toFixed(4) : result.toLocaleString(i18n.getLocale(), { maximumFractionDigits: 2 });
  }
  if (el.converterRate) {
    el.converterRate.textContent = `1 ${fromSymbol} = ${rate < 0.01 ? rate.toFixed(8) : rate.toFixed(4)} ${toSymbol}`;
  }

  // Quick convert grid
  const amounts = [0.1, 0.5, 1, 5, 10, 100];
  if (el.quickConvertGrid) {
    el.quickConvertGrid.innerHTML = amounts.map(a => `
      <div class="quick-convert-item">
        <strong>${a} ${fromSymbol}</strong>
        <span>${(a * rate) < 0.01 ? (a * rate).toFixed(8) : (a * rate).toLocaleString(i18n.getLocale(), { maximumFractionDigits: 4 })} ${toSymbol}</span>
      </div>
    `).join('');
  }
};

export const initConverter = (): void => {
  const run = debounce(() => runConversion(), 300);
  el.converterFrom?.addEventListener('change', run);
  el.converterTo?.addEventListener('change', run);
  el.converterAmount?.addEventListener('input', run);
  el.converterSwap?.addEventListener('click', () => {
    const from = el.converterFrom as HTMLSelectElement;
    const to = el.converterTo as HTMLSelectElement;
    if (from && to) {
      const tmp = from.value;
      from.value = to.value;
      to.value = tmp;
      runConversion();
    }
  });
};
