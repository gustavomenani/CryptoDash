import { EncryptionService } from '../../utils/encryption';
import type { EncryptedData, PortfolioItem } from '../../types/index';

describe('EncryptionService', () => {
  let service: EncryptionService;

  beforeEach(() => {
    localStorage.clear();
    // @ts-ignore - Reset singleton
    EncryptionService.instance = undefined;
    service = EncryptionService.getInstance();
    service.initialize();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    it('should generate encryption key on first run', () => {
      const key = localStorage.getItem('cd_master_key');
      expect(key).toBeTruthy();
      expect(key?.length).toBeGreaterThan(10);
    });

    it('should reuse existing key', () => {
      const firstKey = localStorage.getItem('cd_master_key');
      
      // @ts-ignore - Reset singleton
      EncryptionService.instance = undefined;
      const newService = EncryptionService.getInstance();
      newService.initialize();
      
      const secondKey = localStorage.getItem('cd_master_key');
      expect(secondKey).toBe(firstKey);
    });
  });

  describe('encryption/decryption', () => {
    it('should encrypt and decrypt portfolio data correctly', () => {
      const data: PortfolioItem[] = [
        { coin: 'bitcoin', amount: 1.5, buyPrice: 45000 },
        { coin: 'ethereum', amount: 10, buyPrice: 3000 },
      ];

      const encrypted = service.encrypt(data);
      expect(encrypted.encrypted).toBeTruthy();
      expect(encrypted.iv).toBeTruthy();
      expect(encrypted.salt).toBeTruthy();

      const decrypted = service.decrypt<PortfolioItem[]>(encrypted);
      expect(decrypted).toEqual(data);
    });

    it('should produce different ciphertexts for same data (due to random IV/salt)', () => {
      const data = { test: 'value' };
      
      const encrypted1 = service.encrypt(data);
      const encrypted2 = service.encrypt(data);
      
      expect(encrypted1.encrypted).not.toBe(encrypted2.encrypted);
      expect(encrypted1.iv).not.toBe(encrypted2.iv);
      expect(encrypted1.salt).not.toBe(encrypted2.salt);
    });

    it('should return null when decrypting corrupted data', () => {
      const corruptedData: EncryptedData = {
        encrypted: 'invalid-base64!!!',
        iv: 'invalid-iv',
        salt: 'invalid-salt',
      };

      const result = service.decrypt<unknown>(corruptedData);
      expect(result).toBeNull();
    });

    it('should handle complex nested objects', () => {
      const complexData = {
        nested: {
          array: [1, 2, 3],
          object: { a: 'b', c: 123 },
        },
        date: new Date('2024-01-01').toISOString(),
        nullValue: null,
        number: 123.456,
      };

      const encrypted = service.encrypt(complexData);
      const decrypted = service.decrypt<typeof complexData>(encrypted);
      
      expect(decrypted).toEqual(complexData);
    });
  });

  describe('key rotation', () => {
    it('should generate new key after rotation', () => {
      const oldKey = localStorage.getItem('cd_master_key');
      
      service.rotateKey();
      
      const newKey = localStorage.getItem('cd_master_key');
      expect(newKey).not.toBe(oldKey);
    });

    it('should clear all data on clear()', () => {
      service.clear();
      
      const key = localStorage.getItem('cd_master_key');
      expect(key).toBeNull();
    });
  });

  describe('browser fingerprint', () => {
    it('should generate consistent fingerprint', () => {
      // @ts-ignore - Access private method
      const fp1 = service.getBrowserFingerprint();
      // @ts-ignore
      const fp2 = service.getBrowserFingerprint();
      
      expect(fp1).toBe(fp2);
      expect(fp1.length).toBe(64); // SHA-256 hex length
    });
  });
});
