// DynamoDB Service Layer
// Handles user data persistence via Lambda API
// Uses your existing dynamic-options Lambda infrastructure

import { fetchAuthSession } from 'aws-amplify/auth';
import awsConfig from '../aws-config';
import API_CONFIG from '../config/api';

// Get the user data API base URL (derived from dynamic-options API)
const getUserDataApiUrl = () => {
  try {
    return API_CONFIG.userData.getBaseUrl();
  } catch {
    return null;
  }
};

// Flag to check if API is configured
const isApiConfigured = () => !!getUserDataApiUrl();

// Get auth token for API calls
const getAuthToken = async () => {
  try {
    const session = await fetchAuthSession();
    return session.tokens?.idToken?.toString() || null;
  } catch (error) {
    console.warn('Could not get auth token:', error);
    return null;
  }
};

// Make authenticated API request
const apiRequest = async (endpoint, method = 'GET', body = null) => {
  if (!isApiConfigured()) {
    // API not configured - gracefully return null (localStorage will be used as fallback)
    return null;
  }

  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body && (method === 'POST' || method === 'PUT')) {
    options.body = JSON.stringify(body);
  }

  try {
    const baseUrl = getUserDataApiUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'API request failed');
    }

    return data;
  } catch (error) {
    console.warn(`API ${method} ${endpoint} failed:`, error.message);
    return null;
  }
};

// Table names from config (for reference)
const TABLES = awsConfig.DynamoDB?.tables || {
  users: 'nxtgrnd-users',
  userDashboards: 'nxtgrnd-user-dashboards',
  userPreferences: 'nxtgrnd-user-preferences'
};

// ============== USER PROFILE OPERATIONS ==============

