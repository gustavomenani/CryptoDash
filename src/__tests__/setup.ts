// ============================================
// Jest Setup
// ============================================

import 'jest';

// Mock localStorage
type Store = Record<string, string>;

const localStorageMock = (() => {
  let store: Store = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn((index: number) => Object.keys(store)[index] || null),
    get length() { return Object.keys(store).length; },
    [Symbol.iterator]: function* () {
      for (const key of Object.keys(store)) {
        yield key;
      }
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock crypto
(global as { crypto?: unknown }).crypto = {
  randomUUID: jest.fn(() => 'test-uuid-123'),
  getRandomValues: jest.fn((arr) => arr),
  subtle: {} as SubtleCrypto,
} as unknown as Crypto;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock navigator
Object.defineProperty(window, 'navigator', {
  value: {
    language: 'pt-BR',
    userAgent: 'jest-test',
    hardwareConcurrency: 4,
  },
  writable: true,
});

// Mock window.CustomEvent
(window as { CustomEvent?: unknown }).CustomEvent = class CustomEvent<T> extends Event {
  detail: T;
  constructor(type: string, options?: { detail?: T }) {
    super(type);
    this.detail = options?.detail as T;
  }
} as unknown as typeof window.CustomEvent;

// Mock fetch
global.fetch = jest.fn();

// Console silencing for cleaner test output
global.console = {
  ...console,
  warn: jest.fn(),
  error: jest.fn(),
};
