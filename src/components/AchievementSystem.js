import React, { useState, useEffect, createContext, useContext } from 'react';
import { Award, Trophy, Star, Bell, Check, X,Compass,FileText,BookOpen,Target,Users } from 'lucide-react';

// Achievement Context
const AchievementContext = createContext();

// Achievement Types and Metadata
const ACHIEVEMENTS = {
  CAREER_PATH_SELECTED: {
    id: 'career_path_selected',
    title: 'Career Navigator',
    description: 'Selected your first career path',
    icon: Compass,
    points: 50,
    rarity: 'common'
  },
  RESUME_UPLOADED: {
    id: 'resume_uploaded',
    title: 'Portfolio Builder',
    description: 'Uploaded your professional resume',
    icon: FileText,
    points: 30,
    rarity: 'common'
  },
  LEARNING_PATH_COMPLETED: {
    id: 'learning_path_completed',
    title: 'Knowledge Seeker',
    description: 'Completed your first learning path',
    icon: BookOpen,
    points: 100,
    rarity: 'rare'
  },
  SKILLS_ADDED: {
    id: 'skills_added',
    title: 'Skill Master',
    description: 'Added your first set of skills',
    icon: Target,
    points: 25,
    rarity: 'common'
  },
  NETWORK_MILESTONE: {
    id: 'network_milestone',
    title: 'Community Champion',
    description: 'Joined your first career community',
    icon: Users,
    points: 75,
    rarity: 'uncommon'
  }
};

// Achievement Provider Component
export const AchievementProvider = ({ children }) => {
    const [achievements, setAchievements] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
  
    // Load achievements from localStorage on mount
    useEffect(() => {
      const savedAchievements = localStorage.getItem('achievements');
      if (savedAchievements) {
        const parsed = JSON.parse(savedAchievements);
        setAchievements(parsed);
        setTotalPoints(calculateTotalPoints(parsed));
      }
    }, []);
  
    const calculateTotalPoints = (achievementList) => {
      return achievementList.reduce((total, achievement) => {
        return total + (ACHIEVEMENTS[achievement]?.points || 0);
      }, 0);
    };
  
    const unlockAchievement = (achievementKey) => {
      if (!achievements.includes(achievementKey)) {
        const newAchievements = [...achievements, achievementKey];
        setAchievements(newAchievements);
        localStorage.setItem('achievements', JSON.stringify(newAchievements));
        
        // Add notification
        const achievement = ACHIEVEMENTS[achievementKey];
        setNotifications(prev => [...prev, {
          id: Date.now(),
          achievement: achievement,
          type: 'achievement'
        }]);
        
        // Update total points
        setTotalPoints(prev => prev + (achievement?.points || 0));
      }
    };
  
    const removeNotification = (notificationId) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };
  
    const togglePopup = () => {
      setShowPopup(prev => !prev);
    };
  
    return (
      <AchievementContext.Provider 
        value={{ 
          achievements, 
          unlockAchievement, 
          totalPoints,
          notifications,
          removeNotification,
          showPopup,
          togglePopup
        }}
      >
        {children}
        <AchievementNotifications />
        {showPopup && <AchievementPopup />}
      </AchievementContext.Provider>
    );
  };

// Hook for using achievements
export const useAchievements = () => {
  const context = useContext(AchievementContext);
  if (!context) {
    throw new Error('useAchievements must be used within an AchievementProvider');
  }
  return context;
};

// Achievement Notification Component
const AchievementNotifications = () => {
  const { notifications, removeNotification } = useAchievements();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(({ id, achievement, type }) => (
        <div
          key={id}
          className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-4 shadow-lg 
                   animate-slide-in-right max-w-sm"
          onAnimationEnd={() => {
            setTimeout(() => removeNotification(id), 5000);
          }}
        >
          <div className="p-2 bg-yellow-100 rounded-full">
            <Trophy className="h-6 w-6 text-yellow-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900">{achievement.title}</h4>
            <p className="text-sm text-gray-600">{achievement.description}</p>
            <p className="text-sm font-medium text-yellow-600">+{achievement.points} points</p>
          </div>
          <button
            onClick={() => removeNotification(id)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="h-4 w-4 text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
};

// Achievement Popup Component
const AchievementPopup = () => {
    const { achievements, totalPoints, togglePopup } = useAchievements();
    
    const calculateLevel = (points) => {
      return Math.floor(points / 100) + 1;
    };
  
    const calculateProgress = (points) => {
      return (points % 100);
    };
  
    const level = calculateLevel(totalPoints);
    const progress = calculateProgress(totalPoints);
  
    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Achievements</h2>
            <button
              onClick={togglePopup}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Star className="h-6 w-6 text-yellow-500" />
              <span className="text-xl font-semibold">Level {level}</span>
            </div>
            <div className="relative pt-1">
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${progress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-yellow-500"
                ></div>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600">Progress</span>
                <span className="text-sm font-medium text-gray-600">{progress}%</span>
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Unlocked Achievements</h3>
              <ul className="space-y-2">
                {achievements.map((achievementKey) => {
                  const achievement = ACHIEVEMENTS[achievementKey];
                  return (
                    <li key={achievementKey} className="flex items-center gap-2">
                      <achievement.icon className="h-6 w-6 text-gray-400" />
                      <span>{achievement.title}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default {
    AchievementProvider,
    useAchievements,
    ACHIEVEMENTS
  };