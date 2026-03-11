import React, { useState, createContext, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes } from '@aws-amplify/auth';
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
import { AchievementProvider } from './components/AchievementSystem';
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

  // Check authentication status on app load
  useEffect(() => {
    // localStorage.clear();
    // sessionStorage.clear();
    analytics.init();
    checkAuthState();
    return () => analytics.cleanup();

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

      // Convert Cognito attributes to user object
      const baseUserData = {
        username: cognitoUser.username,
        email: userAttributes.email,
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
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

      console.log('🖼️ checkAuthState - Avatar in user data:', completeUserData.avatar ? 'PRESENT' : 'MISSING');

      setUser(completeUserData);
      analytics.setUser(completeUserData.username, {
      email: completeUserData.email,
      firstName: completeUserData.firstName,
      lastName: completeUserData.lastName
    });
      // Instead of going directly to dashboard, start at the beginning of the flow
      setStage(1);
    } catch (error) {
      console.log('User is not authenticated');
      setStage(1); // Go to login/signup if not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageComplete = (data) => {
    console.log('TARGET: Stage completed with data:', data);
    
    // ✅ FIX: Update user state with the complete data passed from child component
    if (data && typeof data === 'object') {
      console.log('📝 Updating user state with complete data');
      setUser(prevUser => {
        const updatedUser = {
          ...prevUser,
          ...data  // This now contains all the data from InterestSelection
        };
        console.log('USER: User state updated:', updatedUser);
        return updatedUser;
      });
    }
    
    // ✅ FIX: Use setStage instead of setCurrentStage
    setStage(prevStage => {
      const nextStage = prevStage + 1;
      console.log(`🚀 Moving from stage ${prevStage} to stage ${nextStage}`);
      return nextStage;
    });
  };

  const handleCareerPathSelect = (path) => {
    setSelectedCareerPath(path);
    // When a career path is selected, update user data but stay on the AICareerCompass page
    setUser(prev => ({
      ...prev,
      selectedCareerPath: path
    }));
    // Store the selection in session storage for persistence
    sessionStorage.setItem('selectedCareerPath', JSON.stringify(path));
    
    // Removed navigation to dashboard (stage 6)
    // We'll stay on the AICareerCompass page (stage 5)
  };

  const renderContent = () => {
    switch (stage) {
      case 1: // Account Creation
        return (
          <OnboardingLayout>
            <ProfileCreation 
              // The new onNext handler that trusts the decision from the login logic
              onNext={(profileData, navigation) => {
                console.log('TARGET: App.js received navigation:', { profileData, navigation });
                
                // ✅ FIX: Trust the navigation decision made by authUtils/LoginHandler
                if (navigation && navigation.skipToEnd) {
                  console.log(`SUCCESS: Returning user -> Navigating to stage ${navigation.stage} based on restored state.`);
                  setUser(prev => ({...prev, ...profileData}));
                  // Use the stage number provided by the navigation object
                  setStage(navigation.stage); 
                } else {
                  // New user signup - proceed to interest selection
                  console.log('USER: New user -> Interest Selection (Stage 3)');
                  setUser(prev => ({...prev, ...profileData}));
                  setStage(3);
                }
              }}
            />
          </OnboardingLayout>
        );

      case 2: // Path Selection (Start Your Journey)
        return (
          <OnboardingLayout>
            <ProfileCreation
              currentSection="compass"
              onNext={(data) => handleStageComplete(data, 3)}
            />
          </OnboardingLayout>
        );

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
            <AICareerCompass
              onPathSelect={handleCareerPathSelect}
            />
          </OnboardingLayout>
        );

      // ✅ FIX: Dashboard is now stage 5
      case 5: 
        return <MainContent setStage={setStage} />;

      // ✅ FIX: Resume Analysis is now stage 6
      case 6: 
        return <ResumeAnalysis setStage={setStage} />;

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

      // ✅ NEW: Mentor Matching Quiz is stage 12
      case 12:
        return <MentorMatchingQuiz setStage={setStage} onBack={() => setStage(5)} />;

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
        <TooltipProvider userId={user?.userID || user?.username}>
          <AchievementProvider>
            {renderContent()}
            <TooltipOverlay />
          </AchievementProvider>
        </TooltipProvider>
      </UserContext.Provider>
    </ErrorBoundary>
  );
}

export default App;