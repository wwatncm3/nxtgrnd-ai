// ENHANCED LoginHandler.js with better verification error handling

import { 
  signIn, 
  getCurrentUser, 
  fetchUserAttributes,
  signOut 
} from '@aws-amplify/auth';
import { 
  sessionUtils, 
  userStateUtils, 
  determineUserNavigationWithDebug,
  handleAuthError,
  debugUtils 
} from '../utils/authUtils';

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
      console.log('🔐 Login attempt for:', loginData.username);

      // Step 1: Test session storage
      if (!debugUtils.testSessionStorage()) {
        throw new Error('Session storage not available');
      }

      // Step 2: Check if user is already authenticated
      let currentUser;
      let userAttributes;
      
      try {
        currentUser = await getCurrentUser();
        userAttributes = await fetchUserAttributes();
        
        // If we get here, user is already authenticated
        console.log('✅ User already authenticated, using existing session');
        
        // Check if this is the same user trying to log in
        if (userAttributes.email !== loginData.username) {
          console.log('🔄 Different user detected, signing out current user');
          await signOut();
          // Proceed with new login below
          throw new Error('NEED_NEW_SIGNIN');
        }
        
      } catch (error) {
        if (error.message === 'NEED_NEW_SIGNIN') {
          // Sign in the new user
          console.log('🔐 Signing in new user...');
          await signIn({
            username: loginData.username,
            password: loginData.password
          });
          
          // Get user data after sign in
          currentUser = await getCurrentUser();
          userAttributes = await fetchUserAttributes();
        } else {
          // User not authenticated, proceed with normal sign in
          console.log('🔐 No existing session, signing in...');
          await signIn({
            username: loginData.username,
            password: loginData.password
          });
          
          // Get user data after sign in
          currentUser = await getCurrentUser();
          userAttributes = await fetchUserAttributes();
        }
      }
      
      console.log('✅ Authentication successful');
      
      // Step 3: Create base user data
      const baseUserData = {
        userID: loginData.username,
        username: userAttributes.preferred_username || loginData.username,
        email: userAttributes.email,
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
      };

      console.log('👤 Base user data created:', baseUserData);

      // Step 4: Get stored user state
      const storedState = userStateUtils.getUserState(loginData.username);
      console.log('📊 Stored state:', storedState);

      // Step 5: Debug log (development only)
      debugUtils.logAllStoredData(loginData.username);

      // Step 6: Merge stored data with base user data
      const completeUserData = {
        ...baseUserData,
        ...storedState.preferences,
        // ✅ FIX: Correctly add the restored career path and resume to the user object
        selectedCareerPath: storedState.careerPath,
        resume: storedState.resume
      };

      console.log('🔄 Complete user data:', completeUserData);

      // Step 7: Update user context FIRST
      setUser(completeUserData);
      
      // Wait a bit for state to settle
      await new Promise(resolve => setTimeout(resolve, 100));

      // Step 8: Determine navigation with enhanced debugging
      const navigation = determineUserNavigationWithDebug(storedState);
      console.log('🧭 Final Navigation decision:', navigation);
      
      // Step 9: Navigate user with explicit logging
      console.log('📍 About to call onNext with:', {
        userData: completeUserData,
        skipToEnd: navigation.skipToEnd,
        expectedStage: navigation.stage
      });
      
      onNext(completeUserData, navigation);

    } catch (error) {
      console.error('❌ Login failed:', error);
      
      // Enhanced error handling for specific Cognito errors
      if (error.code === 'UserNotConfirmedException') {
        console.log('📧 User needs email verification');
        
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
        
      } else if (error.code === 'UserNotFoundException') {
        setErrors(prev => ({
          ...prev,
          login: 'No account found with this email address. Please check your email or create a new account.'
        }));
        
      } else if (error.code === 'NotAuthorizedException') {
        setErrors(prev => ({
          ...prev,
          login: 'Incorrect email or password. Please check your credentials and try again.'
        }));
        
      } else if (error.code === 'TooManyRequestsException') {
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