export const saveUserProfile = async (userId, profileData) => {
  if (!isApiConfigured()) {
    console.log('📝 DynamoDB API not configured - data saved to localStorage only');
    return { success: true, localOnly: true };
  }

  try {
    const result = await apiRequest('/profile', 'POST', {
      userId,
      profile: {
        ...profileData,
        createdAt: profileData.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    });

    if (result) {
      console.log('SUCCESS: User profile saved to DynamoDB');
      return { success: true };
    }
    return { success: true, localOnly: true };
  } catch (error) {
    console.error('ERROR: Error saving user profile:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  if (!isApiConfigured()) return null;

  try {
    const data = await apiRequest(`/profile?userId=${encodeURIComponent(userId)}`, 'GET');
    if (data?.profile) {
      console.log('LOADED: User profile retrieved from DynamoDB');
      return data.profile;
    }
    return null;
  } catch (error) {
    console.error('ERROR: Error getting user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userId, updates) => {
  if (!isApiConfigured()) {
    return { success: true, localOnly: true };
  }

  try {
    const existing = await getUserProfile(userId);
    const result = await apiRequest('/profile', 'PUT', {
      userId,
      profile: {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      }
    });

    if (result) {
      console.log('SUCCESS: User profile updated in DynamoDB');
      return { success: true };
    }
    return { success: true, localOnly: true };
  } catch (error) {
    console.error('ERROR: Error updating user profile:', error);
    return { success: false, error: error.message };
  }
};

// ============== DASHBOARD DATA OPERATIONS ==============

export const saveDashboardData = async (userId, dashboardData) => {
  if (!isApiConfigured()) {
    return { success: true, localOnly: true };
  }

  try {
    const result = await apiRequest('/dashboard', 'POST', {
      userId,
      dashboard: {
        ...dashboardData,
        updatedAt: new Date().toISOString()
      }
    });

    if (result) {
      console.log('SUCCESS: Dashboard data saved to DynamoDB');
      return { success: true };
    }
    return { success: true, localOnly: true };
  } catch (error) {
    console.error('ERROR: Error saving dashboard data:', error);
    return { success: false, error: error.message };
  }
};

export const getDashboardData = async (userId) => {
  if (!isApiConfigured()) return null;

  try {
    const data = await apiRequest(`/dashboard?userId=${encodeURIComponent(userId)}`, 'GET');
    if (data?.dashboard) {
      console.log('LOADED: Dashboard data retrieved from DynamoDB');
      return data.dashboard;
    }
    return null;
  } catch (error) {
    console.error('ERROR: Error getting dashboard data:', error);
    return null;
  }
};

// ============== USER PREFERENCES OPERATIONS ==============

export const saveUserPreferences = async (userId, preferencesData) => {
  if (!isApiConfigured()) {
    return { success: true, localOnly: true };
  }

  try {
    const result = await apiRequest('/preferences', 'POST', {
      userId,
      preferences: {
        ...preferencesData,
        updatedAt: new Date().toISOString()
      }
    });

    if (result) {
      console.log('SUCCESS: User preferences saved to DynamoDB');
      return { success: true };
    }
    return { success: true, localOnly: true };
  } catch (error) {
    console.error('ERROR: Error saving user preferences:', error);
    return { success: false, error: error.message };
  }
};

export const getUserPreferences = async (userId) => {
  if (!isApiConfigured()) return null;

  try {
    const data = await apiRequest(`/preferences?userId=${encodeURIComponent(userId)}`, 'GET');
    if (data?.preferences) {
      console.log('LOADED: User preferences retrieved from DynamoDB');
      return data.preferences;
    }
    return null;
  } catch (error) {
    console.error('ERROR: Error getting user preferences:', error);
    return null;
  }
};

// ============== COMBINED DATA OPERATIONS ==============

// Load all user data from DynamoDB (for app initialization)
export const loadAllUserData = async (userId) => {
  if (!isApiConfigured()) {
    console.log('📝 DynamoDB API not configured - using localStorage only');
    return { profile: null, dashboard: null, preferences: null, hasData: false };
  }

  console.log('RELOADING: Loading all user data from DynamoDB...');

  try {
    const data = await apiRequest(`/all?userId=${encodeURIComponent(userId)}`, 'GET');

    if (data) {
      return {
        profile: data.profile || null,
        dashboard: data.dashboard || null,
        preferences: data.preferences || null,
        hasData: data.hasData || false
      };
    }

    return { profile: null, dashboard: null, preferences: null, hasData: false };
  } catch (error) {
    console.error('ERROR: Error loading user data:', error);
    return { profile: null, dashboard: null, preferences: null, hasData: false };
  }
};

// Save all user data to DynamoDB
export const saveAllUserData = async (userId, data) => {
  if (!isApiConfigured()) {
    return { success: true, localOnly: true };
  }

  console.log('SAVED: Saving all user data to DynamoDB...');

  try {
    const result = await apiRequest('/all', 'POST', {
      userId,
      profile: data.profile,
      dashboard: data.dashboard,
      preferences: data.preferences
    });

    if (result) {
      console.log('SUCCESS: All data saved successfully');
      return { success: true };
    }
    return { success: true, localOnly: true };
  } catch (error) {
    console.error('ERROR: Error saving all user data:', error);
    return { success: false, error: error.message };
  }
};

// Delete all user data from DynamoDB
export const deleteAllUserData = async (userId) => {
  if (!isApiConfigured()) {
    return { success: true, localOnly: true };
  }

  console.log('REMOVED: Deleting all user data from DynamoDB...');

  try {
    const result = await apiRequest(`/all?userId=${encodeURIComponent(userId)}`, 'DELETE');
    if (result) {
      console.log('SUCCESS: All user data deleted');
      return { success: true };
    }
    return { success: true, localOnly: true };
  } catch (error) {
    console.error('ERROR: Error deleting user data:', error);
    return { success: false, error: error.message };
  }
};

// ============== SYNC UTILITIES ==============

// Sync localStorage data to DynamoDB (for migration)
export const syncLocalToDynamo = async (userId, localData) => {
  if (!isApiConfigured()) {
    return { success: true, localOnly: true };
  }

  console.log('RELOADING: Syncing local storage to DynamoDB...');

  const dataToSave = {};

  if (localData.profile || localData.resume || localData.skills || localData.interests) {
    dataToSave.profile = {
      resume: localData.resume,
      skills: localData.skills,
      interests: localData.interests,
      creatorProfile: localData.creatorProfile,
      ...(localData.profile || {})
    };
  }

  if (localData.dashboard || localData.careerPath) {
    dataToSave.dashboard = {
      careerPath: localData.careerPath,
      learningPaths: localData.dashboard?.learningPaths,
      opportunities: localData.dashboard?.opportunities,
      goals: localData.dashboard?.goals,
      events: localData.dashboard?.events,
      ...(localData.dashboard || {})
    };
  }

  if (localData.preferences || localData.pathPreferences) {
    dataToSave.preferences = {
      pathPreferences: localData.pathPreferences || localData.preferences,
      notifications: localData.notifications,
      ...(localData.preferences || {})
    };
  }

  return saveAllUserData(userId, dataToSave);
};

// Check if DynamoDB API is configured and reachable
export const checkDynamoConnection = async () => {
  if (!isApiConfigured()) {
    return false;
  }

  try {
    // Simple health check
    const baseUrl = getUserDataApiUrl();
    const response = await fetch(`${baseUrl.replace('/user', '')}/health`, {
      method: 'GET'
    });
    return response.ok;
  } catch {
    return false;
  }
};

// Export service object
const dynamoService = {
  saveUserProfile,
  getUserProfile,
  updateUserProfile,
  saveDashboardData,
  getDashboardData,
  saveUserPreferences,
  getUserPreferences,
  loadAllUserData,
  saveAllUserData,
  deleteAllUserData,
  syncLocalToDynamo,
  checkDynamoConnection,
  TABLES,
  isApiConfigured
};

export default dynamoService;
