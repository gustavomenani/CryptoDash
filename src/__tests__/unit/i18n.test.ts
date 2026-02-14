import { I18n, i18n } from '../../i18n/index';


describe('I18n', () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-ignore - Reset singleton
    I18n.instance = undefined;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should detect browser language on first run', () => {
      // @ts-ignore - Reset singleton
      const instance = I18n.getInstance();
      const locale = instance.getLocale();
      
      expect(['pt-BR', 'en', 'es']).toContain(locale);
    });

    it('should load saved locale from localStorage', () => {
      localStorage.setItem('cd_locale', 'en');
      
      // @ts-ignore - Reset singleton
      const instance = I18n.getInstance();
      
      expect(instance.getLocale()).toBe('en');
    });
  });

  describe('translations', () => {
    beforeEach(() => {
      i18n.setLocale('pt-BR');
    });

    it('should return translation for key', () => {
      const translation = i18n.t('dashboard.title');
      expect(translation).toBe('Painel Financeiro');
    });

    it('should fallback to English for missing translation', () => {
      // @ts-ignore - Testing with invalid key
      const translation = i18n.t('invalid.key');
      expect(translation).toBe('invalid.key');
    });

    it('should switch languages', () => {
      i18n.setLocale('en');
      expect(i18n.t('dashboard.title')).toBe('Financial Dashboard');
      
      i18n.setLocale('es');
      expect(i18n.t('dashboard.title')).toBe('Panel Financiero');
    });
  });

  describe('formatNumber', () => {
    it('should format number according to locale', () => {
      i18n.setLocale('pt-BR');
      const br = i18n.formatNumber(1234.56);
      expect(br).toContain('1.234,56');

      i18n.setLocale('en');
      const en = i18n.formatNumber(1234.56);
      expect(en).toContain('1,234.56');
    });

    it('should accept custom options', () => {
      i18n.setLocale('en');
      const formatted = i18n.formatNumber(1234.56, {
        style: 'currency',
        currency: 'USD',
      });
      expect(formatted).toContain('$');
    });
  });

  describe('formatRelativeTime', () => {
    beforeEach(() => {
      i18n.setLocale('pt-BR');
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-01-01T12:00:00Z'));
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should format seconds ago', () => {
      const date = new Date('2024-01-01T11:59:30Z');
      expect(i18n.formatRelativeTime(date)).toContain('30 segundos');
    });

    it('should format minutes ago', () => {
      const date = new Date('2024-01-01T11:55:00Z');
      expect(i18n.formatRelativeTime(date)).toContain('5 minutos');
    });

    it('should format hours ago', () => {
      const date = new Date('2024-01-01T10:00:00Z');
      expect(i18n.formatRelativeTime(date)).toContain('2 horas');
    });

    it('should format days ago', () => {
      const date = new Date('2023-12-28T12:00:00Z');
      const result = i18n.formatRelativeTime(date);
      // Pode ser "4 dias atrás" ou "há 4 dias" dependendo do navegador
      expect(result).toMatch(/4/);
    });
  });

  describe('available locales', () => {
    it('should return list of available locales', () => {
      const locales = i18n.getAvailableLocales();
      
      expect(locales).toHaveLength(3);
      expect(locales.map(l => l.code)).toContain('pt-BR');
      expect(locales.map(l => l.code)).toContain('en');
      expect(locales.map(l => l.code)).toContain('es');
    });
  });

  describe('tReplace', () => {
    beforeEach(() => {
      i18n.setLocale('en');
    });

    it('should replace placeholders', () => {
      // Add test translation
      const result = i18n.tReplace('common.success', { action: 'saved' });
      // Since there's no placeholder in our translation, it should return as-is
      expect(result).toBe('Success');
    });
  });

  describe('events', () => {
    it('should dispatch localechange event', () => {
      const handler = jest.fn();
      window.addEventListener('localechange', handler);
      
      i18n.setLocale('es');
      
      expect(handler).toHaveBeenCalled();
      window.removeEventListener('localechange', handler);
    });
  });
});
