import { STORAGE_KEYS } from './storageService';
import storageService from './storageService';

// Mock dynamoService to prevent actual DynamoDB calls
jest.mock('./dynamoService', () => ({
  syncLocalToDynamo: jest.fn().mockResolvedValue(true),
  loadAllUserData: jest.fn().mockResolvedValue({ hasData: false }),
  deleteAllUserData: jest.fn().mockResolvedValue(true)
}));

// Mock authUtils
jest.mock('../utils/authUtils', () => ({
  getCurrentStorageUserId: jest.fn(() => null),
  setCurrentStorageUserId: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn(i => Object.keys(store)[i] || null)
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('storageService', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  describe('STORAGE_KEYS', () => {
    it('should have all required keys defined', () => {
      expect(STORAGE_KEYS.USER_RESUME).toBeDefined();
      expect(STORAGE_KEYS.USER_SKILLS).toBeDefined();
      expect(STORAGE_KEYS.USER_INTERESTS).toBeDefined();
      expect(STORAGE_KEYS.CAREER_PATH).toBeDefined();
      expect(STORAGE_KEYS.USER_DASHBOARD).toBeDefined();
    });
  });

  describe('storageService.setItem', () => {
    it('should not crash on null userId when no current user set', () => {
      expect(() => {
        storageService.setItem('testKey', { test: true }, null);
      }).not.toThrow();
    });

    it('should save data with explicit userId', () => {
      storageService.setItem('testKey', { test: true }, 'user-123');
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('storageService.getItem', () => {
    it('should return null for missing data', () => {
      const result = storageService.getItem('nonexistent', 'testUser');
      expect(result).toBeNull();
    });
  });

  describe('localStorage quota handling', () => {
    it('should not crash when localStorage is full', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        const error = new DOMException('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });
      expect(() => {
        storageService.setItem('testKey', { large: 'data' }, 'testUser');
      }).not.toThrow();
    });
  });
});
