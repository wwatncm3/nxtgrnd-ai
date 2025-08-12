import React, { useState, useContext, useEffect, useMemo } from 'react';
import { signOut } from '@aws-amplify/auth';
import { 
  Compass, BookOpen, Target, Award, Users, Menu, 
  UserCircle, BellIcon, Search, Building2, 
  Calendar, Link, Star, Clock, ArrowRight, FileText,
  RefreshCw, ChevronRight, MapPin, CircleDollarSign, X,
  Settings, LogOut, User, Filter
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';

// Add these at the top of MainContent component
const USER_DASHBOARD_KEY = 'userDashboard';

const storeDashboardData = (userId, data) => {
  if (!userId) return;
  try {
    const dashboardData = {
      learningPaths: data.learningPaths || [],
      opportunities: data.opportunities || [],
      goals: data.goals || [],
      events: data.events || [],
      timestamp: new Date().toISOString(),
      careerPath: data.careerPath,
      careerPathId: data.careerPath?.id
    };
    storageUtils.setItem(
      `${USER_DASHBOARD_KEY}_${userId}`,
      JSON.stringify(dashboardData)
    );
    console.log('Dashboard data stored:', dashboardData);
  } catch (err) {
    console.error('Error storing dashboard data:', err);
  }
};

const getDashboardFromSession = (userId, currentCareerPath) => {
  try {
    const stored = storageUtils.getItem(`${USER_DASHBOARD_KEY}_${userId}`);
    if (stored) {
      const dashboardData = JSON.parse(stored);
      
      const storedCareerPathId = dashboardData.careerPath?.id || dashboardData.careerPath?.title;
      const currentCareerPathId = currentCareerPath?.id || currentCareerPath?.title;
      
      if (storedCareerPathId === currentCareerPathId) {
        console.log('Dashboard data matches current career path');
        return dashboardData;
      } else {
        console.log('Career path changed, clearing old dashboard data', {
          stored: storedCareerPathId,
          current: currentCareerPathId
        });
        storageUtils.removeItem(`${USER_DASHBOARD_KEY}_${userId}`);
        return null;
      }
    }
  } catch (err) {
    console.error('Error reading dashboard from session:', err);
  }
  return null;
};

// Enhanced Search Hook with debouncing
const useSearch = (searchQuery, data, delay = 300) => {
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, delay);

    return () => clearTimeout(timer);
  }, [searchQuery, delay]);

  return debouncedQuery;
};

// Comprehensive Search Function
const searchContent = (query, learningPaths, opportunities, goals, events) => {
  if (!query || query.trim().length < 2) {
    return {
      learningPaths,
      opportunities, 
      goals,
      events,
      totalResults: learningPaths.length + opportunities.length + goals.length + events.length,
      hasResults: true
    };
  }

  const searchTerm = query.toLowerCase().trim();
  
  // Search Learning Paths (including nested resources)
  const filteredLearningPaths = learningPaths.filter(path => {
    const titleMatch = path.title?.toLowerCase().includes(searchTerm);
    const providerMatch = path.provider?.toLowerCase().includes(searchTerm);
    const descriptionMatch = path.description?.toLowerCase().includes(searchTerm);
    const skillsMatch = path.skills?.some(skill => skill.toLowerCase().includes(searchTerm));
    const lessonMatch = path.nextLesson?.toLowerCase().includes(searchTerm);
    
    // Search within resources
    const resourceMatch = path.resources?.some(resource => 
      resource.title?.toLowerCase().includes(searchTerm) ||
      resource.provider?.toLowerCase().includes(searchTerm) ||
      resource.description?.toLowerCase().includes(searchTerm) ||
      resource.type?.toLowerCase().includes(searchTerm)
    );
    
    return titleMatch || providerMatch || descriptionMatch || skillsMatch || lessonMatch || resourceMatch;
  });

  // Search Opportunities
  const filteredOpportunities = opportunities.filter(opp => {
    const roleMatch = opp.role?.toLowerCase().includes(searchTerm);
    const companyMatch = opp.company?.toLowerCase().includes(searchTerm);
    const locationMatch = opp.location?.toLowerCase().includes(searchTerm);
    const descriptionMatch = opp.description?.toLowerCase().includes(searchTerm);
    
    return roleMatch || companyMatch || locationMatch || descriptionMatch;
  });

  // Search Goals
  const filteredGoals = goals.filter(goal => {
    const titleMatch = goal.title?.toLowerCase().includes(searchTerm);
    const descriptionMatch = goal.description?.toLowerCase().includes(searchTerm);
    
    return titleMatch || descriptionMatch;
  });

  // Search Events
  const filteredEvents = events.filter(event => {
    const titleMatch = event.title?.toLowerCase().includes(searchTerm);
    const descriptionMatch = event.description?.toLowerCase().includes(searchTerm);
    const providerMatch = event.provider?.toLowerCase().includes(searchTerm);
    
    return titleMatch || descriptionMatch || providerMatch;
  });

  const totalResults = filteredLearningPaths.length + filteredOpportunities.length + 
                      filteredGoals.length + filteredEvents.length;
  analytics.trackSearchPerformed(query, totalResults);
  return {
    learningPaths: filteredLearningPaths,
    opportunities: filteredOpportunities,
    goals: filteredGoals, 
    events: filteredEvents,
    totalResults,
    hasResults: totalResults > 0
  };
};

