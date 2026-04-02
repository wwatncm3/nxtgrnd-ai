// Storage Service - Unified storage layer with DynamoDB sync
// Uses localStorage for fast access, DynamoDB for persistence

import * as dynamoService from './dynamoService';
import { getCurrentStorageUserId, setCurrentStorageUserId } from '../utils/authUtils';

// Storage keys mapping
const STORAGE_KEYS = {
  USER_PREFERENCES: 'pathPreferences',
  CAREER_PATH: 'careerPath',
  USER_RESUME: 'resume',
  USER_DASHBOARD: 'dashboard',
  USER_SKILLS: 'skills',
  USER_INTERESTS: 'interests',
  USER_PROFILE: 'profile',
  ACHIEVEMENTS: 'achievements',
  NOTIFICATIONS: 'notifications',
  CREATOR_PROFILE: 'creatorProfile',
  COURSE_PROGRESS: 'courseProgress',
  COMPLETED_TASKS: 'completedTasks',
  COMPASS_CACHE: 'compassRecs',
  ANALYSIS_CACHE: 'analysisCache',
  LAST_SYNC: 'lastDynamoSync'
};

// Generate user-scoped key
const getUserKey = (baseKey, userId = null) => {
  const uid = userId || getCurrentStorageUserId();
  if (!uid) return null;
  return `${uid}_${baseKey}`;
};

// Local storage operations
const localStore = {
  set: (baseKey, data, userId = null) => {
    const key = getUserKey(baseKey, userId);
    if (!key) return false;
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      return true;
    } catch (error) {
      console.error(`Failed to store ${key}:`, error);
      // Detect quota exceeded and warn the user
      if (error?.name === 'QuotaExceededError' || error?.code === 22 || error?.code === 1014) {
        console.error('STORAGE WARNING: localStorage quota exceeded. Data may be lost.');
        // Dispatch a custom event so UI components can show a warning
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('storage-quota-exceeded', {
            detail: { key, error: 'Local storage is full. Some data may not be saved. Please clear unused data or contact support.' }
          }));
        }
      }
      return false;
    }
  },

  get: (baseKey, userId = null) => {
    const key = getUserKey(baseKey, userId);
    if (!key) return null;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;
      try {
        return JSON.parse(stored);
      } catch {
        return stored;
      }
    } catch (error) {
      console.error(`Failed to retrieve ${key}:`, error);
      return null;
    }
  },

  remove: (baseKey, userId = null) => {
    const key = getUserKey(baseKey, userId);
    if (!key) return false;
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }
};

// Debounce sync to DynamoDB to avoid excessive writes
let syncTimeout = null;
const SYNC_DELAY = 2000; // 2 seconds debounce

const debouncedSync = (userId) => {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncToDynamoDB(userId);
  }, SYNC_DELAY);
};

// Force immediate sync — call before logout to prevent data loss
export const flushPendingSync = async (userId = null) => {
  const uid = userId || getCurrentStorageUserId();
  if (syncTimeout) {
    clearTimeout(syncTimeout);
    syncTimeout = null;
  }
  if (uid) {
    await syncToDynamoDB(uid);
  }
};

// Sync local data to DynamoDB
const syncToDynamoDB = async (userId) => {
  if (!userId) {
    userId = getCurrentStorageUserId();
    if (!userId) return;
  }

  console.log('RELOADING: Syncing to DynamoDB...');

  try {
    // Gather all local data
    const localData = {
      resume: localStore.get(STORAGE_KEYS.USER_RESUME, userId),
      skills: localStore.get(STORAGE_KEYS.USER_SKILLS, userId),
      interests: localStore.get(STORAGE_KEYS.USER_INTERESTS, userId),
      creatorProfile: localStore.get(STORAGE_KEYS.CREATOR_PROFILE, userId),
      careerPath: localStore.get(STORAGE_KEYS.CAREER_PATH, userId),
      dashboard: localStore.get(STORAGE_KEYS.USER_DASHBOARD, userId),
      pathPreferences: localStore.get(STORAGE_KEYS.USER_PREFERENCES, userId),
      notifications: localStore.get(STORAGE_KEYS.NOTIFICATIONS, userId),
      achievements: localStore.get(STORAGE_KEYS.ACHIEVEMENTS, userId),
      courseProgress: localStore.get(STORAGE_KEYS.COURSE_PROGRESS, userId),
      completedTasks: localStore.get(STORAGE_KEYS.COMPLETED_TASKS, userId)
    };

    await dynamoService.syncLocalToDynamo(userId, localData);

    // Update last sync timestamp
    localStore.set(STORAGE_KEYS.LAST_SYNC, new Date().toISOString(), userId);
    console.log('SUCCESS: Sync to DynamoDB complete');
  } catch (error) {
    console.error('ERROR: Sync to DynamoDB failed:', error);
  }
};

