// ENHANCED LoginHandler.js with DynamoDB persistence

import {
  signIn,
  getCurrentUser,
  fetchUserAttributes,
  signOut
} from '@aws-amplify/auth';
import {
  determineUserNavigationWithDebug,
  handleAuthError,
  debugUtils,
  setCurrentStorageUserId,
  migrateOldStorageKeys,
  cleanupNonScopedKeys,
  storageUtils
} from '../utils/authUtils';
import { userStateService, storageService } from '../services/storageService';

export const useLoginHandler = () => {
  
  const handleLogin = async (loginData, setUser, onNext, setErrors, setIsLoggingIn, setView, setCurrentSection, setUnverifiedUser) => {
    setIsLoggingIn(true);
    
    // Clear previous errors
    setErrors(prev => ({ ...prev, login: '', verification: '' }));
    
    // Basic validation
    if (!loginData.username || !loginData.password) {
      setErrors(prev => ({ ...prev, login: 'Please enter both email and password' }));
      setIsLoggingIn(false);
      return;
    }

    try {
      console.log('AUTH: Login attempt for:', loginData.username);

      // Step 1: Test session storage
      if (!debugUtils.testSessionStorage()) {
        throw new Error('Session storage not available');
      }

      // Step 2: Check if user is already authenticated
      let currentUser;
      let userAttributes;
      let needsSignIn = true;

      try {
        currentUser = await getCurrentUser();
        userAttributes = await fetchUserAttributes();

        // If we get here, user is already authenticated
        console.log('SUCCESS: User already authenticated, checking if same user...');

        // Check if this is the same user trying to log in
        if (userAttributes.email === loginData.username) {
          console.log('SUCCESS: Same user, using existing session');
          needsSignIn = false;
        } else {
          console.log('RELOADING: Different user detected, signing out current user');
          // Clear the previous user's session marker
          storageUtils.clearAllUserData();
          await signOut();
          needsSignIn = true;
        }

      } catch (error) {
        // User not authenticated
        console.log('AUTH: No existing session found');
        needsSignIn = true;
      }

      // Sign in if needed
      if (needsSignIn) {
        console.log('AUTH: Signing in user...');
        await signIn({
          username: loginData.username,
          password: loginData.password
        });

        // Get user data after sign in
        currentUser = await getCurrentUser();
        userAttributes = await fetchUserAttributes();
      }

      // Step 2.5: Set up user-scoped storage and migrate old keys
      const userId = loginData.username;
      console.log('AUTH: Setting current storage user ID:', userId);
      setCurrentStorageUserId(userId);

      // Clean up any non-scoped keys from previous sessions
      cleanupNonScopedKeys();

      // Migrate any old storage keys for this user
      migrateOldStorageKeys(userId);
      
      console.log('SUCCESS: Authentication successful');
      
      // Step 3: Create base user data
      const baseUserData = {
        userID: loginData.username,
        username: userAttributes.preferred_username || loginData.username,
        email: userAttributes.email,
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
      };

      console.log('USER: Base user data created:', baseUserData);

      // Step 4: Get stored user state (now async to check DynamoDB)
      const storedState = await userStateService.getUserState(loginData.username);
      console.log('STATS: Stored state:', storedState);

      // Step 5: Debug log (development only)
      debugUtils.logAllStoredData(loginData.username);

      // Step 6: Merge stored data with base user data
      const completeUserData = {
  ...baseUserData,
  ...storedState.preferences
};

// SUCCESS: Add selectedCareerPath if it exists
// storageUtils.getItem already returns parsed data, no need to JSON.parse
if (storedState.careerPath) {
  completeUserData.selectedCareerPath = storedState.careerPath;
  console.log('SUCCESS: Added selectedCareerPath to user data:', completeUserData.selectedCareerPath?.title);
}

// SUCCESS: Add resume if it exists
// storageUtils.getItem already returns parsed data, no need to JSON.parse
if (storedState.resume) {
  completeUserData.resume = storedState.resume;
  console.log('SUCCESS: Added resume to user data');
}

      // Step 7: Update user context FIRST
      setUser(completeUserData);
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 8: Determine navigation with enhanced debugging
      const navigation = determineUserNavigationWithDebug(storedState);
      console.log('NAV: Final Navigation decision:', navigation);
      
      // Step 9: Navigate user with explicit logging
      console.log('TARGET: About to call onNext with:', {
        userData: completeUserData,
        skipToEnd: navigation.skipToEnd,
        expectedStage: navigation.stage
      });
      
      onNext(completeUserData, navigation);

    } catch (error) {
      console.error('ERROR: Login failed:', error);

      // Get error identifier (Amplify v6 uses 'name', older versions use 'code')
      const errorType = error.name || error.code;

      // Enhanced error handling for specific Cognito errors
      if (errorType === 'UserNotConfirmedException') {
        console.log('EMAIL: User needs email verification');

        // Store user data for verification process
        if (setUnverifiedUser) {
          setUnverifiedUser({ username: loginData.username, password: loginData.password });
        }

        // Navigate to verification step if functions are provided
        if (setView && setCurrentSection) {
          setView('signup');
          setCurrentSection('verify');
        }

        setErrors(prev => ({
          ...prev,
          verification: 'Please verify your email before logging in. Check your inbox for the verification code.',
          login: ''
        }));

      } else if (errorType === 'UserNotFoundException') {
        setErrors(prev => ({
          ...prev,
          login: 'No account found with this email address. Please check your email or create a new account.'
        }));

      } else if (errorType === 'NotAuthorizedException') {
        setErrors(prev => ({
          ...prev,
          login: 'Incorrect password. Please try again.'
        }));

      } else if (errorType === 'TooManyRequestsException') {
        setErrors(prev => ({
          ...prev,
          login: 'Too many login attempts. Please wait a few minutes before trying again.'
        }));

      } else {
        // Fallback to existing error handler
        const errorMessage = handleAuthError(error);
        setErrors(prev => ({ ...prev, login: errorMessage }));
      }
      
    } finally {
      setIsLoggingIn(false);
    }
  };

  return { handleLogin };
};