import { STORAGE_KEYS } from './storageService';
import storageService from './storageService';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = value; }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; }
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

  describe('storageService.saveData', () => {
    it('should save data without crashing on null userId', () => {
      expect(() => {
        storageService.saveData(null, 'testKey', { test: true });
      }).not.toThrow();
    });
  });

  describe('storageService.getData', () => {
    it('should return null for missing data', () => {
      const result = storageService.getData('nonexistent', 'testKey');
      expect(result).toBeNull();
    });
  });

  describe('localStorage quota handling', () => {
    it('should not crash when localStorage is full', () => {
      localStorageMock.setItem.mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError');
      });
      expect(() => {
        storageService.saveData('testUser', 'testKey', { large: 'data' });
      }).not.toThrow();
    });
  });
});
