import React, { useState, useEffect, createContext, useContext } from 'react';
import { Award, Trophy, Star, X, Compass, FileText, BookOpen, Target, Users } from 'lucide-react';
import { getCurrentStorageUserId } from '../utils/authUtils';

// Achievement Context
const AchievementContext = createContext();

// Achievement Types and Metadata
const ACHIEVEMENTS = {
  // Onboarding Achievements
  PROFILE_CREATED: {
    id: 'profile_created',
    title: 'Getting Started',
    description: 'Created your NxtGrnd profile',
    icon: Users,
    points: 10,
    rarity: 'common'
  },
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
  RESUME_ANALYZED: {
    id: 'resume_analyzed',
    title: 'Resume Expert',
    description: 'Received AI-powered analysis of your resume',
    icon: FileText,
    points: 75,
    rarity: 'uncommon'
  },
  SKILLS_ADDED: {
    id: 'skills_added',
    title: 'Skill Master',
    description: 'Added your first set of skills',
    icon: Target,
    points: 25,
    rarity: 'common'
  },

  // Learning & Growth Achievements
  LEARNING_PATH_STARTED: {
    id: 'learning_path_started',
    title: 'Lifelong Learner',
    description: 'Started your first learning path',
    icon: BookOpen,
    points: 40,
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
  FIVE_COURSES_COMPLETED: {
    id: 'five_courses_completed',
    title: 'Dedicated Student',
    description: 'Completed 5 learning paths',
    icon: BookOpen,
    points: 200,
    rarity: 'epic'
  },
  CERTIFICATION_EARNED: {
    id: 'certification_earned',
    title: 'Certified Professional',
    description: 'Earned your first certification',
    icon: Award,
    points: 150,
    rarity: 'rare'
  },

  // Career Engagement Achievements
  JOB_APPLIED: {
    id: 'job_applied',
    title: 'Taking Action',
    description: 'Applied to your first opportunity',
    icon: Target,
    points: 60,
    rarity: 'uncommon'
  },
  JOB_SAVED: {
    id: 'job_saved',
    title: 'Career Explorer',
    description: 'Saved your first job opportunity',
    icon: Star,
    points: 20,
    rarity: 'common'
  },
  TEN_JOBS_SAVED: {
    id: 'ten_jobs_saved',
    title: 'Opportunity Collector',
    description: 'Saved 10 job opportunities',
    icon: Star,
    points: 80,
    rarity: 'uncommon'
  },

  // Community & Networking Achievements
  NETWORK_MILESTONE: {
    id: 'network_milestone',
    title: 'Community Champion',
    description: 'Joined your first career community',
    icon: Users,
    points: 75,
    rarity: 'uncommon'
  },
  MENTOR_MATCHED: {
    id: 'mentor_matched',
    title: 'Mentorship Seeker',
    description: 'Matched with your first mentor',
    icon: Users,
    points: 120,
    rarity: 'rare'
  },

  // Engagement & Activity Achievements
  DASHBOARD_EXPLORED: {
    id: 'dashboard_explored',
    title: 'Platform Explorer',
    description: 'Explored all dashboard features',
    icon: Compass,
    points: 30,
    rarity: 'common'
  },
  WEEK_STREAK: {
    id: 'week_streak',
    title: 'Committed',
    description: 'Active for 7 consecutive days',
    icon: Trophy,
    points: 100,
    rarity: 'rare'
  },
  MONTH_STREAK: {
    id: 'month_streak',
    title: 'Dedicated',
    description: 'Active for 30 consecutive days',
    icon: Trophy,
    points: 300,
    rarity: 'legendary'
  },

  // Milestone Achievements
  FIRST_GOAL_SET: {
    id: 'first_goal_set',
    title: 'Goal Setter',
    description: 'Set your first career goal',
    icon: Target,
    points: 40,
    rarity: 'common'
  },
  GOAL_COMPLETED: {
    id: 'goal_completed',
    title: 'Goal Achiever',
    description: 'Completed your first career goal',
    icon: Trophy,
    points: 150,
    rarity: 'rare'
  },
  FIVE_GOALS_COMPLETED: {
    id: 'five_goals_completed',
    title: 'Unstoppable',
    description: 'Completed 5 career goals',
    icon: Trophy,
    points: 500,
    rarity: 'legendary'
  }
};

// Achievement Provider Component
export const AchievementProvider = ({ children }) => {
    const [achievements, setAchievements] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [totalPoints, setTotalPoints] = useState(0);
    const [showPopup, setShowPopup] = useState(false);
    const [currentUserId, setCurrentUserId] = useState(null);

    // Get user-scoped storage key
    const getAchievementsKey = (userId) => {
      const uid = userId || currentUserId;
      if (!uid) {
        console.warn('WARNING: No user ID available for achievements');
        return null;
      }
      return `${uid}_achievements`;
    };

    // Monitor user ID changes and reload achievements when user changes
    useEffect(() => {
      const userId = getCurrentStorageUserId();

      // If user changed, reset achievements and reload
      if (userId !== currentUserId) {
        console.log(`RELOADING: User changed from ${currentUserId} to ${userId}, reloading achievements`);
        setCurrentUserId(userId);

        // Clear current achievements when user changes
        setAchievements([]);
        setTotalPoints(0);
        setNotifications([]);

        // Load achievements for new user
        if (userId) {
          const key = getAchievementsKey(userId);
          if (key) {
            const savedAchievements = localStorage.getItem(key);
            if (savedAchievements) {
              try {
                const parsed = JSON.parse(savedAchievements);
                setAchievements(parsed);
                setTotalPoints(calculateTotalPoints(parsed));
                console.log(`SUCCESS: Loaded ${parsed.length} achievements for user ${userId}`);
              } catch (error) {
                console.error('ERROR: Error parsing achievements:', error);
              }
            } else {
              console.log(`INFO: No saved achievements for user ${userId}`);
            }
          }
        }
      }
    }, [currentUserId]); // Re-run when currentUserId changes

    // Check for user changes periodically (in case of login/logout)
    useEffect(() => {
      const interval = setInterval(() => {
        const userId = getCurrentStorageUserId();
        if (userId !== currentUserId) {
          setCurrentUserId(userId);
        }
      }, 1000); // Check every second

      return () => clearInterval(interval);
    }, [currentUserId]);
  
    const calculateTotalPoints = (achievementList) => {
      return achievementList.reduce((total, achievement) => {
        return total + (ACHIEVEMENTS[achievement]?.points || 0);
      }, 0);
    };
  
    const unlockAchievement = (achievementKey) => {
      // Verify user is logged in before unlocking
      if (!currentUserId) {
        console.warn('WARNING: Cannot unlock achievement: No user logged in');
        return;
      }

      // Check if achievement exists
      if (!ACHIEVEMENTS[achievementKey]) {
        console.error(`ERROR: Unknown achievement: ${achievementKey}`);
        return;
      }

      // Check if already unlocked
      if (achievements.includes(achievementKey)) {
        console.log(`INFO: Achievement already unlocked: ${achievementKey}`);
        return;
      }

      const newAchievements = [...achievements, achievementKey];
      setAchievements(newAchievements);

      // Save to user-scoped storage
      const key = getAchievementsKey(currentUserId);
      if (key) {
        localStorage.setItem(key, JSON.stringify(newAchievements));
        console.log(`ACHIEVEMENT: Achievement unlocked for user ${currentUserId}: ${achievementKey}`);
      }

      // Add notification
      const achievement = ACHIEVEMENTS[achievementKey];
      setNotifications(prev => [...prev, {
        id: Date.now(),
        achievement: achievementKey, // Store the key, not the object
        type: 'achievement'
      }]);

      // Update total points
      setTotalPoints(prev => prev + (achievement?.points || 0));
    };
  
    const removeNotification = (notificationId) => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    };
  
    const togglePopup = () => {
      setShowPopup(prev => !prev);
    };

    // Get achievement statistics
    const getStats = () => {
      const total = Object.keys(ACHIEVEMENTS).length;
      const unlocked = achievements.length;
      const locked = total - unlocked;
      const level = Math.floor(totalPoints / 100) + 1;
      const progressToNextLevel = totalPoints % 100;

      const byRarity = achievements.reduce((acc, key) => {
        const rarity = ACHIEVEMENTS[key]?.rarity || 'common';
        acc[rarity] = (acc[rarity] || 0) + 1;
        return acc;
      }, {});

      return {
        total,
        unlocked,
        locked,
        level,
        progressToNextLevel,
        totalPoints,
        byRarity
      };
    };

    // Check if achievement is unlocked
    const isUnlocked = (achievementKey) => {
      return achievements.includes(achievementKey);
    };

    // Get next available achievements (locked ones)
    const getNextAchievements = () => {
      return Object.keys(ACHIEVEMENTS).filter(key => !achievements.includes(key));
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
          togglePopup,
          getStats,
          isUnlocked,
          getNextAchievements
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

const AchievementNotifications = () => {
  const { notifications, removeNotification } = useAchievements();

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map(({ id, achievement, type }) => {
        // Add error handling for undefined or unknown achievements
        const achievementDetails = ACHIEVEMENTS[achievement] || {
          title: 'Unknown Achievement',
          description: 'An achievement was unlocked',
          points: 50,
          icon: Award
        };

        return (
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
              <h4 className="font-medium text-gray-900">{achievementDetails.title}</h4>
              <p className="text-sm text-gray-600">{achievementDetails.description}</p>
              <p className="text-sm font-medium text-yellow-600">+{achievementDetails.points} points</p>
            </div>
            <button
              onClick={() => removeNotification(id)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        );
      })}
    </div>
  );
};

// Achievement Popup Component
const AchievementPopup = () => {
    const { achievements, totalPoints, togglePopup, getStats, getNextAchievements } = useAchievements();
    const [activeTab, setActiveTab] = useState('unlocked');

    const stats = getStats();
    const nextAchievements = getNextAchievements();

    const rarityColors = {
      common: 'text-gray-500 bg-gray-100',
      uncommon: 'text-green-600 bg-green-100',
      rare: 'text-blue-600 bg-blue-100',
      epic: 'text-purple-600 bg-purple-100',
      legendary: 'text-yellow-600 bg-yellow-100'
    };

    return (
      <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Achievements</h2>
            <button
              onClick={togglePopup}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Star className="h-5 w-5 text-yellow-600" />
                <span className="text-sm font-medium text-gray-600">Level</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.level}</span>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-600">Unlocked</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.unlocked}/{stats.total}</span>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Award className="h-5 w-5 text-purple-600" />
                <span className="text-sm font-medium text-gray-600">Points</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.totalPoints}</span>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Target className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-gray-600">Progress</span>
              </div>
              <span className="text-2xl font-bold text-gray-900">{stats.progressToNextLevel}%</span>
            </div>
          </div>

          {/* Level Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">Level {stats.level}</span>
              <span className="text-sm font-medium text-gray-600">Level {stats.level + 1}</span>
            </div>
            <div className="overflow-hidden h-3 rounded-full bg-gray-200">
              <div
                style={{ width: `${stats.progressToNextLevel}%` }}
                className="h-full bg-gradient-to-r from-yellow-400 to-yellow-600 transition-all duration-300"
              ></div>
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              {100 - stats.progressToNextLevel} points to next level
            </p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 border-b">
            <button
              onClick={() => setActiveTab('unlocked')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'unlocked'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Unlocked ({stats.unlocked})
            </button>
            <button
              onClick={() => setActiveTab('locked')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'locked'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Locked ({stats.locked})
            </button>
          </div>

          {/* Achievement List */}
          <div className="space-y-3">
            {activeTab === 'unlocked' && achievements.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Trophy className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No achievements unlocked yet. Start exploring to earn your first!</p>
              </div>
            )}

            {activeTab === 'unlocked' && achievements.map((achievementKey) => {
              const achievement = ACHIEVEMENTS[achievementKey];
              if (!achievement) return null;

              const IconComponent = achievement.icon;
              return (
                <div key={achievementKey} className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-white border border-yellow-200 rounded-lg">
                  <div className="p-3 bg-yellow-100 rounded-full">
                    <IconComponent className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-900">{achievement.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${rarityColors[achievement.rarity]}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-sm font-medium text-yellow-600 mt-1">+{achievement.points} points</p>
                  </div>
                </div>
              );
            })}

            {activeTab === 'locked' && nextAchievements.map((achievementKey) => {
              const achievement = ACHIEVEMENTS[achievementKey];
              if (!achievement) return null;

              const IconComponent = achievement.icon;
              return (
                <div key={achievementKey} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
                  <div className="p-3 bg-gray-200 rounded-full">
                    <IconComponent className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-gray-700">{achievement.title}</h4>
                      <span className={`text-xs px-2 py-1 rounded ${rarityColors[achievement.rarity]}`}>
                        {achievement.rarity}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <p className="text-sm font-medium text-gray-500 mt-1">+{achievement.points} points</p>
                  </div>
                </div>
              );
            })}
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