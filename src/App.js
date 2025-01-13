import React, { useState, createContext } from 'react';
import ProfileCreation from './components/ProfileCreation';
import InterestSelection from './components/InterestSelection';
import MainContent from './components/MainContent';
import AICareerCompass from './pages/AiCareerCompass';

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
                handleStageComplete(
                  profileData,
                  isLogin ? 5 : 2 // Login goes to Career Compass, signup continues flow
                );
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
      {renderContent()}
    </UserContext.Provider>
  );
}

export default App;