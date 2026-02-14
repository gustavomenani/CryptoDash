// CryptoDash — Utility Functions

import { el } from '../core/dom';
import { state } from '../core/state';
import { i18n } from '../i18n/index';

// ============================================
// Sanitization
// ============================================

export const escapeHtml = (str: string): string => {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
};

// ============================================
// Formatting
// ============================================

export const formatCurrency = (val: number | null | undefined, currency = state.currency): string => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const abs = Math.abs(val);
  const opts: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: abs < 1 ? 6 : 2,
    maximumFractionDigits: abs < 1 ? 8 : 4
  };
  try {
    return new Intl.NumberFormat(i18n.getLocale(), opts).format(val);
  } catch {
    return `${currency.toUpperCase()} ${val.toLocaleString(i18n.getLocale())}`;
  }
};

export const formatCompact = (val: number): string => {
  if (!val && val !== 0) return '--';
  const sym = { usd: '$', brl: 'R$', eur: '€' }[state.currency];
  if (val >= 1e12) return `${sym} ${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `${sym} ${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${sym} ${(val / 1e6).toFixed(2)}M`;
  return formatCurrency(val);
};

export const formatPct = (val: number | null | undefined): string => {
  if (val === null || val === undefined || isNaN(val)) return '--';
  const sign = val >= 0 ? '+' : '';
  return `${sign}${val.toFixed(2)}%`;
};

// ============================================
// Debounce
// ============================================

export const debounce = <T extends (...args: unknown[]) => unknown>(fn: T, ms: number): (...args: Parameters<T>) => void => {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  };
};

// ============================================
// Toast Notifications
// ============================================

export const toast = (msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', duration = 3500): void => {
  const container = el.toastContainer;
  if (!container) return;

  const t = document.createElement('div');
  t.className = `toast ${type}`;

  const icon = type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : type === 'warning' ? 'warning' : 'info';
  const iconEl = document.createElement('i');
  iconEl.className = `ph-light ph-${icon}`;

  const textEl = document.createElement('span');
  textEl.textContent = msg;

  t.append(iconEl, textEl);
  container.appendChild(t);

  setTimeout(() => {
    t.classList.add('fade-out');
    setTimeout(() => t.remove(), 300);
  }, duration);
};

// ============================================
// Confirm Dialog
// ============================================

export const confirmAction = (
  message: string,
  options?: { confirmText?: string; cancelText?: string }
): Promise<boolean> => new Promise(resolve => {
  const overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');

  const dialog = document.createElement('div');
  dialog.className = 'confirm-dialog';

  const msg = document.createElement('p');
  msg.className = 'confirm-message';
  msg.textContent = message;

  const actions = document.createElement('div');
  actions.className = 'confirm-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'confirm-btn cancel';
  cancelBtn.textContent = options?.cancelText ?? 'Cancelar';

  const confirmBtn = document.createElement('button');
  confirmBtn.type = 'button';
  confirmBtn.className = 'confirm-btn confirm';
  confirmBtn.textContent = options?.confirmText ?? 'Confirmar';

  actions.append(cancelBtn, confirmBtn);
  dialog.append(msg, actions);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);

  const cleanup = (result: boolean): void => {
    overlay.remove();
    document.removeEventListener('keydown', onKeyDown);
    resolve(result);
  };

  const onKeyDown = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') cleanup(false);
    if (e.key === 'Enter') cleanup(true);
  };

  cancelBtn.addEventListener('click', () => cleanup(false));
  confirmBtn.addEventListener('click', () => cleanup(true));
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) cleanup(false);
  });
  document.addEventListener('keydown', onKeyDown);
});
