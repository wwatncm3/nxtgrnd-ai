import React, { useState, createContext, useEffect } from 'react';
import { getCurrentUser, fetchUserAttributes, signOut } from '@aws-amplify/auth';
import ProfileCreation from './components/ProfileCreation';
import InterestSelection from './components/InterestSelection';
import MainContent from './components/MainContent';
import AICareerCompass from './pages/AiCareerCompass';
import ResumeAnalysis from './components/ResumeAnalysis';
import { AchievementProvider } from './components/AchievementSystem';


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
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on app load
  useEffect(() => {
    localStorage.clear();
  sessionStorage.clear();
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const cognitoUser = await getCurrentUser();
      const userAttributes = await fetchUserAttributes();
      
      // Convert Cognito attributes to user object
      const userData = {
        username: cognitoUser.username,
        email: userAttributes.email,
        firstName: userAttributes.given_name,
        lastName: userAttributes.family_name,
      };
      
      setUser(userData);
      setStage(6); // Go to dashboard if authenticated
    } catch (error) {
      console.log('User is not authenticated');
      setStage(1); // Go to login/signup if not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const handleStageComplete = (newData, nextStage) => {
    // Update user data if provided
    if (newData) {
      setUser(prev => ({ ...prev, ...newData }));
    }
    // Move to next stage
    setStage(nextStage);
  };


  const handleCareerPathSelect = (path) => {
    setSelectedCareerPath(path);
    // When a career path is selected, update user data and move to dashboard
    setUser(prev => ({
      ...prev,
      selectedCareerPath: path
    }));
    handleStageComplete(null, 6); // Move to dashboard after path selection
  };

  const renderContent = () => {
    switch (stage) {
      case 1: // Account Creation
  return (
    <OnboardingLayout>
      <ProfileCreation 
        onNext={(profileData, isLogin = false) => {
          // If it's a login and we have a selectedCareerPath, go to dashboard
          // Otherwise for new accounts or login without career path, continue to interest selection
          if (isLogin && profileData.selectedCareerPath) {
            console.log('Login flow - navigating to dashboard');
            handleStageComplete(profileData, 6); // Go directly to dashboard
          } else {
            console.log('Signup flow or login without career path - continuing to interest selection');
            handleStageComplete(profileData, 3); // Continue to interest selection
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

      case 3: // Skills Selection
        return (
          <OnboardingLayout>
            <InterestSelection
              onComplete={(data) => handleStageComplete(data, 4)}
              initialData={user}
            />
          </OnboardingLayout>
        );

      case 4: // Resume Upload
        return (
          <OnboardingLayout>
            <InterestSelection
              step={2}
              onComplete={(data) => handleStageComplete(data, 5)}
              initialData={user}
            />
          </OnboardingLayout>
        );

      case 5: // AI Career Compass
        return (
          <OnboardingLayout>
            <AICareerCompass
              onPathSelect={handleCareerPathSelect}
            />
          </OnboardingLayout>
        );

        case 6: // Personalized Dashboard
        return (
          <MainContent 
            userData={user}
            selectedCareerPath={selectedCareerPath}
            setStage={setStage}
          />
        );
  
      case 7: // Resume Analysis
        return (
          <OnboardingLayout>
            <ResumeAnalysis setStage={setStage} />
          </OnboardingLayout>
        );

      default:
        return (
          <OnboardingLayout>
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
              <button 
                onClick={() => handleStageComplete(null, 1)}
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
    <UserContext.Provider value={{ 
      user, 
      setUser, 
      stage, 
      setStage,
      selectedCareerPath,
      setSelectedCareerPath 
    }}>
      <AchievementProvider>
        {renderContent()}
      </AchievementProvider>
    </UserContext.Provider>
  );
}

export default App;