// Load data from DynamoDB to localStorage
const loadFromDynamoDB = async (userId) => {
  if (!userId) return null;

  console.log('📥 Loading data from DynamoDB...');

  try {
    const dynamoData = await dynamoService.loadAllUserData(userId);

    if (!dynamoData.hasData) {
      console.log('INFO: No data found in DynamoDB');
      return null;
    }

    // Restore profile data to localStorage
    if (dynamoData.profile) {
      if (dynamoData.profile.resume) {
        localStore.set(STORAGE_KEYS.USER_RESUME, dynamoData.profile.resume, userId);
      }
      if (dynamoData.profile.skills) {
        localStore.set(STORAGE_KEYS.USER_SKILLS, dynamoData.profile.skills, userId);
      }
      if (dynamoData.profile.interests) {
        localStore.set(STORAGE_KEYS.USER_INTERESTS, dynamoData.profile.interests, userId);
      }
      if (dynamoData.profile.creatorProfile) {
        localStore.set(STORAGE_KEYS.CREATOR_PROFILE, dynamoData.profile.creatorProfile, userId);
      }
    }

    // Restore dashboard data to localStorage
    if (dynamoData.dashboard) {
      if (dynamoData.dashboard.careerPath) {
        localStore.set(STORAGE_KEYS.CAREER_PATH, dynamoData.dashboard.careerPath, userId);
      }
      localStore.set(STORAGE_KEYS.USER_DASHBOARD, dynamoData.dashboard, userId);
    }

    // Restore preferences to localStorage
    if (dynamoData.preferences) {
      if (dynamoData.preferences.pathPreferences) {
        localStore.set(STORAGE_KEYS.USER_PREFERENCES, dynamoData.preferences.pathPreferences, userId);
      }
      if (dynamoData.preferences.notifications) {
        localStore.set(STORAGE_KEYS.NOTIFICATIONS, dynamoData.preferences.notifications, userId);
      }
      if (dynamoData.preferences.achievements) {
        localStore.set(STORAGE_KEYS.ACHIEVEMENTS, dynamoData.preferences.achievements, userId);
      }
    }

    console.log('SUCCESS: Data loaded from DynamoDB to localStorage');
    return dynamoData;
  } catch (error) {
    console.error('ERROR: Failed to load from DynamoDB:', error);
    return null;
  }
};

// Main storage API with automatic DynamoDB sync
export const storageService = {
  // Set item (saves to localStorage + queues DynamoDB sync)
  setItem: (baseKey, data, userId = null) => {
    const uid = userId || getCurrentStorageUserId();
    const success = localStore.set(baseKey, data, uid);
    if (success && uid) {
      debouncedSync(uid);
    }
    return success;
  },

  // Get item (from localStorage, falls back to waiting for DynamoDB)
  getItem: (baseKey, userId = null) => {
    return localStore.get(baseKey, userId);
  },

  // Remove item
  removeItem: (baseKey, userId = null) => {
    const uid = userId || getCurrentStorageUserId();
    const success = localStore.remove(baseKey, uid);
    if (success && uid) {
      debouncedSync(uid);
    }
    return success;
  },

  // Force immediate sync to DynamoDB
  forceSync: async (userId = null) => {
    const uid = userId || getCurrentStorageUserId();
    if (syncTimeout) clearTimeout(syncTimeout);
    await syncToDynamoDB(uid);
  },

  // Load all data from DynamoDB (call on login)
  loadFromCloud: async (userId) => {
    return loadFromDynamoDB(userId);
  },

  // Check user data exists
  checkUserData: (userId) => {
    return {
      preferences: !!localStore.get(STORAGE_KEYS.USER_PREFERENCES, userId),
      careerPath: !!localStore.get(STORAGE_KEYS.CAREER_PATH, userId),
      resume: !!localStore.get(STORAGE_KEYS.USER_RESUME, userId),
      dashboard: !!localStore.get(STORAGE_KEYS.USER_DASHBOARD, userId)
    };
  },

  // Clear all user data (localStorage only - DynamoDB persists)
  clearLocalData: (userId) => {
    if (!userId) return false;
    Object.values(STORAGE_KEYS).forEach(baseKey => {
      localStore.remove(baseKey, userId);
    });
    return true;
  },

  // Clear all data including DynamoDB
  clearAllData: async (userId) => {
    if (!userId) return false;
    storageService.clearLocalData(userId);
    await dynamoService.deleteAllUserData(userId);
    return true;
  },

  // Get last sync timestamp
  getLastSync: (userId = null) => {
    return localStore.get(STORAGE_KEYS.LAST_SYNC, userId);
  }
};

// User state utilities (compatible with existing authUtils)
export const userStateService = {
  getUserState: async (userId) => {
    if (!userId) {
      return {
        preferences: null,
        careerPath: null,
        resume: null,
        dashboard: null,
        completionLevel: 0
      };
    }

    // Set current user
    setCurrentStorageUserId(userId);

    // First check localStorage
    let preferences = localStore.get(STORAGE_KEYS.USER_PREFERENCES, userId);
    let careerPath = localStore.get(STORAGE_KEYS.CAREER_PATH, userId);
    let resume = localStore.get(STORAGE_KEYS.USER_RESUME, userId);
    let dashboard = localStore.get(STORAGE_KEYS.USER_DASHBOARD, userId);

    // If localStorage is empty, try loading from DynamoDB
    if (!preferences && !careerPath && !resume && !dashboard) {
      console.log('📥 No local data, checking DynamoDB...');
      const dynamoData = await loadFromDynamoDB(userId);

      if (dynamoData?.hasData) {
        // Re-read from localStorage after DynamoDB load
        preferences = localStore.get(STORAGE_KEYS.USER_PREFERENCES, userId);
        careerPath = localStore.get(STORAGE_KEYS.CAREER_PATH, userId);
        resume = localStore.get(STORAGE_KEYS.USER_RESUME, userId);
        dashboard = localStore.get(STORAGE_KEYS.USER_DASHBOARD, userId);
      }
    }

    // Calculate completion level
    let completionLevel = 0;
    if (preferences) completionLevel = 1;
    if (resume) completionLevel = 2;
    if (careerPath) completionLevel = 3;
    if (dashboard) completionLevel = 4;

    console.log(`STATS: User state for ${userId}:`, {
      hasPreferences: !!preferences,
      hasCareerPath: !!careerPath,
      hasResume: !!resume,
      hasDashboard: !!dashboard,
      completionLevel
    });

    return {
      preferences,
      careerPath,
      resume,
      dashboard,
      completionLevel
    };
  }
};

// Export storage keys for compatibility
export { STORAGE_KEYS };

export default storageService;