// Search Result Highlighter Component
const HighlightText = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);
  
  return (
    <>
      {parts.map((part, index) => 
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// Search Results Info Component  
const SearchResultsInfo = ({ searchQuery, totalResults, hasResults }) => {
  if (!searchQuery || searchQuery.length < 2) return null;
  
  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-600" />
          <span className="text-blue-900 text-sm font-medium">
            {hasResults 
              ? `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}"`
              : `No results found for "${searchQuery}"`
            }
          </span>
        </div>
        {!hasResults && (
          <div className="text-blue-700 text-xs">
            Try different keywords or check spelling
          </div>
        )}
      </div>
    </div>
  );
};

// Resource Card Component with Search Highlighting
const ResourceCard = ({ resource, searchTerm }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'course':
        return <BookOpen className="h-5 w-5" />;
      case 'tutorial':
        return <BookOpen className="h-5 w-5" />;
      case 'certification':
        return <Award className="h-5 w-5" />;
      case 'community':
        return <Users className="h-5 w-5" />;
      case 'resource':
        return <Link className="h-5 w-5" />;
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  const renderMetadata = () => {
    switch (resource.type) {
      case 'course':
        return (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
            {resource.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                {resource.rating}
              </span>
            )}
            {resource.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {resource.duration}
              </span>
            )}
            {resource.provider && (
              <span><HighlightText text={resource.provider} searchTerm={searchTerm} /></span>
            )}
          </div>
        );
      
      case 'certification':
        return (
          <div className="mt-2 text-sm text-gray-500">
            {resource.examCode && <div>Exam Code: {resource.examCode}</div>}
            {resource.preparationTime && <div>Prep Time: {resource.preparationTime}</div>}
          </div>
        );
      
      case 'community':
        return (
          <div className="mt-2 text-sm text-gray-500">
            {resource.platform && (
              <div>Platform: <HighlightText text={resource.platform} searchTerm={searchTerm} /></div>
            )}
            {resource.memberCount && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {resource.memberCount.toLocaleString()} members
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 sm:p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
          {getIconForType(resource.type)}
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-medium text-blue-600 truncate text-sm sm:text-base">
            <HighlightText text={resource.title} searchTerm={searchTerm} />
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            <HighlightText text={resource.description} searchTerm={searchTerm} />
          </p>
          {renderMetadata()}
        </div>
        <div className="flex-shrink-0 self-center">
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
        </div>
      </div>
    </a>
  );
};

const MainContent = ({ setStage }) => {
  const { user, setUser } = useContext(UserContext);
  const selectedCareerPath = user?.selectedCareerPath;
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
  
  const [isLearningPathsLoading, setIsLearningPathsLoading] = useState(true);
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true);
  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  
  const [personalizedLearningPaths, setPersonalizedLearningPaths] = useState([]);
  const [personalizedOpportunities, setPersonalizedOpportunities] = useState([]);
  const [personalizedGoals, setPersonalizedGoals] = useState([]);
  const [personalizedEvents, setPersonalizedEvents] = useState([]);

  const [lastCareerPath, setLastCareerPath] = useState(null);
  const [courseProgress, setCourseProgress] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});

  // Enhanced search with debouncing
  const debouncedSearchQuery = useSearch(searchQuery, personalizedLearningPaths);
  
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

  // Progress tracking function
  const markTaskComplete = (courseId, taskType) => {
    const taskKey = `${courseId}-${taskType}`;
    setCompletedTasks(prev => {
      const newCompletedTasks = {
        ...prev,
        [taskKey]: !prev[taskKey]
      };

      if (newCompletedTasks[taskKey]) {
      const course = personalizedLearningPaths[courseId];
      analytics.trackTaskCompleted(course?.title || 'Unknown Course', taskType);
    }
      const course = personalizedLearningPaths.find((c, i) => i === courseId);
      if (course) {
        const totalTasks = (course.resources?.length || 0) + 1;
        const completedCount = Object.keys(newCompletedTasks).filter(key => 
          key.startsWith(`${courseId}-`) && newCompletedTasks[key]
        ).length;
        
        const newProgress = Math.round((completedCount / totalTasks) * 100);
        setCourseProgress(prevProgress => ({
          ...prevProgress,
          [courseId]: newProgress
        }));
      }
      
      return newCompletedTasks;
    });
  };

  // All existing useEffect hooks and functions remain the same...
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

  useEffect(() => {
    const savedProgress = storageUtils.getItem(`courseProgress_${user?.userID}`);
    const savedTasks = storageUtils.getItem(`completedTasks_${user?.userID}`);
    
    if (savedProgress) {
      setCourseProgress(JSON.parse(savedProgress));
    }
    if (savedTasks) {
      setCompletedTasks(JSON.parse(savedTasks));
    }
  }, [user?.userID]);

  useEffect(() => {
    if (user?.userID && Object.keys(courseProgress).length > 0) {
      storageUtils.setItem(`courseProgress_${user.userID}`, JSON.stringify(courseProgress));
    }
  }, [courseProgress, user?.userID]);

  useEffect(() => {
    if (user?.userID && Object.keys(completedTasks).length > 0) {
      storageUtils.setItem(`completedTasks_${user.userID}`, JSON.stringify(completedTasks));
    }
  }, [completedTasks, user?.userID]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Only clear sessionStorage, keep localStorage for persistence
      sessionStorage.clear();
      setUser(null);
      setStage(1);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // All existing API functions remain the same (generateLearningPaths, generateOpportunities, etc.)
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
  
  const generateLearningPaths = async (user, selectedCareerPath) => {
    console.log('Generating learning paths for career:', selectedCareerPath.title);
    try {
      const recommendationPayload = {
        userId: user.userID,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        careerPath: selectedCareerPath.title,
        pathType: 'learning_paths',
        experienceLevel: user?.experienceLevel || user?.careerStage || 'entry',
        includeEnhancedDetails: true,
        skills: selectedCareerPath.requiredSkills || [],
        interests: Array.isArray(user?.interests) ? user.interests : [],
        requestDetails: {
          requestType: 'learning_resources',
          generateLinks: true,
          categories: ['onlineCourses', 'certifications', 'tutorials', 'communities', 'professionalResources']
        }
      };
  
      const response = await fetch(
        'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/recommendations/generate',
            body: JSON.stringify(recommendationPayload)
          })
        }
      );
  
      const data = await response.json();
      console.log('Learning paths raw response:', data);
  
      if (data.body) {
        const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        console.log('Learning paths parsed body:', parsedBody);
  
        const recommendations = parsedBody.recommendations || {};
        console.log('Extracted recommendations:', recommendations);
  
        const learningPaths = [];
  
        if (recommendations.careerPaths && recommendations.careerPaths.length > 0) {
          const mainPath = recommendations.careerPaths[0];
          learningPaths.push({
            title: `${selectedCareerPath.title} Core Skills`,
            progress: 0,
            provider: "CareerDay Pro",
            nextLesson: "Fundamentals",
            description: mainPath.description || "Master the essential skills required for your role",
            skills: mainPath.requiredSkills || [],
            resources: [
              {
                type: 'course',
                title: 'LinkedIn Learning Path',
                url: `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(selectedCareerPath.title)}`,
                provider: 'LinkedIn Learning',
                description: 'Professional courses for your career path',
                rating: 4.5,
                duration: '20-30 hours'
              },
              {
                type: 'tutorial',
                title: 'Online Training',
                url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(selectedCareerPath.title)}`,
                provider: 'Udemy',
                description: 'Hands-on tutorials and projects',
                difficulty: 'Beginner to Advanced'
              }
            ]
          });
  
          learningPaths.push({
            title: "Professional Development",
            progress: 0,
            provider: "CareerDay Pro",
            nextLesson: "Industry Standards",
            description: "Enhance your professional capabilities",
            resources: [
              {
                type: 'community',
                title: 'Professional Network',
                url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(selectedCareerPath.title)}`,
                platform: 'Meetup',
                description: 'Join local professional groups',
                memberCount: 5000
              },
              {
                type: 'resource',
                title: 'Industry News & Updates',
                url: `https://news.google.com/search?q=${encodeURIComponent(selectedCareerPath.title)}+industry+news`,
                provider: 'Google News',
                description: 'Stay updated with industry trends',
                category: 'News'
              }
            ]
          });
  
          if (mainPath.recommendedCertifications) {
            mainPath.recommendedCertifications.forEach(cert => {
              learningPaths.push({
                title: cert.name,
                progress: 0,
                provider: cert.provider || "Industry Standard",
                nextLesson: "Certification Basics",
                description: `Prepare for ${cert.name} certification`,
                resources: [
                  {
                    type: 'certification',
                    title: `${cert.name} Official Prep`,
                    url: `https://www.coursera.org/search?query=${encodeURIComponent(cert.name)}`,
                    provider: 'Coursera',
                    description: 'Official certification preparation course',
                    examCode: cert.code || 'TBD',
                    preparationTime: cert.timeframe || '3-6 months'
                  },
                  {
                    type: 'community',
                    title: 'Study Group',
                    url: `https://www.reddit.com/r/certification/search/?q=${encodeURIComponent(cert.name)}`,
                    platform: 'Reddit',
                    description: 'Join certification study groups',
                    memberCount: 10000
                  }
                ]
              });
            });
          }
        }
  
        console.log('Generated learning paths:', learningPaths);
        return learningPaths;
      }
  
      throw new Error('No valid learning paths found');
  
    } catch (error) {
      console.error('Error in generateLearningPaths:', error);
      return [{
        title: `${selectedCareerPath.title} Fundamentals`,
        progress: 0,
        provider: "CareerDay Pro",
        nextLesson: "Introduction to " + selectedCareerPath.title,
        description: `Essential skills and knowledge for ${selectedCareerPath.title}`,
        resources: [
          {
            type: 'course',
            title: 'Getting Started',
            url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(selectedCareerPath.title)}+fundamentals`,
            provider: 'Udemy',
            description: 'Foundational concepts and skills',
            rating: 4.0,
            duration: '10-15 hours'
          }
        ]
      }];
    }
  };
  
  const generateOpportunities = async (user, selectedCareerPath) => {
    console.log('Generating opportunities for career:', selectedCareerPath.title);
    try {
      const recommendationPayload = {
        userId: user.userID,
        firstName: user?.firstName,
        lastName: user?.lastName,
        email: user?.email,
        careerPath: selectedCareerPath.title,
        pathType: 'opportunities',
        experienceLevel: user?.experienceLevel || user?.careerStage || 'entry',
        includeEnhancedDetails: true,
        skills: selectedCareerPath.requiredSkills || [],
        interests: Array.isArray(user?.interests) ? user.interests : []
      };
  
      console.log('Opportunities payload:', recommendationPayload);
  
      const response = await fetch(
        'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/recommendations/generate',
            body: JSON.stringify(recommendationPayload)
          })
        }
      );
  
      console.log('Opportunities API response status:', response.status);
      const data = await response.json();
      console.log('Opportunities raw response:', data);
  
      let careerData;
      if (data.body) {
        const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        console.log('Opportunities parsed body:', parsedBody);
        
        if (parsedBody.recommendations?.careerPaths) {
          careerData = parsedBody.recommendations.careerPaths;
          console.log('Found career paths:', careerData);
        }
      }
  
      if (!Array.isArray(careerData) || careerData.length === 0) {
        console.log('No career data found, using fallback');
        return [{
          type: "job",
          role: selectedCareerPath.title,
          company: "Leading Company",
          location: "Remote",
          matchScore: 85,
          postedDate: "Recently",
          description: `Entry level ${selectedCareerPath.title} position`
        }];
      }
  
      const opportunities = careerData.map(path => ({
        type: "job",
        role: path.title,
        company: "Top " + path.title + " Firm",
        location: "Remote/Hybrid",
        matchScore: path.matchScore || calculateMatchScore(path.requiredSkills || [], user?.skills || []),
        postedDate: "Recently",
        description: path.description || `${path.title} position matching your skills and interests`,
        salaryRange: path.salaryRange
      }));
  
      console.log('Generated opportunities:', opportunities);
      return opportunities;
  
    } catch (error) {
      console.error('Error in generateOpportunities:', error);
      return [{
        type: "job",
        role: selectedCareerPath.title,
        company: "Leading Company",
        location: "Remote",
        matchScore: 85,
        postedDate: "Recently",
        description: `Entry level ${selectedCareerPath.title} position`
      }];
    }
  };
  
  const calculateMatchScore = (required = [], userSkills = []) => {
    if (!required.length || !userSkills.length) return 85;
    
    const matching = required.filter(skill => 
      userSkills.some(userSkill => 
        userSkill.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(userSkill.toLowerCase())
      )
    );
    
    return Math.round((matching.length / required.length) * 100);
  };

  const generateGoals = async (user, selectedCareerPath) => {
    try {
      const steps = selectedCareerPath?.roadmap?.steps || [];
      return steps.map((step, index) => ({
        title: step.title || `Goal ${index + 1}`,
        current: 0,
        target: 100,
        unit: 'Progress',
        description: step.description || `Complete ${selectedCareerPath.title} milestone`,
        order: step.order || index + 1
      })).sort((a, b) => a.order - b.order);
    } catch (error) {
      console.error('Error generating goals:', error);
      return [{
        title: `${selectedCareerPath.title} Fundamentals`,
        current: 0,
        target: 100,
        unit: 'Progress',
        description: `Master the basics of ${selectedCareerPath.title}`,
        order: 1
      }];
    }
  };

  const generateEvents = async (user, selectedCareerPath) => {
    try {
      const certs = selectedCareerPath?.recommendedCertifications || [];
      return certs.map((cert, index) => ({
        type: 'certification',
        title: cert.name || `${selectedCareerPath.title} Certification`,
        description: `Complete ${cert.name || 'professional'} certification`,
        deadline: cert.timeframe || 'Next Month',
        provider: cert.provider || 'Industry Standard',
        difficulty: cert.difficulty || 'Medium'
      }));
    } catch (error) {
      console.error('Error generating events:', error);
      return [{
        type: 'certification',
        title: `${selectedCareerPath.title} Professional Certification`,
        description: 'Complete industry-standard certification',
        deadline: 'Next Month',
        provider: 'Industry Standard',
        difficulty: 'Medium'
      }];
    }
  };

  const loadPersonalizedContent = async (forceRefresh = false) => {
    console.log('Starting to load personalized content...', { forceRefresh });
    setIsDashboardLoading(true);
    setDashboardError(null);
  
    try {
      if (!forceRefresh) {
        const storedDashboard = getDashboardFromSession(user.userID, selectedCareerPath);
        if (storedDashboard) {
          console.log('Using stored dashboard data for same career path');
          setPersonalizedLearningPaths(storedDashboard.learningPaths);
          setPersonalizedOpportunities(storedDashboard.opportunities);
          setPersonalizedGoals(storedDashboard.goals);
          setPersonalizedEvents(storedDashboard.events);
          setIsDashboardLoading(false);
          return;
        }
      }
  
      console.log('Loading fresh dashboard data for career:', selectedCareerPath.title);
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

  useEffect(() => {
    if (!user?.selectedCareerPath && user?.userID) {
      console.log('No career path found, redirecting to Career Compass');
      setStage(4);
      return;
    }

    const currentCareerPathId = selectedCareerPath?.id || selectedCareerPath?.title;
    const lastCareerPathId = lastCareerPath?.id || lastCareerPath?.title;
    
    if (currentCareerPathId !== lastCareerPathId && lastCareerPath !== null) {
      console.log('Career path changed, forcing refresh:', {
        from: lastCareerPathId,
        to: currentCareerPathId
      });
      
      setPersonalizedLearningPaths([]);
      setPersonalizedOpportunities([]);
      setPersonalizedGoals([]);
      setPersonalizedEvents([]);
      
      loadPersonalizedContent(true);
      return;
    }

    const loadContent = () => {
      const storedDashboard = getDashboardFromSession(user?.userID, selectedCareerPath);
      if (storedDashboard) {
        console.log('Restoring dashboard data from session storage');
        setPersonalizedLearningPaths(storedDashboard.learningPaths || []);
        setPersonalizedOpportunities(storedDashboard.opportunities || []);
        setPersonalizedGoals(storedDashboard.goals || []);
        setPersonalizedEvents(storedDashboard.events || []);

        setIsDashboardLoading(false);
        setIsLearningPathsLoading(false);
        setIsOpportunitiesLoading(false);
        setIsGoalsLoading(false);
        setIsEventsLoading(false);
        
        setLastCareerPath(selectedCareerPath);
        
      } else if (user?.selectedCareerPath) {
        console.log('Career path found, loading fresh personalized content');
        loadPersonalizedContent();
      } else {
        setIsDashboardLoading(false);
      }
    };

    loadContent();
    
  }, [user?.selectedCareerPath, user?.userID, selectedCareerPath]);

  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-lg sm:text-xl font-medium text-gray-900">
            Personalizing your {selectedCareerPath?.title} dashboard...
          </p>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            We're customizing your experience based on your career choice
          </p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-red-600 mb-4 text-sm sm:text-base">{dashboardError}</p>
          <button
            onClick={() => loadPersonalizedContent(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const navigationItems = [
    { 
      icon: Compass, 
      label: 'Career Compass', 
      onClick: () => setStage(4)
    },
    { 
      icon: BookOpen, 
      label: 'Learning Paths',
      onClick: () => {} 
    },
    { 
      icon: FileText,
      label: 'Resume Analysis',
      onClick: () => {
        const storedResume = storageUtils.getItem('userResume');
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
      onClick: () => {}
    },
    { 
      icon: Users, 
      label: 'Creator Profile',
      onClick: () => setStage(7)
    },
    { 
      icon: Award, 
      label: 'Certifications',
      onClick: () => {}
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center px-4 h-16">
          <button
            id="mobile-menu-button"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg lg:hidden"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center ml-2 lg:ml-4">
            <span className="text-lg sm:text-xl font-bold text-blue-600">CareerDay</span>
          </div>

          {/* Enhanced Search - Hidden on small mobile, shown on tablet+ */}
          <div className="hidden sm:flex flex-1 max-w-2xl mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search learning paths, jobs, goals, or milestones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 pr-20 bg-gray-100 rounded-lg text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white
                         border border-transparent focus:border-blue-300"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              
              {/* Search Controls */}
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Clear search"
                  >
                    <X size={16} className="text-gray-400" />
                  </button>
                )}
                <button
                  onClick={() => setShowSearchFilters(!showSearchFilters)}
                  className={`p-1.5 rounded-lg transition-colors ${
                    showSearchFilters || searchQuery
                      ? 'bg-blue-100 text-blue-600' 
                      : 'hover:bg-gray-200 text-gray-400'
                  }`}
                  title="Search filters"
                >
                  <Filter size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 sm:space-x-4 ml-auto">
            {/* Mobile Search Icon */}
            <button 
              onClick={() => {
                // On mobile, focus the search input or show a mobile search modal
                const searchInput = document.querySelector('input[placeholder*="Search"]');
                if (searchInput) {
                  searchInput.focus();
                } else {
                  setSearchQuery('');
                  setShowSearchFilters(true);
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-full sm:hidden"
            >
              <Search size={20} />
            </button>
            
            <button className="p-2 hover:bg-gray-100 rounded-full">
              <BellIcon size={20} />
            </button>

            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <UserCircle size={24} />
              </button>
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-50">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center"
                    onClick={() => {
                      setShowUserMenu(false);
                      setStage(7);
                    }}
                  >
                    <User className="h-4 w-4 mr-2" />
                    Creator Profile
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center"
                    onClick={() => {
                      setShowUserMenu(false);
                      setStage(8);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </button>
                  <div className="border-t my-1"></div>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-sm flex items-center text-red-600"
                    onClick={() => {
                      setShowUserMenu(false);
                      handleLogout();
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Filters Panel */}
        {showSearchFilters && (
          <div className="border-t bg-white px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-sm font-medium text-gray-700">Filter by:</span>
              {Object.entries({
                learningPaths: 'Learning Paths',
                opportunities: 'Opportunities', 
                goals: 'Goals',
                events: 'Events'
              }).map(([key, label]) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={searchFilters[key]}
                    onChange={(e) => setSearchFilters(prev => ({
                      ...prev,
                      [key]: e.target.checked
                    }))}
                    className="mr-2 rounded text-blue-600"
                  />
                  <span className="text-sm text-gray-600">{label}</span>
                </label>
              ))}
              
              <button
                onClick={() => setSearchFilters({
                  learningPaths: true,
                  opportunities: true,
                  goals: true,
                  events: true
                })}
                className="text-sm text-blue-600 hover:text-blue-700 ml-auto"
              >
                Select All
              </button>
            </div>
          </div>
        )}

        {/* Mobile Search Bar */}
        <div className="sm:hidden px-4 py-3 border-t bg-gray-50">
          <div className="relative">
            <input
              type="text"
              placeholder="Search dashboard content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 pl-10 pr-10 bg-white border border-gray-300 rounded-lg text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-300"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="flex relative">
        {/* Mobile Sidebar Overlay */}
        {isSidebarOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden" 
               onClick={() => setIsSidebarOpen(false)} />
        )}

        {/* Sidebar */}
        <aside 
          id="mobile-sidebar"
          className={`fixed lg:sticky lg:top-16 top-0 left-0 h-full lg:h-[calc(100vh-64px)] 
                     w-64 bg-white border-r z-50 lg:z-auto
                     transform transition-transform duration-300 ease-in-out
                     ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
                     lg:block`}
        >
          {/* Mobile Close Button */}
          <div className="flex items-center justify-between p-4 border-b lg:hidden">
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    item.onClick();
                    setIsSidebarOpen(false);
                  }}
                  className="w-full flex items-center space-x-3 px-3 py-3 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors text-left"
                >
                  <item.icon size={20} />
                  <span className="text-sm sm:text-base">{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-h-screen">
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto">
              {/* Title Section - Responsive */}
              <div className="mb-6 sm:mb-8">
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
      className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 w-full sm:w-auto"
    >
      <Compass className="h-4 w-4" />
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

              {/* Dashboard Grid - Responsive Layout */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 sm:gap-6">
                {/* Main Content Area - Takes full width on mobile/tablet, 2/3 on desktop */}
                <div className="xl:col-span-2 space-y-4 sm:space-y-6">
                  
                  {/* Learning Paths Section */}
                  {(searchFilters.learningPaths && (searchResults.learningPaths.length > 0 || !debouncedSearchQuery)) && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          <h2 className="text-lg sm:text-xl font-semibold">
                            Learning Paths
                            {debouncedSearchQuery && searchResults.learningPaths.length > 0 && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({searchResults.learningPaths.length} found)
                              </span>
                            )}
                          </h2>
                        </div>
                        <a href="#" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                          View All
                          <ChevronRight className="h-4 w-4" />
                        </a>
                      </div>
                      
                      <div className="space-y-4 sm:space-y-6">
                        {isLearningPathsLoading ? (
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ) : searchResults.learningPaths.length === 0 && debouncedSearchQuery ? (
                          <div className="text-center py-8">
                            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No learning paths match your search.</p>
                          </div>
                        ) : searchResults.learningPaths.length === 0 ? (
                          <div className="text-center py-8">
                            <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No learning paths available yet.</p>
                          </div>
                        ) : (
                          searchResults.learningPaths.map((course, index) => {
                            // Find original index for progress tracking
                            const originalIndex = personalizedLearningPaths.findIndex(p => p.title === course.title);
                            return (
                              <div key={`${course.title}-${index}`} className="border rounded-lg p-4 sm:p-6 hover:border-blue-200 transition-colors">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-4 gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-base sm:text-lg mb-1">
                                      <HighlightText text={course.title} searchTerm={debouncedSearchQuery} />
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-2 sm:mb-3">
                                      <HighlightText text={course.provider} searchTerm={debouncedSearchQuery} />
                                    </p>
                                    <p className="text-sm text-gray-700">
                                      <HighlightText text={course.description} searchTerm={debouncedSearchQuery} />
                                    </p>
                                  </div>
                                  <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-0">
                                    <span className="text-lg font-semibold text-blue-600">
                                      {courseProgress[originalIndex] || course.progress || 0}%
                                    </span>
                                    <span className="text-sm text-gray-500">Complete</span>
                                  </div>
                                </div>

                                <div className="mb-4">
                                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                                    <div
                                      className="bg-blue-600 rounded-full h-2.5 transition-all duration-300"
                                      style={{ width: `${courseProgress[originalIndex] || course.progress || 0}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Interactive Task List */}
                                <div className="space-y-3 mb-4">
                                  {/* Main Lesson Task */}
                                  <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                    <button
                                      onClick={() => markTaskComplete(originalIndex, 'main-lesson')}
                                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                        completedTasks[`${originalIndex}-main-lesson`]
                                          ? 'bg-green-500 border-green-500'
                                          : 'border-gray-300 hover:border-blue-500'
                                      }`}
                                    >
                                      {completedTasks[`${originalIndex}-main-lesson`] && (
                                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                        </svg>
                                      )}
                                    </button>
                                    <div className="flex-1">
                                      <span className={`text-sm font-medium ${
                                        completedTasks[`${originalIndex}-main-lesson`] ? 'text-green-700 line-through' : 'text-gray-700'
                                      }`}>
                                        Complete: <HighlightText text={course.nextLesson} searchTerm={debouncedSearchQuery} />
                                      </span>
                                    </div>
                                  </div>

                                  {/* Resource Tasks */}
                                  {course.resources && course.resources.map((resource, resIndex) => (
                                    <div key={resIndex} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                      <button
                                        onClick={() => markTaskComplete(originalIndex, `resource-${resIndex}`)}
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                                          completedTasks[`${originalIndex}-resource-${resIndex}`]
                                            ? 'bg-green-500 border-green-500'
                                            : 'border-gray-300 hover:border-blue-500'
                                        }`}
                                      >
                                        {completedTasks[`${originalIndex}-resource-${resIndex}`] && (
                                          <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                          </svg>
                                        )}
                                      </button>
                                      <div className="flex-1">
                                        <a
                                          href={resource.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className={`text-sm hover:text-blue-600 transition-colors ${
                                            completedTasks[`${originalIndex}-resource-${resIndex}`] ? 'text-green-700 line-through' : 'text-gray-700'
                                          }`}
                                        >
                                          Study: <HighlightText text={resource.title} searchTerm={debouncedSearchQuery} />
                                        </a>
                                        <p className="text-xs text-gray-500 mt-1">
                                          <HighlightText text={resource.provider} searchTerm={debouncedSearchQuery} />
                                        </p>
                                      </div>
                                    </div>
                                  ))}
                                </div>

                                {/* Progress Summary */}
                                <div className="flex items-center justify-between pt-4 border-t">
                                  <div className="text-sm text-gray-600">
                                    {Object.keys(completedTasks).filter(key => 
                                      key.startsWith(`${originalIndex}-`) && completedTasks[key]
                                    ).length} of {(course.resources?.length || 0) + 1} tasks completed
                                  </div>
                                  
                                  {(courseProgress[originalIndex] || 0) === 100 ? (
                                    <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm">
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                      Completed!
                                    </div>
                                  ) : (
                                    <button 
                                      onClick={() => {
                                        if (!completedTasks[`${originalIndex}-main-lesson`]) {
                                          document.getElementById(`main-lesson-${originalIndex}`)?.scrollIntoView({ behavior: 'smooth' });
                                        } else {
                                          const firstIncompleteIndex = course.resources?.findIndex((_, resIndex) => 
                                            !completedTasks[`${originalIndex}-resource-${resIndex}`]
                                          );
                                          if (firstIncompleteIndex >= 0) {
                                            document.getElementById(`resource-${originalIndex}-${firstIncompleteIndex}`)?.scrollIntoView({ behavior: 'smooth' });
                                          }
                                        }
                                      }}
                                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                                    >
                                      Continue Learning
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}

                  {/* Opportunities Section */}
                  {(searchFilters.opportunities && (searchResults.opportunities.length > 0 || !debouncedSearchQuery)) && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          <h2 className="text-lg sm:text-xl font-semibold">
                            Matched Opportunities
                            {debouncedSearchQuery && searchResults.opportunities.length > 0 && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({searchResults.opportunities.length} found)
                              </span>
                            )}
                          </h2>
                        </div>
                        <button 
                          onClick={() => loadPersonalizedContent(true)}
                          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
                        >
                          <RefreshCw className="h-4 w-4" />
                          <span className="hidden sm:inline">Refresh</span>
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        {isOpportunitiesLoading ? (
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                          </div>
                        ) : searchResults.opportunities.length === 0 && debouncedSearchQuery ? (
                          <div className="text-center py-8">
                            <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No opportunities match your search.</p>
                          </div>
                        ) : searchResults.opportunities.length === 0 ? (
                          <div className="text-center py-8">
                            <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                            <p className="text-gray-500">No opportunities available yet.</p>
                          </div>
                        ) : (
                          searchResults.opportunities.map((opp, index) => {
                            const encodedTitle = encodeURIComponent(opp.role);
                            const jobLinks = {
                              linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}`,
                              indeed: `https://www.indeed.com/jobs?q=${encodedTitle}`,
                              handshake: `https://app.joinhandshake.com/stu/postings?text=${encodedTitle}`
                            };

                            return (
                              <div key={`${opp.role}-${index}`} className="border rounded-lg p-4 sm:p-6 hover:border-blue-200 transition-colors">
                                <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
                                  <div className="flex-1">
                                    <h3 className="font-medium text-base sm:text-lg text-gray-900 mb-1">
                                      <HighlightText text={opp.role} searchTerm={debouncedSearchQuery} />
                                    </h3>
                                    <p className="text-sm text-gray-600 mb-3">
                                      <HighlightText text={opp.company} searchTerm={debouncedSearchQuery} />
                                    </p>
                                    <div className="flex flex-wrap gap-3 sm:gap-4">
                                      <span className="inline-flex items-center text-sm text-gray-600">
                                        <MapPin className="h-4 w-4 mr-1" />
                                        <HighlightText text={opp.location} searchTerm={debouncedSearchQuery} />
                                      </span>
                                      <span className="inline-flex items-center text-sm text-gray-600">
                                        <Clock className="h-4 w-4 mr-1" />
                                        {opp.postedDate}
                                      </span>
                                      {opp.salaryRange && (
                                        <span className="inline-flex items-center text-sm text-gray-600">
                                          <CircleDollarSign className="h-4 w-4 mr-1" />
                                          {opp.salaryRange}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="w-full sm:w-auto sm:ml-4">
                                    <span className="inline-block px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium w-full sm:w-auto text-center">
                                      {opp.matchScore}% Match
                                    </span>
                                  </div>
                                </div>

                                {opp.description && (
                                  <p className="text-sm text-gray-700 mb-4">
                                    <HighlightText text={opp.description} searchTerm={debouncedSearchQuery} />
                                  </p>
                                )}

                                <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
                                  <a 
                                    href={jobLinks.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => analytics.trackJobApplicationClick(opp.role, 'LinkedIn')}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1 text-sm"
                                  >
                                    LinkedIn
                                    <ChevronRight className="h-4 w-4" />
                                  </a>
                                  <a 
                                    href={jobLinks.indeed}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => analytics.trackJobApplicationClick(opp.role, 'Indeed')}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1 text-sm"
                                  >
                                    Indeed
                                    <ChevronRight className="h-4 w-4" />
                                  </a>
                                  <a 
                                    href={jobLinks.handshake}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={() => analytics.trackJobApplicationClick(opp.role, 'Handshake')}
                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center justify-center gap-1 text-sm"
                                  >
                                    Handshake
                                    <ChevronRight className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Sidebar Content - Stacks below main content on mobile/tablet */}
                <div className="space-y-4 sm:space-y-6">
                  {/* Goals Section */}
                  {(searchFilters.goals && (searchResults.goals.length > 0 || !debouncedSearchQuery)) && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <Target className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          <h2 className="text-lg sm:text-xl font-semibold">
                            Path Goals
                            {debouncedSearchQuery && searchResults.goals.length > 0 && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({searchResults.goals.length} found)
                              </span>
                            )}
                          </h2>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {isGoalsLoading ? (
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ) : searchResults.goals.length === 0 && debouncedSearchQuery ? (
                          <div className="text-center py-6">
                            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No goals match your search.</p>
                          </div>
                        ) : searchResults.goals.length === 0 ? (
                          <div className="text-center py-6">
                            <Target className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No goals set yet.</p>
                          </div>
                        ) : (
                          searchResults.goals.map((goal, index) => (
                            <div key={`${goal.title}-${index}`}>
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-sm sm:text-base">
                                  <HighlightText text={goal.title} searchTerm={debouncedSearchQuery} />
                                </span>
                                <span className="text-blue-600 text-sm">
                                  {goal.current}/{goal.target} {goal.unit}
                                </span>
                              </div>
                              <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-2">
                                <HighlightText text={goal.description} searchTerm={debouncedSearchQuery} />
                              </p>
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                                  style={{ width: `${(goal.current / goal.target) * 100}%` }}
                                />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Events/Milestones Section */}
                  {(searchFilters.events && (searchResults.events.length > 0 || !debouncedSearchQuery)) && (
                    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                      <div className="flex items-center justify-between mb-4 sm:mb-6">
                        <div className="flex items-center gap-3">
                          <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          <h2 className="text-lg sm:text-xl font-semibold">
                            Upcoming Milestones
                            {debouncedSearchQuery && searchResults.events.length > 0 && (
                              <span className="ml-2 text-sm font-normal text-gray-500">
                                ({searchResults.events.length} found)
                              </span>
                            )}
                          </h2>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {isEventsLoading ? (
                          <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        ) : searchResults.events.length === 0 && debouncedSearchQuery ? (
                          <div className="text-center py-6">
                            <Search className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No events match your search.</p>
                          </div>
                        ) : searchResults.events.length === 0 ? (
                          <div className="text-center py-6">
                            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No upcoming milestones.</p>
                          </div>
                        ) : (
                          searchResults.events.map((event, index) => (
                            <div key={`${event.title}-${index}`} className="border rounded-lg p-3 sm:p-4">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                                  {event.type === 'certification' ? (
                                    <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  ) : (
                                    <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h3 className="font-medium text-sm sm:text-base">
                                    <HighlightText text={event.title} searchTerm={debouncedSearchQuery} />
                                  </h3>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    <HighlightText text={event.description} searchTerm={debouncedSearchQuery} />
                                  </p>
                                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                    <strong>Deadline:</strong> {event.deadline}
                                  </p>
                                  {event.provider && (
                                    <p className="text-xs sm:text-sm text-gray-600 mt-1">
                                      <strong>Provider:</strong> <HighlightText text={event.provider} searchTerm={debouncedSearchQuery} />
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
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