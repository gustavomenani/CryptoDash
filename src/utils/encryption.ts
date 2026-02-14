// ============================================
// CryptoDash - Encryption Service
// Criptografa dados sensíveis no localStorage
// ============================================

import CryptoJS from 'crypto-js';
import type { EncryptedData } from '../types/index';

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string | null = null;
  private readonly STORAGE_KEY = 'cd_master_key';

  private constructor() {}

  static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  /**
   * Gera ou recupera a chave de criptografia
   * Usa uma combinação de fingerprint do navegador + chave derivada
   */
  initialize(): void {
    if (this.encryptionKey) return;

    // Tenta recuperar chave existente
    let key = localStorage.getItem(this.STORAGE_KEY);
    
    if (!key) {
      // Gera nova chave aleatória de 256 bits
      key = CryptoJS.lib.WordArray.random(32).toString();
      localStorage.setItem(this.STORAGE_KEY, key);
    }

    // Adiciona fingerprint do navegador para segurança adicional
    const fingerprint = this.getBrowserFingerprint();
    this.encryptionKey = CryptoJS.PBKDF2(key + fingerprint, fingerprint, {
      keySize: 256 / 32,
      iterations: 1000,
    }).toString();
  }

  /**
   * Gera fingerprint único do navegador
   */
  private getBrowserFingerprint(): string {
    const components = [
      navigator.userAgent,
      navigator.language,
      screen.colorDepth,
      screen.width + 'x' + screen.height,
      new Date().getTimezoneOffset(),
      navigator.hardwareConcurrency?.toString() || 'unknown',
    ];
    return CryptoJS.SHA256(components.join('|')).toString();
  }

  /**
   * Criptografa dados
   */
  encrypt(data: unknown): EncryptedData {
    this.ensureInitialized();
    
    const jsonString = JSON.stringify(data);
    const salt = CryptoJS.lib.WordArray.random(16).toString();
    const iv = CryptoJS.lib.WordArray.random(16).toString();
    
    // Deriva chave com salt
    const key = CryptoJS.PBKDF2(this.encryptionKey!, salt, {
      keySize: 256 / 32,
      iterations: 1000,
    });

    // Criptografa
    const encrypted = CryptoJS.AES.encrypt(jsonString, key.toString(), {
      iv: CryptoJS.enc.Hex.parse(iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    }).toString();

    return {
      encrypted,
      iv,
      salt,
    };
  }

  /**
   * Descriptografa dados
   */
  decrypt<T>(encryptedData: EncryptedData): T | null {
    this.ensureInitialized();

    try {
      // Deriva a mesma chave com o salt
      const key = CryptoJS.PBKDF2(this.encryptionKey!, encryptedData.salt, {
        keySize: 256 / 32,
        iterations: 1000,
      });

      // Descriptografa
      const decrypted = CryptoJS.AES.decrypt(encryptedData.encrypted, key.toString(), {
        iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const jsonString = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(jsonString) as T;
    } catch (error) {
      console.error('Decryption failed:', error);
      return null;
    }
  }

  /**
   * Verifica se está inicializado
   */
  private ensureInitialized(): void {
    if (!this.encryptionKey) {
      this.initialize();
    }
  }

  /**
   * Rotaciona a chave de criptografia
   * Útil para segurança periódica
   */
  rotateKey(): void {
    // Limpa chave atual
    localStorage.removeItem(this.STORAGE_KEY);
    this.encryptionKey = null;
    
    // Gera nova
    this.initialize();
  }

  /**
   * Limpa todas as chaves (logout/reset)
   */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
    this.encryptionKey = null;
  }
}

// Export singleton instance
export const encryptionService = EncryptionService.getInstance();
