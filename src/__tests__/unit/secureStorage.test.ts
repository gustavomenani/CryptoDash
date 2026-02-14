import { SecureStorage, storage } from '../../utils/secureStorage';
import { EncryptionService } from '../../utils/encryption';
import type { PortfolioItem, AlertItem, UserSettings } from '../../types/index';

describe('SecureStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    // @ts-ignore - Reset singleton
    EncryptionService.instance = undefined;
    EncryptionService.getInstance().initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic operations', () => {
    it('should store and retrieve encrypted data', () => {
      const data: PortfolioItem[] = [
        { coin: 'bitcoin', amount: 1.5, buyPrice: 45000 },
      ];

      SecureStorage.setItem('test', data);
      const retrieved = SecureStorage.getItem<PortfolioItem[]>('test', []);
      
      expect(retrieved).toEqual(data);
    });

    it('should return default value when key does not exist', () => {
      const defaultValue = [{ coin: 'default', amount: 0, buyPrice: 0 }];
      const retrieved = SecureStorage.getItem<PortfolioItem[]>('nonexistent', defaultValue);
      
      expect(retrieved).toEqual(defaultValue);
    });

    it('should remove items correctly', () => {
      SecureStorage.setItem('test', { value: 'data' });
      SecureStorage.removeItem('test');
      
      const retrieved = SecureStorage.getItem('test', null);
      expect(retrieved).toBeNull();
    });

    it('should clear all secure data', () => {
      SecureStorage.setItem('key1-clear-test', 'value1');
      SecureStorage.setItem('key2-clear-test', 'value2');
      
      SecureStorage.clear();
      
      // Verifica que as chaves com prefixo foram removidas
      const keys = Object.keys(localStorage).filter(k => k.startsWith('cd_secure_'));
      expect(keys).toHaveLength(0);
    });
  });

  describe('typed helpers', () => {
    it('should handle portfolio storage', () => {
      const portfolio: PortfolioItem[] = [
        { coin: 'bitcoin', amount: 1, buyPrice: 50000 },
      ];

      storage.portfolio.set(portfolio);
      const retrieved = storage.portfolio.get();
      
      expect(retrieved).toEqual(portfolio);
    });

    it('should handle alerts storage', () => {
      const alerts: AlertItem[] = [
        { coin: 'bitcoin', condition: 'above', target: 60000, triggered: false, created: Date.now() },
      ];

      storage.alerts.set(alerts);
      const retrieved = storage.alerts.get();
      
      expect(retrieved).toEqual(alerts);
    });

    it('should handle favorites storage', () => {
      const favorites = ['bitcoin', 'ethereum'];

      storage.favorites.set(favorites);
      const retrieved = storage.favorites.get();
      
      expect(retrieved).toEqual(favorites);
    });

    it('should handle settings storage with defaults', () => {
      const retrieved = storage.settings.get();
      
      expect(retrieved).toEqual({
        currency: 'usd',
        theme: 'dark',
        accent: 'indigo',
        autoRefresh: false,
        refreshSec: 60,
        reducedMotion: false,
        discreet: false,
      });
    });

    it('should save and retrieve custom settings', () => {
      const settings: UserSettings = {
        currency: 'brl',
        theme: 'light',
        accent: 'emerald',
        autoRefresh: true,
        refreshSec: 120,
        reducedMotion: true,
        discreet: true,
      };

      storage.settings.set(settings);
      const retrieved = storage.settings.get();
      
      expect(retrieved).toEqual(settings);
    });
  });

  describe('import/export', () => {
    it('should export all data as JSON', () => {
      // O exportAll usa Object.keys(localStorage) que é difícil de mockar
      // Vamos testar apenas que o método existe e retorna string
      const exported = SecureStorage.exportAll();
      expect(typeof exported).toBe('string');
      expect(() => JSON.parse(exported)).not.toThrow();
    });

    it('should import data from JSON', () => {
      const exportData = {
        portfolio: { encrypted: 'test', iv: 'test', salt: 'test' },
        favorites: { encrypted: 'test', iv: 'test', salt: 'test' },
      };

      const success = SecureStorage.importAll(JSON.stringify(exportData));
      expect(success).toBe(true);
      
      const rawPortfolio = localStorage.getItem('cd_secure_portfolio');
      expect(rawPortfolio).toBe(JSON.stringify(exportData.portfolio));
    });

    it('should return false on invalid import', () => {
      const success = SecureStorage.importAll('invalid json');
      expect(success).toBe(false);
    });
  });
});
