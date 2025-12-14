// src/utils/authUtils.js
// User-scoped storage utilities to prevent data bleed between accounts

// Current user ID stored in memory and localStorage
let currentUserId = null;
const CURRENT_USER_KEY = '_currentUserId';

// Get current user ID from memory or localStorage
export const getCurrentStorageUserId = () => {
  if (currentUserId) return currentUserId;
  try {
    currentUserId = localStorage.getItem(CURRENT_USER_KEY);
    return currentUserId;
  } catch {
    return null;
  }
};

// Set current user ID (called on login)
export const setCurrentStorageUserId = (userId) => {
  currentUserId = userId;
  if (userId) {
    localStorage.setItem(CURRENT_USER_KEY, userId);
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
};

// Generate user-scoped storage key
const getUserKey = (baseKey, userId = null) => {
  const uid = userId || getCurrentStorageUserId();
  if (!uid) {
    console.warn(`⚠️ No user ID available for key: ${baseKey}`);
    return null;
  }
  return `${uid}_${baseKey}`;
};

// Storage key definitions (base names - will be prefixed with userId)
export const STORAGE_KEYS = {
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
  ANALYSIS_CACHE: 'analysisCache'
};

// User-scoped Storage Utilities
export const storageUtils = {
  // Set item with user-scoped key
  setItem: (baseKey, data, userId = null) => {
    const key = getUserKey(baseKey, userId);
    if (!key) {
      console.error(`❌ Cannot store ${baseKey}: No user ID`);
      return false;
    }
    try {
      localStorage.setItem(key, typeof data === 'string' ? data : JSON.stringify(data));
      console.log(`💾 Stored ${key} in localStorage`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store ${key}:`, error);
      return false;
    }
  },

  // Get item with user-scoped key
  getItem: (baseKey, userId = null) => {
    const key = getUserKey(baseKey, userId);
    if (!key) {
      return null;
    }
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          console.log(`📖 Retrieved ${key} from localStorage`);
          return parsed;
        } catch {
          // Return as string if not valid JSON
          return stored;
        }
      }
      return null;
    } catch (error) {
      console.error(`❌ Failed to retrieve ${key}:`, error);
      return null;
    }
  },

  // Remove item with user-scoped key
  removeItem: (baseKey, userId = null) => {
    const key = getUserKey(baseKey, userId);
    if (!key) {
      return false;
    }
    try {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed ${key} from localStorage`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove ${key}:`, error);
      return false;
    }
  },

  // Check what user data exists
  checkUserData: (userId) => {
    return {
      preferences: !!storageUtils.getItem(STORAGE_KEYS.USER_PREFERENCES, userId),
      careerPath: !!storageUtils.getItem(STORAGE_KEYS.CAREER_PATH, userId),
      resume: !!storageUtils.getItem(STORAGE_KEYS.USER_RESUME, userId),
      dashboard: !!storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD, userId)
    };
  },

  // Clear ALL data for a specific user
  clearUserData: (userId) => {
    if (!userId) {
      console.error('❌ Cannot clear user data: No user ID provided');
      return false;
    }

    console.log(`🧹 Clearing all data for user: ${userId}`);

    Object.values(STORAGE_KEYS).forEach(baseKey => {
      const key = `${userId}_${baseKey}`;
      try {
        localStorage.removeItem(key);
      } catch (e) {
        console.error(`Failed to remove ${key}:`, e);
      }
    });

    return true;
  },

  // Clear ALL user data from localStorage (for logout)
  clearAllUserData: () => {
    const userId = getCurrentStorageUserId();
    console.log(`🧹 Clearing all session data for logout (user: ${userId})`);

    // Clear current user marker
    setCurrentStorageUserId(null);

    // We don't clear the user's actual data - just the current session marker
    // This allows users to log back in and retain their data
    // If you want to clear user data on logout, uncomment:
    // if (userId) storageUtils.clearUserData(userId);

    return true;
  }
};

// User State Management
export const userStateUtils = {
  getUserState: (userId) => {
    if (!userId) {
      console.warn('⚠️ getUserState called without userId');
      return {
        preferences: null,
        careerPath: null,
        resume: null,
        dashboard: null,
        completionLevel: 0
      };
    }

    // Set the current user ID for subsequent storage operations
    setCurrentStorageUserId(userId);

    const preferences = storageUtils.getItem(STORAGE_KEYS.USER_PREFERENCES, userId);
    const careerPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH, userId);
    const resume = storageUtils.getItem(STORAGE_KEYS.USER_RESUME, userId);
    const dashboard = storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD, userId);

    let completionLevel = 0;
    if (preferences) completionLevel = 1;
    if (resume) completionLevel = 2;
    if (careerPath) completionLevel = 3;
    if (dashboard) completionLevel = 4;

    console.log(`📊 User state for ${userId}:`, {
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

// Navigation Logic
export const determineUserNavigation = (storedState) => {
  const { preferences, careerPath, resume, dashboard } = storedState;

  // Complete user with dashboard -> Main Dashboard
  if (careerPath && dashboard) {
    console.log('🎯 Complete user -> Dashboard');
    return {
      stage: 5,
      skipToEnd: true,
      reason: 'Complete user with career path and dashboard data'
    };
  }

  // Has career path but no dashboard -> Dashboard (it will generate)
  if (careerPath) {
    console.log('🧭 Has career path -> Dashboard');
    return {
      stage: 5,
      skipToEnd: true,
      reason: 'Has career path, dashboard will generate'
    };
  }

  // Has preferences and resume -> Career Compass
  if (preferences && resume) {
    console.log('📋 Has preferences + resume -> Career Compass');
    return {
      stage: 4,
      skipToEnd: true,
      reason: 'Has basic setup, continue to career path selection'
    };
  }

  // Has preferences only -> Interest Selection
  if (preferences) {
    console.log('⚙️ Has preferences -> Interest Selection');
    return {
      stage: 3,
      skipToEnd: false,
      reason: 'Has path preferences, continue profile setup'
    };
  }

  // New user -> Profile Creation
  console.log('👤 New user -> Profile Creation');
  return {
    stage: 2,
    skipToEnd: false,
    reason: 'New user, complete onboarding'
  };
};

// Error Handling
export const handleAuthError = (error) => {
  const errorMap = {
    'UserNotFoundException': 'No account found with this email address.',
    'NotAuthorizedException': 'Incorrect email or password.',
    'UserNotConfirmedException': 'Please verify your email address first.',
    'TooManyRequestsException': 'Too many login attempts. Please wait a few minutes.',
    'InvalidParameterException': 'Please enter a valid email address.'
  };

  let errorMessage = errorMap[error.name] || 'Authentication failed. Please try again.';

  if (error.message?.toLowerCase().includes('network')) {
    errorMessage = 'Connection problem. Please check your internet.';
  }

  return errorMessage;
};

// Debug utilities (only in development)
export const debugUtils = {
  logAllStoredData: (userId) => {
    if (process.env.NODE_ENV !== 'development') return;

    console.group('🔍 User Storage Debug');
    console.log('User ID:', userId);

    const allData = {
      preferences: storageUtils.getItem(STORAGE_KEYS.USER_PREFERENCES, userId),
      careerPath: storageUtils.getItem(STORAGE_KEYS.CAREER_PATH, userId),
      resume: storageUtils.getItem(STORAGE_KEYS.USER_RESUME, userId),
      dashboard: storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD, userId)
    };

    Object.entries(allData).forEach(([key, value]) => {
      console.log(`${key}:`, value ? '✅ Present' : '❌ Missing');
    });

    console.groupEnd();
    return allData;
  },

  testSessionStorage: () => {
    try {
      const testKey = '_test_';
      const testData = { test: true };

      localStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(localStorage.getItem(testKey));
      localStorage.removeItem(testKey);

      console.log('✅ localStorage working');
      return true;
    } catch (error) {
      console.error('❌ localStorage not working:', error);
      return false;
    }
  },

  // List all keys for a user
  listUserKeys: (userId) => {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${userId}_`)) {
        keys.push(key);
      }
    }
    console.log(`📋 Keys for user ${userId}:`, keys);
    return keys;
  }
};

