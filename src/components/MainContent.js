import React, { useState, useContext, useEffect, useMemo } from 'react';
import { signOut } from '@aws-amplify/auth';
import {
  Compass, BookOpen, Award, Users, Building2, FileText, UserPlus, Crown, Shield
} from 'lucide-react';
import { UserContext } from '../App';
import { useSubscription } from '../contexts/SubscriptionContext';
import { storageUtils, STORAGE_KEYS } from '../utils/authUtils';
import { usePageTooltip } from './OnboardingTooltip';
import { FullPageLoader } from './ui/AnimatedComponents';

// Import dashboard components
import {
  DashboardHeader,
  DashboardSidebar,
  LearningPathsSection,
  OpportunitiesSection,
  GoalsSection,
  EventsSection,
  VideoRecommendations,
  SearchResultsInfo,
  storeDashboardData,
  getDashboardFromSession,
  useSearch,
  searchContent,
  generateLearningPaths,
  generateOpportunities,
  generateGoals,
  generateEvents
} from './dashboard';

const MainContent = ({ setStage }) => {
  // Trigger dashboard tooltip for new users
  usePageTooltip('dashboard');
  const { user, setUser } = useContext(UserContext);
  const { isAdmin } = useSubscription();
  const selectedCareerPath = user?.selectedCareerPath;

  // UI State
  const [isDashboardLoading, setIsDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchFilters, setShowSearchFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    learningPaths: true,
    opportunities: true,
    goals: true,
    events: true
  });

  // Loading states
  const [isLearningPathsLoading, setIsLearningPathsLoading] = useState(true);
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true);
  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(true);

  // Data states
  const [personalizedLearningPaths, setPersonalizedLearningPaths] = useState([]);
  const [personalizedOpportunities, setPersonalizedOpportunities] = useState([]);
  const [personalizedGoals, setPersonalizedGoals] = useState([]);
  const [personalizedEvents, setPersonalizedEvents] = useState([]);

  // Progress tracking
  const [lastCareerPath, setLastCareerPath] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});

  // Load career path from storage if not in context
  useEffect(() => {
    if (!user?.selectedCareerPath && user?.userID) {
      const storedCareerPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH);
      if (storedCareerPath) {
        setUser(prev => ({
          ...prev,
          selectedCareerPath: storedCareerPath
        }));
      }
    }
  }, [user?.userID, user?.selectedCareerPath, setUser]);

  // Enhanced search with debouncing
  const debouncedSearchQuery = useSearch(searchQuery);

  // Memoized search results
  const searchResults = useMemo(() => {
    const results = searchContent(
      debouncedSearchQuery,
      personalizedLearningPaths,
      personalizedOpportunities,
      personalizedGoals,
      personalizedEvents
    );

    // Apply content type filters
    return {
      learningPaths: searchFilters.learningPaths ? results.learningPaths : [],
      opportunities: searchFilters.opportunities ? results.opportunities : [],
      goals: searchFilters.goals ? results.goals : [],
      events: searchFilters.events ? results.events : [],
      totalResults: (searchFilters.learningPaths ? results.learningPaths.length : 0) +
                   (searchFilters.opportunities ? results.opportunities.length : 0) +
                   (searchFilters.goals ? results.goals.length : 0) +
                   (searchFilters.events ? results.events.length : 0),
      hasResults: results.hasResults
    };
  }, [
    debouncedSearchQuery,
    personalizedLearningPaths,
    personalizedOpportunities,
    personalizedGoals,
    personalizedEvents,
    searchFilters
  ]);

  // Clear search function
  const clearSearch = () => {
    setSearchQuery('');
    setShowSearchFilters(false);
  };

  // Progress tracking function - uses course title as key for persistence across sessions
  const markTaskComplete = (courseIndex, taskType) => {
    const course = personalizedLearningPaths[courseIndex];
    if (!course) return;

    // Use course title as stable key (persists even when course order changes)
    const courseKey = course.title.replace(/\s+/g, '_').toLowerCase();
    const taskKey = `${courseKey}-${taskType}`;

    setCompletedTasks(prev => {
      const newCompletedTasks = {
        ...prev,
        [taskKey]: !prev[taskKey]
      };

      // Calculate progress based on completed tasks for this course
      const totalTasks = (course.resources?.length || 0) + 1;
      const completedCount = Object.keys(newCompletedTasks).filter(key =>
        key.startsWith(`${courseKey}-`) && newCompletedTasks[key]
      ).length;

      const newProgress = Math.round((completedCount / totalTasks) * 100);
      setCourseProgress(prevProgress => ({
        ...prevProgress,
        [courseKey]: newProgress
      }));

      return newCompletedTasks;
    });
  };

  // Helper to get progress for a course by title
  const getCourseProgress = (course) => {
    if (!course) return 0;
    const courseKey = course.title.replace(/\s+/g, '_').toLowerCase();
    return courseProgress[courseKey] || 0;
  };

  // Helper to check if a task is completed by course title
  const isTaskCompleted = (course, taskType) => {
    if (!course) return false;
    const courseKey = course.title.replace(/\s+/g, '_').toLowerCase();
    return completedTasks[`${courseKey}-${taskType}`] || false;
  };

  // Click outside handler for sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isSidebarOpen && window.innerWidth < 1024) {
        const sidebar = document.getElementById('mobile-sidebar');
        const menuButton = document.getElementById('mobile-menu-button');

        if (sidebar && !sidebar.contains(event.target) &&
            menuButton && !menuButton.contains(event.target)) {
          setIsSidebarOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isSidebarOpen]);

  // Load saved progress
  useEffect(() => {
    const savedProgress = storageUtils.getItem(STORAGE_KEYS.COURSE_PROGRESS);
    const savedTasks = storageUtils.getItem(STORAGE_KEYS.COMPLETED_TASKS);

    if (savedProgress) {
      setCourseProgress(savedProgress);
    }
    if (savedTasks) {
      setCompletedTasks(savedTasks);
    }
  }, [user?.userID]);

  // Save course progress
  useEffect(() => {
    if (user?.userID && Object.keys(courseProgress).length > 0) {
      storageUtils.setItem(STORAGE_KEYS.COURSE_PROGRESS, courseProgress);
    }
  }, [courseProgress, user?.userID]);

  // Save completed tasks
  useEffect(() => {
    if (user?.userID && Object.keys(completedTasks).length > 0) {
      storageUtils.setItem(STORAGE_KEYS.COMPLETED_TASKS, completedTasks);
    }
  }, [completedTasks, user?.userID]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Clear session marker (keeps user data for when they log back in)
      storageUtils.clearAllUserData();
      sessionStorage.clear();
      setUser(null);
      setStage(1);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Content loaders
  const loadLearningPaths = async () => {
    setIsLearningPathsLoading(true);
    try {
      const paths = await generateLearningPaths(user, selectedCareerPath);
      return paths;
    } catch (error) {
      console.error('Error loading learning paths:', error);
      return [];
    } finally {
      setIsLearningPathsLoading(false);
    }
  };

  const loadOpportunities = async () => {
    setIsOpportunitiesLoading(true);
    try {
      const opportunities = await generateOpportunities(user, selectedCareerPath);
      return opportunities;
    } catch (error) {
      console.error('Error loading opportunities:', error);
      return [];
    } finally {
      setIsOpportunitiesLoading(false);
    }
  };

  const loadGoals = async () => {
    setIsGoalsLoading(true);
    try {
      const goals = await generateGoals(user, selectedCareerPath);
      return goals;
    } catch (error) {
      console.error('Error loading goals:', error);
      return [];
    } finally {
      setIsGoalsLoading(false);
    }
  };

  const loadEvents = async () => {
    setIsEventsLoading(true);
    try {
      const events = await generateEvents(user, selectedCareerPath);
      return events;
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    } finally {
      setIsEventsLoading(false);
    }
  };

  const loadPersonalizedContent = async (forceRefresh = false) => {
    setIsDashboardLoading(true);
    setDashboardError(null);

    try {
      if (!forceRefresh) {
        const storedDashboard = getDashboardFromSession(user.userID, selectedCareerPath);
        if (storedDashboard) {
          setPersonalizedLearningPaths(storedDashboard.learningPaths);
          setPersonalizedOpportunities(storedDashboard.opportunities);
          setPersonalizedGoals(storedDashboard.goals);
          setPersonalizedEvents(storedDashboard.events);
          setIsDashboardLoading(false);
          return;
        }
      }
      const learningPaths = await loadLearningPaths();
      const opportunities = await loadOpportunities();
      const goals = await loadGoals();
      const events = await loadEvents();

      if (learningPaths && opportunities) {
        const dashboardData = {
          learningPaths,
          opportunities,
          goals,
          events,
          careerPath: selectedCareerPath,
          timestamp: new Date().toISOString()
        };

        storeDashboardData(user.userID, dashboardData);

        setPersonalizedLearningPaths(learningPaths);
        setPersonalizedOpportunities(opportunities);
        setPersonalizedGoals(goals);
        setPersonalizedEvents(events);

        setLastCareerPath(selectedCareerPath);
      } else {
        throw new Error('Failed to load essential career data');
      }
    } catch (error) {
      console.error('Error loading personalized content:', error);
      setDashboardError('Unable to load some personalized content. Please try refreshing or contact support.');
    } finally {
      setIsDashboardLoading(false);
    }
  };

  // Main effect to load dashboard data
  useEffect(() => {
    // If no career path selected, check storage first before redirecting
    if (!user?.selectedCareerPath && user?.userID) {
      const storedCareerPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH);
      if (storedCareerPath) {
        // Let the other useEffect handle updating context
        return;
      }
      setStage(4);
      return;
    }

    // Early return if no user or career path
    if (!user?.userID || !selectedCareerPath) {
      setIsDashboardLoading(false);
      return;
    }

    const currentCareerPathId = selectedCareerPath?.id || selectedCareerPath?.title;
    const lastCareerPathId = lastCareerPath?.id || lastCareerPath?.title;

    // Check if career path has changed (but not on first load when lastCareerPath is null)
    if (lastCareerPath !== null && currentCareerPathId !== lastCareerPathId) {
      // Clear existing data
      setPersonalizedLearningPaths([]);
      setPersonalizedOpportunities([]);
      setPersonalizedGoals([]);
      setPersonalizedEvents([]);

      // Update last career path immediately
      setLastCareerPath(selectedCareerPath);

      // Force refresh
      loadPersonalizedContent(true);
      return;
    }

    // Check for existing dashboard data
    const storedDashboard = getDashboardFromSession(user.userID, selectedCareerPath);

    if (storedDashboard) {
      setPersonalizedLearningPaths(storedDashboard.learningPaths || []);
      setPersonalizedOpportunities(storedDashboard.opportunities || []);
      setPersonalizedGoals(storedDashboard.goals || []);
      setPersonalizedEvents(storedDashboard.events || []);

      // Update loading states
      setIsDashboardLoading(false);
      setIsLearningPathsLoading(false);
      setIsOpportunitiesLoading(false);
      setIsGoalsLoading(false);
      setIsEventsLoading(false);

      // Set last career path if this is the first load
      if (lastCareerPath === null) {
        setLastCareerPath(selectedCareerPath);
      }
    } else {
      // Set last career path before loading
      setLastCareerPath(selectedCareerPath);
      loadPersonalizedContent(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.selectedCareerPath, user?.userID]);

  // Initialize lastCareerPath on component mount
  useEffect(() => {
    if (lastCareerPath === null && selectedCareerPath) {
      setLastCareerPath(selectedCareerPath);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigation items
  const navigationItems = [
    {
      icon: Compass,
      label: 'Career Compass',
      onClick: () => setStage(4)
    },
    {
      icon: BookOpen,
      label: 'Learning Paths',
      onClick: () => {
        if (personalizedLearningPaths.length || personalizedOpportunities.length) {
          storeDashboardData(user?.userID, {
            learningPaths: personalizedLearningPaths,
            opportunities: personalizedOpportunities,
            goals: personalizedGoals,
            events: personalizedEvents,
            careerPath: user.selectedCareerPath
          });
        }
        setStage(9);
      }
    },
    {
      icon: FileText,
      label: 'Resume Analysis',
      proOnly: true,
      onClick: () => {
        const storedResume = storageUtils.getItem(STORAGE_KEYS.USER_RESUME);
        if (!storedResume) {
          alert('Please upload your resume first to access the analysis.');
          setStage(6);
          return;
        }
        if (personalizedLearningPaths.length || personalizedOpportunities.length) {
          storeDashboardData(user?.userID, {
            learningPaths: personalizedLearningPaths,
            opportunities: personalizedOpportunities,
            goals: personalizedGoals,
            events: personalizedEvents,
            careerPath: user.selectedCareerPath
          });
        }
        setStage(6);
      }
    },
    {
      icon: Building2,
      label: 'Jobs & Projects',
      onClick: () => {
        if (personalizedLearningPaths.length || personalizedOpportunities.length) {
          storeDashboardData(user?.userID, {
            learningPaths: personalizedLearningPaths,
            opportunities: personalizedOpportunities,
            goals: personalizedGoals,
            events: personalizedEvents,
            careerPath: user.selectedCareerPath
          });
        }
        setStage(10);
      }
    },
    {
      icon: Users,
      label: 'Creator Profile',
      onClick: () => setStage(7)
    },
    {
      icon: Award,
      label: 'Certifications',
      onClick: () => {
        if (personalizedLearningPaths.length || personalizedOpportunities.length) {
          storeDashboardData(user?.userID, {
            learningPaths: personalizedLearningPaths,
            opportunities: personalizedOpportunities,
            goals: personalizedGoals,
            events: personalizedEvents,
            careerPath: user.selectedCareerPath
          });
        }
        setStage(11);
      }
    },
    {
      icon: UserPlus,
      label: 'Find Mentors',
      proOnly: true,
      onClick: () => {
        if (personalizedLearningPaths.length || personalizedOpportunities.length) {
          storeDashboardData(user?.userID, {
            learningPaths: personalizedLearningPaths,
            opportunities: personalizedOpportunities,
            goals: personalizedGoals,
            events: personalizedEvents,
            careerPath: user.selectedCareerPath
          });
        }
        setStage(12);
      }
    },
    {
      icon: Crown,
      label: 'Upgrade to Pro',
      highlight: true,
      onClick: () => setStage(13)
    },
    ...(isAdmin ? [{
      icon: Shield,
      label: 'Admin Panel',
      adminOnly: true,
      onClick: () => setStage(14)
    }] : [])
  ];

  // Loading state
  if (isDashboardLoading) {
    return (
      <FullPageLoader
        message="Building Your Dashboard"
        subMessage={`Personalizing your ${selectedCareerPath?.title || 'career'} journey`}
        icon={Compass}
      />
    );
  }

  // Error state
  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center animate-scale-in bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4 text-sm sm:text-base">{dashboardError}</p>
          <button
            onClick={() => loadPersonalizedContent(true)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 hover:shadow-lg active:scale-95 font-medium"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-50">
      <DashboardHeader
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        showSearchFilters={showSearchFilters}
        setShowSearchFilters={setShowSearchFilters}
        searchFilters={searchFilters}
        setSearchFilters={setSearchFilters}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
        setStage={setStage}
        handleLogout={handleLogout}
        clearSearch={clearSearch}
      />

      <div className="flex relative">
        <DashboardSidebar
          isSidebarOpen={isSidebarOpen}
          setIsSidebarOpen={setIsSidebarOpen}
          navigationItems={navigationItems}
        />

        {/* Main Content */}
        <main className="flex-1 min-h-screen animate-fade-in">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Title Section */}
              <div className="mb-6 sm:mb-8 animate-slide-up">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                      Welcome {user?.firstName ? `${user.firstName}` : 'back'} to your {selectedCareerPath.title} Dashboard!
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-gray-600">
                      Your personalized roadmap to becoming a {selectedCareerPath.title}
                    </p>
                  </div>
                  <button
                    onClick={() => setStage(4)}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 w-full sm:w-auto transition-all duration-200 hover:shadow-md hover:border-blue-300 active:scale-95 group"
                  >
                    <Compass className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45" />
                    Change Career Path
                  </button>
                </div>
              </div>

              {/* Search Results Info */}
              <SearchResultsInfo
                searchQuery={debouncedSearchQuery}
                totalResults={searchResults.totalResults}
                hasResults={searchResults.hasResults}
              />

              {/* Dashboard Grid */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Content Area */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                  <LearningPathsSection
                    searchResults={searchResults}
                    searchFilters={searchFilters}
                    debouncedSearchQuery={debouncedSearchQuery}
                    isLoading={isLearningPathsLoading}
                    personalizedLearningPaths={personalizedLearningPaths}
                    courseProgress={courseProgress}
                    completedTasks={completedTasks}
                    markTaskComplete={markTaskComplete}
                    getCourseProgress={getCourseProgress}
                    isTaskCompleted={isTaskCompleted}
                    onViewAll={() => {
                      if (personalizedLearningPaths.length || personalizedOpportunities.length) {
                        storeDashboardData(user?.userID, {
                          learningPaths: personalizedLearningPaths,
                          opportunities: personalizedOpportunities,
                          goals: personalizedGoals,
                          events: personalizedEvents,
                          careerPath: user.selectedCareerPath
                        });
                      }
                      setStage(9);
                    }}
                  />

                  <OpportunitiesSection
                    searchResults={searchResults}
                    searchFilters={searchFilters}
                    debouncedSearchQuery={debouncedSearchQuery}
                    isLoading={isOpportunitiesLoading}
                    onRefresh={() => loadPersonalizedContent(true)}
                  />
                </div>

                {/* Sidebar Content */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Video Recommendations */}
                  <VideoRecommendations
                    careerPath={selectedCareerPath}
                    maxVideos={3}
                  />

                  <GoalsSection
                    searchResults={searchResults}
                    searchFilters={searchFilters}
                    debouncedSearchQuery={debouncedSearchQuery}
                    isLoading={isGoalsLoading}
                  />

                  <EventsSection
                    searchResults={searchResults}
                    searchFilters={searchFilters}
                    debouncedSearchQuery={debouncedSearchQuery}
                    isLoading={isEventsLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainContent;
