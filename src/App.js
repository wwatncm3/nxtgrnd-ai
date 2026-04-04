import React, { useState, createContext, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes, signOut } from '@aws-amplify/auth';
import { Hub } from '@aws-amplify/core';
import ErrorBoundary from './components/ErrorBoundary';
import ProfileCreation from './components/ProfileCreation';
import InterestSelection from './components/InterestSelection';
import MainContent from './components/MainContent';
import AICareerCompass from './pages/AiCareerCompass';
import ResumeAnalysis from './components/ResumeAnalysis';
import CreatorProfile from './components/CreatorProfile';
import SettingsPage from './pages/SettingsPage';
import LearningPathsPage from './pages/LearningPathsPage';
import JobsProjectsPage from './pages/JobsProjectsPage';
import CertificationsPage from './pages/CertificationsPage';
import MentorMatchingQuiz from './components/MentorMatchingQuiz';
import PricingPage from './pages/PricingPage';
import AdminPage from './pages/AdminPage';
import SubscriptionGate from './components/SubscriptionGate';
import { AchievementProvider } from './components/AchievementSystem';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { TooltipProvider, TooltipOverlay } from './components/OnboardingTooltip';
import analytics from './utils/analytics';
import { userStateService } from './services/storageService';

export const UserContext = createContext();

const OnboardingLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    {children}
  </div>
);