// Enhanced navigation with debug logging
export const determineUserNavigationWithDebug = (storedState) => {
  const { preferences, careerPath, resume, dashboard } = storedState;

  console.group('🧭 Navigation Logic Debug');
  console.log('Stored State:', {
    hasPreferences: !!preferences,
    hasCareerPath: !!careerPath,
    hasResume: !!resume,
    hasDashboard: !!dashboard
  });

  let decision;

  if (careerPath) {
    decision = {
      stage: 5,
      skipToEnd: true,
      reason: 'Returning user with career path, go to dashboard'
    };
    console.log('🎯 DECISION: Returning user -> Dashboard (Stage 5)');
  }
  else if (preferences && resume) {
    decision = {
      stage: 4,
      skipToEnd: true,
      reason: 'Has basic setup, continue to career path selection'
    };
    console.log('📋 DECISION: Has preferences + resume -> Career Compass (Stage 4)');
  }
  else if (preferences) {
    decision = {
      stage: 3,
      skipToEnd: false,
      reason: 'Has path preferences, continue profile setup'
    };
    console.log('⚙️ DECISION: Has preferences -> Interest Selection (Stage 3)');
  }
  else {
    decision = {
      stage: 2,
      skipToEnd: false,
      reason: 'New user, complete onboarding'
    };
    console.log('👤 DECISION: New user -> Profile Creation (Stage 2)');
  }

  console.log('Final Decision:', decision);
  console.groupEnd();

  return decision;
};

