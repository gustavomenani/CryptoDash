// ============================================
// CryptoDash - Internationalization (i18n)
// ============================================

import { ptBR } from './translations/pt-BR';
import { en } from './translations/en';
import { es } from './translations/es';
import type { TranslationKeys, Locale } from '../types/index';

type Translations = Record<Locale, TranslationKeys>;

const translations: Translations = {
  'pt-BR': ptBR,
  'en': en,
  'es': es,
};

export class I18n {
  private static instance: I18n;
  private currentLocale: Locale = 'pt-BR';
  private readonly STORAGE_KEY = 'cd_locale';

  private constructor() {
    this.loadLocale();
  }

  static getInstance(): I18n {
    if (!I18n.instance) {
      I18n.instance = new I18n();
    }
    return I18n.instance;
  }

  /**
   * Carrega idioma salvo ou detecta do navegador
   */
  private loadLocale(): void {
    const saved = localStorage.getItem(this.STORAGE_KEY) as Locale | null;
    
    if (saved && this.isValidLocale(saved)) {
      this.currentLocale = saved;
    } else {
      // Detecta do navegador
      const browserLang = navigator.language;
      if (browserLang.startsWith('pt')) {
        this.currentLocale = 'pt-BR';
      } else if (browserLang.startsWith('es')) {
        this.currentLocale = 'es';
      } else {
        this.currentLocale = 'en';
      }
      this.saveLocale();
    }
  }

  /**
   * Verifica se locale é válido
   */
  private isValidLocale(locale: string): locale is Locale {
    return ['pt-BR', 'en', 'es'].includes(locale);
  }

  /**
   * Salva locale
   */
  private saveLocale(): void {
    localStorage.setItem(this.STORAGE_KEY, this.currentLocale);
  }

  /**
   * Muda o idioma
   */
  setLocale(locale: Locale): void {
    if (this.isValidLocale(locale)) {
      this.currentLocale = locale;
      this.saveLocale();
      this.updateDOM();
      window.dispatchEvent(new CustomEvent('localechange', { detail: locale }));
    }
  }

  /**
   * Retorna tradução
   */
  t(key: keyof TranslationKeys): string {
    const translation = translations[this.currentLocale][key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      // Fallback para inglês
      return translations['en'][key] || key;
    }
    return translation;
  }

  /**
   * Traduz com interpolação de valores
   */
  tReplace(key: keyof TranslationKeys, values: Record<string, string | number>): string {
    let text = this.t(key);
    
    Object.entries(values).forEach(([k, v]) => {
      text = text.replace(new RegExp(`{{${k}}}`, 'g'), String(v));
    });
    
    return text;
  }

  /**
   * Retorna locale atual
   */
  getLocale(): Locale {
    return this.currentLocale;
  }

  /**
   * Retorna lista de locales disponíveis
   */
  getAvailableLocales(): { code: Locale; name: string; flag: string }[] {
    return [
      { code: 'pt-BR', name: 'Português', flag: '🇧🇷' },
      { code: 'en', name: 'English', flag: '🇺🇸' },
      { code: 'es', name: 'Español', flag: '🇪🇸' },
    ];
  }

  /**
   * Formata número de acordo com locale
   */
  formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    const localeMap: Record<Locale, string> = {
      'pt-BR': 'pt-BR',
      'en': 'en-US',
      'es': 'es-ES',
    };
    
    return new Intl.NumberFormat(localeMap[this.currentLocale], options).format(num);
  }

  /**
   * Formata data relativa
   */
  formatRelativeTime(date: Date): string {
    const diff = (Date.now() - date.getTime()) / 1000;
    
    const rtf = new Intl.RelativeTimeFormat(this.currentLocale, { numeric: 'auto' });
    
    if (diff < 60) return rtf.format(-Math.floor(diff), 'second');
    if (diff < 3600) return rtf.format(-Math.floor(diff / 60), 'minute');
    if (diff < 86400) return rtf.format(-Math.floor(diff / 3600), 'hour');
    return rtf.format(-Math.floor(diff / 86400), 'day');
  }

  /**
   * Atualiza elementos com atributo data-i18n
   */
  updateDOM(): void {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n') as keyof TranslationKeys;
      if (key) {
        const translation = this.t(key);
        if (el.hasAttribute('placeholder')) {
          el.setAttribute('placeholder', translation);
        } else {
          el.textContent = translation;
        }
      }
    });
  }
}

// Export singleton
export const i18n = I18n.getInstance();

// Helper para templates
export const t = (key: keyof TranslationKeys) => i18n.t(key);
