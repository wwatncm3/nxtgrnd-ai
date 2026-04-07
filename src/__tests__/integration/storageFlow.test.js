// Integration Test: Storage Flow
// Tests data flow: storageService → localStorage → DynamoDB sync
import { storageService, STORAGE_KEYS, userStateService } from '../../services/storageService';

// Mock dynamoService
jest.mock('../../services/dynamoService', () => ({
  syncLocalToDynamo: jest.fn().mockResolvedValue({ success: true }),
  loadAllUserData: jest.fn().mockResolvedValue({ hasData: false }),
  deleteAllUserData: jest.fn().mockResolvedValue({ success: true })
}));

import * as dynamoService from '../../services/dynamoService';

// Mock authUtils
jest.mock('../../utils/authUtils', () => ({
  getCurrentStorageUserId: jest.fn(() => 'integration-user'),
  setCurrentStorageUserId: jest.fn()
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key] || null),
    setItem: jest.fn((key, value) => { store[key] = String(value); }),
    removeItem: jest.fn(key => { delete store[key]; }),
    clear: jest.fn(() => { store = {}; }),
    get length() { return Object.keys(store).length; },
    key: jest.fn(i => Object.keys(store)[i] || null)
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('Storage Flow Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should save data to localStorage and trigger DynamoDB sync', () => {
    const userId = 'integration-user';
    const testData = { title: 'Software Engineer', id: 'swe-1' };

    // Save via storageService
    storageService.setItem(STORAGE_KEYS.CAREER_PATH, testData, userId);

    // Verify localStorage was written
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const storedKey = localStorageMock.setItem.mock.calls[0][0];
    expect(storedKey).toContain(userId);
    expect(storedKey).toContain(STORAGE_KEYS.CAREER_PATH);

    // Advance past debounce (2 seconds)
    jest.advanceTimersByTime(2500);

    // Verify DynamoDB sync was triggered
    expect(dynamoService.syncLocalToDynamo).toHaveBeenCalledWith(
      userId,
      expect.any(Object)
    );
  });

  it('should write user-scoped keys to localStorage', () => {
    const userId = 'integration-user';
    const testData = { skills: ['React', 'Node.js'] };

    storageService.setItem(STORAGE_KEYS.USER_SKILLS, testData, userId);

    // Verify setItem was called with user-scoped key containing userId
    expect(localStorageMock.setItem).toHaveBeenCalled();
    const calledKey = localStorageMock.setItem.mock.calls[0][0];
    expect(calledKey).toContain(userId);
    expect(calledKey).toContain(STORAGE_KEYS.USER_SKILLS);

    // Verify data was serialized as JSON
    const calledValue = localStorageMock.setItem.mock.calls[0][1];
    expect(JSON.parse(calledValue)).toEqual(testData);
  });

  it('should remove data and trigger sync', () => {
    const userId = 'integration-user';
    storageService.setItem(STORAGE_KEYS.USER_RESUME, { text: 'resume' }, userId);
    storageService.removeItem(STORAGE_KEYS.USER_RESUME, userId);

    const retrieved = storageService.getItem(STORAGE_KEYS.USER_RESUME, userId);
    expect(retrieved).toBeNull();

    jest.advanceTimersByTime(2500);
    expect(dynamoService.syncLocalToDynamo).toHaveBeenCalled();
  });

  it('should scope data keys per user', () => {
    const user1 = 'user-alpha';
    const user2 = 'user-beta';

    storageService.setItem(STORAGE_KEYS.CAREER_PATH, { title: 'SWE' }, user1);
    storageService.setItem(STORAGE_KEYS.CAREER_PATH, { title: 'DS' }, user2);

    // Both writes should use different scoped keys
    const calls = localStorageMock.setItem.mock.calls;
    const keys = calls.map(c => c[0]);

    const user1Key = keys.find(k => k.includes(user1));
    const user2Key = keys.find(k => k.includes(user2));

    expect(user1Key).toBeTruthy();
    expect(user2Key).toBeTruthy();
    expect(user1Key).not.toBe(user2Key);
  });

  it('should clear all local data for a user', () => {
    const userId = 'integration-user';

    // Save multiple items
    storageService.setItem(STORAGE_KEYS.CAREER_PATH, { title: 'SWE' }, userId);
    storageService.setItem(STORAGE_KEYS.USER_RESUME, { text: 'resume' }, userId);
    storageService.setItem(STORAGE_KEYS.USER_SKILLS, ['React'], userId);

    // Clear all
    storageService.clearLocalData(userId);

    // All should be null
    expect(storageService.getItem(STORAGE_KEYS.CAREER_PATH, userId)).toBeNull();
    expect(storageService.getItem(STORAGE_KEYS.USER_RESUME, userId)).toBeNull();
    expect(storageService.getItem(STORAGE_KEYS.USER_SKILLS, userId)).toBeNull();
  });

  it('should debounce multiple rapid writes into a single sync', () => {
    const userId = 'integration-user';

    // Rapid-fire writes
    storageService.setItem(STORAGE_KEYS.CAREER_PATH, { title: 'SWE' }, userId);
    storageService.setItem(STORAGE_KEYS.USER_RESUME, { text: 'resume' }, userId);
    storageService.setItem(STORAGE_KEYS.USER_SKILLS, ['React'], userId);

    // Before debounce fires
    jest.advanceTimersByTime(1000);
    expect(dynamoService.syncLocalToDynamo).not.toHaveBeenCalled();

    // After debounce (2s)
    jest.advanceTimersByTime(1500);
    expect(dynamoService.syncLocalToDynamo).toHaveBeenCalledTimes(1);
  });
});

describe('UserState Service Integration', () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should return empty state for new user with no DynamoDB data', async () => {
    dynamoService.loadAllUserData.mockResolvedValueOnce({ hasData: false });

    const state = await userStateService.getUserState('new-user');

    expect(state.completionLevel).toBe(0);
    expect(state.preferences).toBeNull();
    expect(state.careerPath).toBeNull();
    expect(state.resume).toBeNull();
    expect(state.dashboard).toBeNull();
  });

  it('should calculate correct completion level', async () => {
    const userId = 'progress-user';

    // Set up progressive data
    localStorageMock.setItem(`${userId}_pathPreferences`, JSON.stringify({ type: 'tech' }));
    localStorageMock.setItem(`${userId}_resume`, JSON.stringify({ text: 'resume' }));
    localStorageMock.setItem(`${userId}_careerPath`, JSON.stringify({ title: 'SWE' }));

    // Mock getItem to return parsed data
    localStorageMock.getItem.mockImplementation(key => {
      const store = {};
      store[`${userId}_pathPreferences`] = JSON.stringify({ type: 'tech' });
      store[`${userId}_resume`] = JSON.stringify({ text: 'resume' });
      store[`${userId}_careerPath`] = JSON.stringify({ title: 'SWE' });
      return store[key] || null;
    });

    const state = await userStateService.getUserState(userId);
    expect(state.completionLevel).toBe(3); // preferences + resume + careerPath
  });
});