function App() {
  const [stage, setStage] = useState(1);
  const [user, setUser] = useState({});
  const [selectedCareerPath, setSelectedCareerPath] = useState(null);
  const [, setIsLoading] = useState(true);
  const [storageWarning, setStorageWarning] = useState(null);

  // Check authentication status on app load
  useEffect(() => {
    analytics.init();

    // Listen for OAuth sign-in completion via Amplify Hub
    const hubListener = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect') {
        // OAuth token exchange completed — now safe to check auth
        checkAuthState();
      }
      if (payload.event === 'signInWithRedirect_failure') {
        console.error('OAuth sign-in failed:', payload.data);
        setStage(1);
        setIsLoading(false);
      }
    });

    // Detect if this is an OAuth callback (URL has ?code= from Cognito redirect)
    const params = new URLSearchParams(window.location.search);
    const isOAuthCallback = params.has('code') && params.has('state');

    if (isOAuthCallback) {
      // OAuth callback — Amplify is exchanging the code for tokens in the background.
      // Do NOT call checkAuthState yet — it will fail because tokens aren't ready.
      // The Hub listener above will fire 'signInWithRedirect' when tokens are ready.
      console.log('OAuth callback detected — waiting for token exchange...');
    } else {
      // Normal page load — check auth state immediately
      checkAuthState();
    }

    // Handle Stripe checkout return
    if (params.get('subscription') === 'success') {
      window.history.replaceState({}, '', window.location.pathname);
      setStage(5);
    }

    // Listen for localStorage quota exceeded warnings
    const handleQuotaExceeded = (e) => {
      setStorageWarning(e.detail?.error || 'Local storage is full. Some data may not be saved.');
    };
    window.addEventListener('storage-quota-exceeded', handleQuotaExceeded);

    return () => {
      hubListener();
      analytics.cleanup();
      window.removeEventListener('storage-quota-exceeded', handleQuotaExceeded);
    };

  }, []);
  useEffect(() => {
  const handleKeyPress = (e) => {
    // Press Ctrl+Shift+C to clear cache
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      localStorage.clear();
      sessionStorage.clear();
      console.log('CLEARING: CLEARED ALL CACHE - Ctrl+Shift+C pressed');
      window.location.reload(); // Fresh start
    }
  };

  // Only add this in development to avoid accidental clearing in production
  if (process.env.NODE_ENV === 'development') {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }
}, []);

  const checkAuthState = async () => {
    try {
      const cognitoUser = await getCurrentUser();
      // FIX: Corrected the function name to match the import (fetchUserAttributes)
      const userAttributes = await fetchUserAttributes();

      // Convert Cognito attributes to user object (handles both email/password and OAuth users)
      const baseUserData = {
        username: cognitoUser.username,
        email: userAttributes.email,
        firstName: userAttributes.given_name || userAttributes.name?.split(' ')[0] || '',
        lastName: userAttributes.family_name || userAttributes.name?.split(' ').slice(1).join(' ') || '',
      };

      // Load stored preferences (including avatar) and merge with Cognito data
      const storedState = await userStateService.getUserState(userAttributes.email);

      const completeUserData = {
        ...baseUserData,
        ...storedState.preferences  // This includes avatar, pathType, careerStage, primaryGoal
      };

      // Add selectedCareerPath if it exists
      if (storedState.careerPath) {
        completeUserData.selectedCareerPath = storedState.careerPath;
      }

      // Add resume if it exists
      if (storedState.resume) {
        completeUserData.resume = storedState.resume;
      }

      setUser(completeUserData);
      analytics.setUser(completeUserData.username, {
      email: completeUserData.email,
      firstName: completeUserData.firstName,
      lastName: completeUserData.lastName
    });
      // Authenticated user — route based on profile completeness
      if (completeUserData.selectedCareerPath) {
        // Existing user with career path → dashboard
        setStage(5);
      } else if (completeUserData.pathType || completeUserData.careerStage) {
        // Partially completed onboarding → interest selection
        setStage(2);
      } else {
        // New OAuth user (no stored data) → onboarding flow
        // Use stage 2 (interest selection) since they already have an account via Google
        setStage(2);
      }
    } catch (error) {
      // Clear any stale/corrupt auth session so Cognito stops returning 400
      try { await signOut(); } catch (_) { /* no session to clear */ }
      setStage(1); // Go to login/signup if not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageComplete = (data) => {
    if (data && typeof data === 'object') {
      setUser(prevUser => ({
        ...prevUser,
        ...data
      }));
    }
    setStage(prevStage => prevStage + 1);
  };

  const renderContent = () => {
    switch (stage) {
      case 1: // Account Creation
        return (
          <OnboardingLayout>
            <ProfileCreation 
              // The new onNext handler that trusts the decision from the login logic
              onNext={(profileData, navigation) => {
                if (navigation && navigation.skipToEnd) {
                  setUser(prev => ({...prev, ...profileData}));
                  setStage(navigation.stage);
                } else {
                  // New user signup - proceed to interest selection
                  setUser(prev => ({...prev, ...profileData}));
                  setStage(3);
                }
              }}
            />
          </OnboardingLayout>
        );

      case 2: // Redirect to InterestSelection (stage 2 is no longer used directly)
        setStage(3);
        return null;

      // ✅ FIX: Stage 3 is now the complete Interests & Resume flow
      case 3: 
        return (
          <OnboardingLayout>
            <InterestSelection
              // After completing skills/resume, go directly to Career Compass (new stage 4)
              onComplete={(data) => handleStageComplete(data, 4)}
              initialData={user}
            />
          </OnboardingLayout>
        );

      // ✅ FIX: Stages are re-numbered. Career Compass is now stage 4.
      case 4: // AI Career Compass
        return (
          <OnboardingLayout>
            <AICareerCompass />
          </OnboardingLayout>
        );

      // ✅ FIX: Dashboard is now stage 5
      case 5: 
        return <MainContent setStage={setStage} />;

      // ✅ FIX: Resume Analysis is now stage 6 (Pro feature)
      case 6:
        return (
          <SubscriptionGate feature="resume_ats">
            <ResumeAnalysis setStage={setStage} />
          </SubscriptionGate>
        );

      // ✅ NEW: Creator Profile is stage 7
      case 7:
        return <CreatorProfile setStage={setStage} />;

      // ✅ NEW: Settings Page is stage 8
      case 8:
        return <SettingsPage setStage={setStage} />;

      // ✅ NEW: Learning Paths Page is stage 9
      case 9:
        return <LearningPathsPage setStage={setStage} />;

      // ✅ NEW: Jobs & Projects Page is stage 10
      case 10:
        return <JobsProjectsPage setStage={setStage} />;

      // ✅ NEW: Certifications Page is stage 11
      case 11:
        return <CertificationsPage setStage={setStage} />;

      // ✅ NEW: Mentor Matching Quiz is stage 12 (Pro feature)
      case 12:
        return (
          <SubscriptionGate feature="mentor_matching">
            <MentorMatchingQuiz setStage={setStage} onBack={() => setStage(5)} />
          </SubscriptionGate>
        );

      // ✅ NEW: Pricing Page is stage 13
      case 13:
        return <PricingPage />;

      // ✅ NEW: Admin Page is stage 14
      case 14:
        return <AdminPage setStage={setStage} />;

      default:
        return (
          <OnboardingLayout>
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
              <button 
                onClick={() => setStage(1)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg"
              >
                Return Home
              </button>
            </div>
          </OnboardingLayout>
        );
    }
  };

  return (
    <ErrorBoundary>
      <UserContext.Provider value={{
        user,
        setUser,
        stage,
        setStage,
        selectedCareerPath,
        setSelectedCareerPath
      }}>
        <SubscriptionProvider>
          <TooltipProvider userId={user?.userID || user?.username}>
            <AchievementProvider>
              {storageWarning && (
                <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-50 border-b border-yellow-200 px-4 py-3 flex items-center justify-between">
                  <p className="text-sm text-yellow-800">{storageWarning}</p>
                  <button
                    onClick={() => setStorageWarning(null)}
                    className="ml-4 text-yellow-600 hover:text-yellow-800 font-medium text-sm"
                  >
                    Dismiss
                  </button>
                </div>
              )}
              {renderContent()}
              <TooltipOverlay />
            </AchievementProvider>
          </TooltipProvider>
        </SubscriptionProvider>
      </UserContext.Provider>
    </ErrorBoundary>
  );
}

export default App;