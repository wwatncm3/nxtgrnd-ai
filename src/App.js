import React, { useState, createContext } from 'react';
import ProfileCreation from './components/ProfileCreation';
import InterestSelection from './components/InterestSelection';
import MainContent from './components/MainContent';
import CreatePage from './components/CreatePage';
import SettingsPage from './pages/SettingsPage';
import SavedVideosPage from './pages/SavedVideosPage';
import LikedVideosPage from './pages/LikedVideosPage';
import RepostedVideosPage from './pages/RepostedVideosPage';
import HistoryPage from './pages/HistoryPage';
import CreatorsList from './components/CreatorsList';
import AiCareerCompassPage from './pages/AiCareerCompass';

// Create UserContext to manage global state
export const UserContext = createContext();

// Layout for onboarding stages
const OnboardingLayout = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
    {children}
  </div>
);

function App() {
  const [stage, setStage] = useState(1);
  const [user, setUser] = useState({});

  // Handle stage completion and user data updates
  const handleStageComplete = (newData, nextStage) => {
    // Merge newData into existing user object
    setUser(prev => ({ ...prev, ...newData }));
    setStage(nextStage);
  };

  // Render the appropriate component based on current stage
  const renderContent = () => {
    switch (stage) {
      case 1:
        return (
          <OnboardingLayout>
            <ProfileCreation 
              onNext={(profileData, isLogin = false) => {
                if (isLogin) {
                  // If it's a login, go directly to main content
                  handleStageComplete(profileData, 3);
                } else {
                  // If it's registration, continue to interests selection
                  handleStageComplete(profileData, 2);
                }
              }} 
            />
          </OnboardingLayout>
        );

      case 2:
        return (
          <OnboardingLayout>
            <InterestSelection
              onComplete={(interests) => handleStageComplete({ interests }, 3)}
              initialData={user.interests}
            />
          </OnboardingLayout>
        );

      case 3:
        // Main feed or dashboard
        return <MainContent userData={user} setStage={setStage} />;

      case 4:
        // Creating content
        return (
          <OnboardingLayout>
            <CreatePage />
          </OnboardingLayout>
        );

      case 5:
        // Directly go to SettingsPage (with user data in context)
        return (
          <OnboardingLayout>
            <SettingsPage />
          </OnboardingLayout>
        );

      // Additional pages
      case 6:
        return <HistoryPage setStage={setStage} />;
      case 7:
        return <SavedVideosPage setStage={setStage} />;
      case 8:
        return <LikedVideosPage setStage={setStage} />;
      case 9:
        return <RepostedVideosPage setStage={setStage} />;
      case 10:
        return (
          <OnboardingLayout>
            <CreatorsList setStage={setStage} />
          </OnboardingLayout>
        );
      case 11:
        return (
          <OnboardingLayout>
            <AiCareerCompassPage />
          </OnboardingLayout>
        );

      default:
        return (
          <OnboardingLayout>
            <div className="text-center p-8">
              <h1 className="text-2xl font-bold text-gray-900">Page Not Found</h1>
              <button 
                onClick={() => setStage(1)}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Return Home
              </button>
            </div>
          </OnboardingLayout>
        );
    }
  };

  return (
    <UserContext.Provider value={{ user, setUser, stage, setStage }}>
      {renderContent()}
    </UserContext.Provider>
  );
}

export default App;
