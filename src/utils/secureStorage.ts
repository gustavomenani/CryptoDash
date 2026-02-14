// ============================================
// CryptoDash - Secure Storage
// Wrapper criptografado para localStorage
// ============================================

import { encryptionService } from './encryption';
import type { EncryptedData, PortfolioItem, AlertItem, UserSettings } from '../types/index';

export class SecureStorage {
  private static readonly PREFIX = 'cd_secure_';

  /**
   * Salva dados criptografados
   */
  static setItem<T>(key: string, value: T): void {
    try {
      const encrypted = encryptionService.encrypt(value);
      localStorage.setItem(
        this.PREFIX + key,
        JSON.stringify(encrypted)
      );
    } catch (error) {
      console.error(`Failed to securely store ${key}:`, error);
    }
  }

  /**
   * Recupera dados descriptografados
   */
  static getItem<T>(key: string, defaultValue: T): T {
    try {
      const stored = localStorage.getItem(this.PREFIX + key);
      if (!stored) return defaultValue;

      const encrypted: EncryptedData = JSON.parse(stored);
      const decrypted = encryptionService.decrypt<T>(encrypted);
      
      return decrypted !== null ? decrypted : defaultValue;
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Remove item
   */
  static removeItem(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  /**
   * Limpa todos os dados seguros
   */
  static clear(): void {
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.PREFIX))
      .forEach(key => localStorage.removeItem(key));
  }

  /**
   * Exporta todos os dados para backup
   */
  static exportAll(): string {
    const data: Record<string, unknown> = {};
    
    Object.keys(localStorage)
      .filter(key => key.startsWith(this.PREFIX))
      .forEach(key => {
        const shortKey = key.replace(this.PREFIX, '');
        try {
          data[shortKey] = JSON.parse(localStorage.getItem(key)!);
        } catch {
          data[shortKey] = localStorage.getItem(key);
        }
      });

    return JSON.stringify(data, null, 2);
  }

  /**
   * Importa dados de backup
   */
  static importAll(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      
      Object.entries(data).forEach(([key, value]) => {
        localStorage.setItem(
          this.PREFIX + key,
          typeof value === 'string' ? value : JSON.stringify(value)
        );
      });

      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }
}

// ============================================
// Typed Helpers para dados específicos
// ============================================

export const storage = {
  portfolio: {
    get: (): PortfolioItem[] => SecureStorage.getItem<PortfolioItem[]>('portfolio', []),
    set: (value: PortfolioItem[]) => SecureStorage.setItem('portfolio', value),
    remove: () => SecureStorage.removeItem('portfolio'),
  },
  
  alerts: {
    get: (): AlertItem[] => SecureStorage.getItem<AlertItem[]>('alerts', []),
    set: (value: AlertItem[]) => SecureStorage.setItem('alerts', value),
    remove: () => SecureStorage.removeItem('alerts'),
  },
  
  favorites: {
    get: (): string[] => SecureStorage.getItem<string[]>('favorites', []),
    set: (value: string[]) => SecureStorage.setItem('favorites', value),
    remove: () => SecureStorage.removeItem('favorites'),
  },
  
  settings: {
    get: (): UserSettings => SecureStorage.getItem<UserSettings>('settings', {
      currency: 'usd',
      theme: 'dark',
      accent: 'indigo',
      autoRefresh: false,
      refreshSec: 60,
      reducedMotion: false,
      discreet: false,
    }),
    set: (value: UserSettings) => SecureStorage.setItem('settings', value),
    remove: () => SecureStorage.removeItem('settings'),
  },

  clear: () => SecureStorage.clear(),
};