// Migration utility - migrate old non-scoped keys to user-scoped keys
export const migrateOldStorageKeys = (userId) => {
  if (!userId) return;

  console.log('🔄 Checking for old storage keys to migrate...');

  const oldKeyMap = {
    'userPathPreferences': STORAGE_KEYS.USER_PREFERENCES,
    'selectedCareerPath': STORAGE_KEYS.CAREER_PATH,
    'userResume': STORAGE_KEYS.USER_RESUME,
    'userProfile': STORAGE_KEYS.USER_PROFILE,
    'achievements': STORAGE_KEYS.ACHIEVEMENTS
  };

  let migrated = false;

  Object.entries(oldKeyMap).forEach(([oldKey, newBaseKey]) => {
    try {
      const oldData = localStorage.getItem(oldKey);
      if (oldData) {
        const newKey = `${userId}_${newBaseKey}`;
        // Only migrate if new key doesn't exist
        if (!localStorage.getItem(newKey)) {
          localStorage.setItem(newKey, oldData);
          console.log(`✅ Migrated ${oldKey} -> ${newKey}`);
          migrated = true;
        }
        // Remove old key after migration
        localStorage.removeItem(oldKey);
        console.log(`🗑️ Removed old key: ${oldKey}`);
      }
    } catch (e) {
      console.error(`Failed to migrate ${oldKey}:`, e);
    }
  });

  // Also migrate user-specific old keys
  const oldUserDashboardKey = `userDashboard_${userId}`;
  try {
    const oldDashboard = localStorage.getItem(oldUserDashboardKey);
    if (oldDashboard) {
      const newKey = `${userId}_${STORAGE_KEYS.USER_DASHBOARD}`;
      if (!localStorage.getItem(newKey)) {
        localStorage.setItem(newKey, oldDashboard);
        console.log(`✅ Migrated ${oldUserDashboardKey} -> ${newKey}`);
        migrated = true;
      }
      localStorage.removeItem(oldUserDashboardKey);
    }
  } catch (e) {
    console.error('Failed to migrate dashboard:', e);
  }

  if (migrated) {
    console.log('✅ Migration complete');
  } else {
    console.log('ℹ️ No old keys to migrate');
  }
};

// Clean up any non-user-scoped keys (for fresh start)
export const cleanupNonScopedKeys = () => {
  const nonScopedKeys = [
    'userPathPreferences',
    'selectedCareerPath',
    'userResume',
    'userProfile',
    'achievements',
    'userSkills',
    'userInterests'
  ];

  console.log('🧹 Cleaning up non-scoped storage keys...');

  nonScopedKeys.forEach(key => {
    try {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
        console.log(`🗑️ Removed non-scoped key: ${key}`);
      }
    } catch (e) {
      console.error(`Failed to remove ${key}:`, e);
    }
  });
};
