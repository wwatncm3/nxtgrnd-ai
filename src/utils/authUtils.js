// src/utils/authUtils.js
// Session Storage Constants
export const STORAGE_KEYS = {
  USER_PREFERENCES: 'userPathPreferences',
  CAREER_PATH: 'selectedCareerPath',
  USER_RESUME: 'userResume',
  USER_DASHBOARD: (userId) => `userDashboard_${userId}`,
  USER_SKILLS: 'userSkills',
  USER_INTERESTS: 'userInterests'
};

// Session Storage Utilities
export const storageUtils = {
  setItem: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data)); // Changed to localStorage
      console.log(`💾 Stored ${key} in localStorage`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to store ${key}:`, error);
      return false;
    }
  },

  getItem: (key) => {
    try {
      const stored = localStorage.getItem(key); // Changed to localStorage
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log(`📖 Retrieved ${key} from localStorage`);
        return parsed;
      }
      return null;
    } catch (error) {
      console.error(`❌ Failed to retrieve ${key}:`, error);
      return null;
    }
  },

  removeItem: (key) => {
    try {
      localStorage.removeItem(key); // Changed to localStorage
      console.log(`🗑️ Removed ${key} from localStorage`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to remove ${key}:`, error);
      return false;
    }
  },

  checkUserData: (userId) => {
    return {
      preferences: !!storageUtils.getItem(STORAGE_KEYS.USER_PREFERENCES),
      careerPath: !!storageUtils.getItem(STORAGE_KEYS.CAREER_PATH),
      resume: !!storageUtils.getItem(STORAGE_KEYS.USER_RESUME),
      dashboard: !!storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD(userId))
    };
  }
};

// User State Management
export const userStateUtils = {
  getUserState: (userId) => {
    const preferences = storageUtils.getItem(STORAGE_KEYS.USER_PREFERENCES);
    const careerPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH);
    const resume = storageUtils.getItem(STORAGE_KEYS.USER_RESUME);
    const dashboard = storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD(userId));

    let completionLevel = 0;
    if (preferences) completionLevel = 1;
    if (resume) completionLevel = 2;
    if (careerPath) completionLevel = 3;
    if (dashboard) completionLevel = 4;

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
      stage: 6, 
      skipToEnd: true,
      reason: 'Complete user with career path and dashboard data'
    };
  }

  // Has career path but no dashboard -> Career Compass
  if (careerPath) {
    console.log('🧭 Has career path -> Career Compass');
    return { 
      stage: 5, 
      skipToEnd: true,
      reason: 'Has career path, needs dashboard generation'
    };
  }

  // Has preferences and resume -> Interest Selection  
  if (preferences && resume) {
    console.log('📋 Has preferences + resume -> Interest Selection');
    return { 
      stage: 3, 
      skipToEnd: false,
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
    
    console.group('🔍 Session Storage Debug');
    
    const allData = {
      preferences: storageUtils.getItem(STORAGE_KEYS.USER_PREFERENCES),
      careerPath: storageUtils.getItem(STORAGE_KEYS.CAREER_PATH),
      resume: storageUtils.getItem(STORAGE_KEYS.USER_RESUME),
      dashboard: storageUtils.getItem(STORAGE_KEYS.USER_DASHBOARD(userId))
    };

    Object.entries(allData).forEach(([key, value]) => {
      console.log(`${key}:`, value ? '✅ Present' : '❌ Missing', value);
    });
    
    console.groupEnd();
    return allData;
  },

  testSessionStorage: () => {
    try {
      const testKey = '_test_';
      const testData = { test: true };
      
      sessionStorage.setItem(testKey, JSON.stringify(testData));
      const retrieved = JSON.parse(sessionStorage.getItem(testKey));
      sessionStorage.removeItem(testKey);
      
      console.log('✅ Session storage working');
      return true;
    } catch (error) {
      console.error('❌ Session storage not working:', error);
      return false;
    }
  }
};
// ADD this function to authUtils.js after the determineUserNavigation function

// The corrected function with updated stage numbers
export const determineUserNavigationWithDebug = (storedState) => {
  const { preferences, careerPath, resume, dashboard } = storedState;

  console.group('🧭 Navigation Logic Debug');
  console.log('Stored State:', {
    hasPreferences: !!preferences,
    hasCareerPath: !!careerPath,
    hasResume: !!resume,
    hasDashboard: !!dashboard,
    preferences,
    careerPath,
    resume,
    dashboard
  });

  let decision;

  // ✅ FIX: If a user has a selected career path, they should ALWAYS go to the Dashboard (now Stage 5).
  // The Dashboard component itself will handle fetching data if it's not in the cache.
  if (careerPath) {
    decision = { 
      stage: 5, // CORRECT stage for Dashboard
      skipToEnd: true,
      reason: 'Returning user with career path, go to dashboard'
    };
    console.log('🎯 DECISION: Returning user -> Dashboard (Stage 5)');
  }
  // Has preferences and resume but no path -> Career Compass (now Stage 4)
  else if (preferences && resume) {
    decision = { 
      stage: 4, // CORRECT stage for Career Compass
      skipToEnd: false,
      reason: 'Has basic setup, continue to career path selection'
    };
    console.log('📋 DECISION: Has preferences + resume -> Career Compass (Stage 4)');
  }
  // Has only path preferences -> Interest/Skills/Resume selection (Stage 3)
  else if (preferences) {
    decision = { 
      stage: 3, // Correct stage for InterestSelection
      skipToEnd: false,
      reason: 'Has path preferences, continue profile setup'
    };
    console.log('⚙️ DECISION: Has preferences -> Interest Selection (Stage 3)');
  }
  // New user -> Start of onboarding (Path Selection)
  else {
    decision = { 
      stage: 2, // Correct stage for the "compass" section of ProfileCreation
      skipToEnd: false,
      reason: 'New user, complete onboarding'
    };
    console.log('👤 DECISION: New user -> Profile Creation (Stage 2)');
  }

  console.log('Final Decision:', decision);
  console.groupEnd();
  
  return decision;
};