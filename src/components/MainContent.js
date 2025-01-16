import React, { useState, useContext, useEffect } from 'react';
import {
  Compass, BookOpen, Target, Award, Users, Menu, 
  UserCircle, BellIcon, Search, Building2, 
  Calendar, Link, Star,Clock, ArrowRight,FileText,RefreshCw,ChevronRight,MapPin,CircleDollarSign
} from 'lucide-react';
import { UserContext } from '../App';

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
      careerPath: data.careerPath
    };
    sessionStorage.setItem(
      `${USER_DASHBOARD_KEY}_${userId}`,
      JSON.stringify(dashboardData)
    );
    console.log('Dashboard data stored:', dashboardData);
  } catch (err) {
    console.error('Error storing dashboard data:', err);
  }
};

// Add this helper function
const getDashboardFromSession = (userId) => {
  try {
    const stored = sessionStorage.getItem(`${USER_DASHBOARD_KEY}_${userId}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Error reading dashboard from session:', err);
  }
  return null;
};
// Resource Card Component
const ResourceCard = ({ resource }) => {
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
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
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
              <span>{resource.provider}</span>
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
            {resource.platform && <div>Platform: {resource.platform}</div>}
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
      className="block p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
          {getIconForType(resource.type)}
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-medium text-blue-600 truncate">{resource.title}</h4>
          <p className="text-sm text-gray-600 mt-1">{resource.description}</p>
          {renderMetadata()}
        </div>
        <div className="flex-shrink-0 self-center">
          <ArrowRight className="h-5 w-5 text-blue-400" />
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isLearningPathsLoading, setIsLearningPathsLoading] = useState(true);
  const [isOpportunitiesLoading, setIsOpportunitiesLoading] = useState(true);
  const [isGoalsLoading, setIsGoalsLoading] = useState(true);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  
  const [personalizedLearningPaths, setPersonalizedLearningPaths] = useState([]);
  const [personalizedOpportunities, setPersonalizedOpportunities] = useState([]);
  const [personalizedGoals, setPersonalizedGoals] = useState([]);
  const [personalizedEvents, setPersonalizedEvents] = useState([]);

  const handleLogout = () => {
    sessionStorage.removeItem(`${USER_DASHBOARD_KEY}_${user.userID}`);
    setUser({});
    setStage(1);
  };

  const loadLearningPaths = async () => {
    setIsLearningPathsLoading(true);
    try {
      const paths = await generateLearningPaths();
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
      const opportunities = await generateOpportunities();
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
      const goals = await generateGoals();
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
      const events = await generateEvents();
      return events;
    } catch (error) {
      console.error('Error loading events:', error);
      return [];
    } finally {
      setIsEventsLoading(false);
    }
  };
  
  const generateLearningPaths = async () => {
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
          categories: [
            'onlineCourses',
            'certifications',
            'tutorials',
            'communities',
            'professionalResources'
          ]
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
  
        // Get recommendations from response
        const recommendations = parsedBody.recommendations || {};
        console.log('Extracted recommendations:', recommendations);
  
        // Create learning paths array
        const learningPaths = [];
  
        // Core skills path based on career recommendations
        if (recommendations.careerPaths && recommendations.careerPaths.length > 0) {
          const mainPath = recommendations.careerPaths[0]; // Use first path as main path
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
  
          // Add professional development path
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
  
          // Add certification paths if available
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
      // Return fallback paths with resources
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
  
  const generateOpportunities = async () => {
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
          // Get career paths with similar roles
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
  
      // Create opportunities from career paths
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
  
  // Helper function for calculating match scores
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

  const generateGoals = async () => {
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

  const generateEvents = async () => {
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
    console.log('Starting to load personalized content...');
    setIsDashboardLoading(true);
    setDashboardError(null);
  
    try {
      // Check session storage first unless force refresh is requested
      if (!forceRefresh) {
        const storedDashboard = getDashboardFromSession(user.userID);
        if (storedDashboard) {
          console.log('Using stored dashboard data');
          setPersonalizedLearningPaths(storedDashboard.learningPaths);
          setPersonalizedOpportunities(storedDashboard.opportunities);
          setPersonalizedGoals(storedDashboard.goals);
          setPersonalizedEvents(storedDashboard.events);
          setIsDashboardLoading(false);
          return;
        }
      }
  
      console.log('Loading fresh dashboard data...');
      const learningPaths = await loadLearningPaths();
      const opportunities = await loadOpportunities();
      const goals = await loadGoals();
      const events = await loadEvents();
  
      if (learningPaths && opportunities) {
        // Store all data together
        const dashboardData = {
          learningPaths,
          opportunities,
          goals,
          events,
          careerPath: user.selectedCareerPath,
          timestamp: new Date().toISOString()
        };
  
        // Store in session
        storeDashboardData(user.userID, dashboardData);
  
        // Update state
        setPersonalizedLearningPaths(learningPaths);
        setPersonalizedOpportunities(opportunities);
        setPersonalizedGoals(goals);
        setPersonalizedEvents(events);
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

// Add refresh button component
const refreshRecommendations = () => (
  <button
    onClick={() => loadPersonalizedContent(true)}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 
               hover:bg-blue-50 rounded-lg"
  >
    <RefreshCw className="h-4 w-4" />
    Refresh Dashboard
  </button>
);

  // Add this to the top of MainContent.js useEffect
  useEffect(() => {
    // First check if user has a career path
    if (!user?.selectedCareerPath && user?.userID) {
      console.log('No career path found, redirecting to Career Compass');
      setStage(5);
      return;
    }

  // Check if we have stored dashboard data first
  const storedDashboard = getDashboardFromSession(user?.userID);
  if (storedDashboard) {
    console.log('Restoring dashboard data from session storage');
    setPersonalizedLearningPaths(storedDashboard.learningPaths);
    setPersonalizedOpportunities(storedDashboard.opportunities);
    setPersonalizedGoals(storedDashboard.goals);
    setPersonalizedEvents(storedDashboard.events);
    setIsDashboardLoading(false);
    return;
  }

      // If we have a career path, always load fresh content
      if (user?.selectedCareerPath) {
        console.log('Career path found, loading fresh personalized content');
        loadPersonalizedContent();
      }
}, [user?.selectedCareerPath, user?.userID]); // Dependencies
  if (isDashboardLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-xl font-medium text-gray-900">
            Personalizing your {selectedCareerPath?.title} dashboard...
          </p>
          <p className="mt-2 text-gray-600">
            We're customizing your experience based on your career choice
          </p>
        </div>
      </div>
    );
  }

  if (dashboardError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{dashboardError}</p>
          <button
            onClick={loadPersonalizedContent}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Update the navigationItems array in MainContent.js
const navigationItems = [
  { 
    icon: Compass, 
    label: 'Career Compass', 
    onClick: () => setStage(5)
  },
  { 
    icon: BookOpen, 
    label: 'Learning Paths',
    onClick: () => {} // Add handler if needed
  },
  { 
    icon: FileText, // Make sure to import FileText from lucide-react
    label: 'Resume Analysis',
    onClick: () => {
      // Check if resume exists in session storage
      const storedResume = sessionStorage.getItem('userResume');
      if (!storedResume) {
        alert('Please upload your resume first to access the analysis.');
        setStage(4); // Navigate to resume upload stage
        return;
      }
      console.log('Navigating to resume analysis with stored resume');
      setStage(7); // New stage for Resume Analysis
    }
  },
  { 
    icon: Building2, 
    label: 'Jobs & Projects',
    onClick: () => {}
  },
  { 
    icon: Users, 
    label: 'Mentorship',
    onClick: () => {}
  },
  { 
    icon: Award, 
    label: 'Certifications',
    onClick: () => {}
  }
];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="flex items-center px-4 h-16">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center ml-4">
            <span className="text-xl font-bold text-blue-600">CareerDay</span>
          </div>

          <div className="flex-1 max-w-2xl mx-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search learning paths, mentors, or opportunities"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-100 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
            </div>
          </div>

          <div className="flex items-center space-x-4">
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
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1">
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => setStage(4)}
                  >
                    Profile
                  </button>
                  <button
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                    onClick={() => setStage(6)}
                  >
                    Settings
                  </button>
                  <button
  className="w-full px-4 py-2 text-left hover:bg-gray-100"
  onClick={handleLogout}
>
  Logout
</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Layout */}
      <div className="flex">
        {/* Sidebar */}
        <aside className={`w-64 bg-white border-r h-[calc(100vh-64px)] sticky top-16 
                      transition-transform duration-200 
                      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64'}`}>
          <nav className="p-4">
            <div className="space-y-2">
              {navigationItems.map((item, index) => (
                <button
                  key={index}
                  onClick={item.onClick}
                  className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100"
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </nav>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Title with Career Path Change Option */}
            <div className="mb-8 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {selectedCareerPath.title} Career Dashboard
                </h1>
                <p className="mt-1 text-gray-600">
                  Your personalized roadmap to becoming a {selectedCareerPath.title}
                </p>
              </div>
              <button
                onClick={() => setStage(5)}
                className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
              >
                <Compass className="h-4 w-4" />
                Change Career Path
              </button>
            </div>
            </div>

            {/* Dashboard Sections */}
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  {/* Main Content Area */}
  <div className="lg:col-span-2 space-y-6">
    {/* Learning Paths Section */}
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <BookOpen className="h-6 w-6 text-blue-600" />
      <h2 className="text-xl font-semibold">Learning Paths</h2>
    </div>
    {/* Add view all link */}
    <a href="#" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
      View All
      <ChevronRight className="h-4 w-4" />
    </a>
  </div>
  <div className="space-y-6">
    {isLearningPathsLoading ? (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    ) : (
      personalizedLearningPaths.map((course, index) => (
        <div key={index} className="border rounded-lg p-6 hover:border-blue-200 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="font-medium text-lg mb-1">{course.title}</h3>
              <p className="text-sm text-gray-600 mb-3">{course.provider}</p>
              <p className="text-sm text-gray-700">{course.description}</p>
            </div>
            <div className="ml-4 flex flex-col items-end">
              <span className="text-lg font-semibold text-blue-600">
                {course.progress}%
              </span>
              <span className="text-sm text-gray-500">Complete</span>
            </div>
          </div>

          <div className="mb-4">
            <div className="w-full bg-gray-100 rounded-full h-2.5">
              <div
                className="bg-blue-600 rounded-full h-2.5 transition-all duration-300"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div>
              <span className="text-sm font-medium text-gray-700">Next Up:</span>
              <span className="text-sm text-gray-600 ml-2">{course.nextLesson}</span>
            </div>
            <button className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
              Continue
            </button>
          </div>

          {course.resources && course.resources.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Learning Resources</h4>
              <div className="grid gap-3">
                {course.resources.map((resource, idx) => (
                  <ResourceCard key={idx} resource={resource} />
                ))}
              </div>
            </div>
          )}
        </div>
      ))
    )}
  </div>
</div>
                  

                {/* Opportunities Section */}
<div className="bg-white rounded-xl shadow-sm p-6">
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <Building2 className="h-6 w-6 text-blue-600" />
      <h2 className="text-xl font-semibold">Matched Opportunities</h2>
    </div>
    <button 
      onClick={refreshRecommendations}
      className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2"
    >
      <RefreshCw className="h-4 w-4" />
      Refresh
    </button>
  </div>
  <div className="space-y-4">
    {isOpportunitiesLoading ? (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
      </div>
    ) : (
      personalizedOpportunities.map((opp, index) => {
        // Generate job search URLs
        const encodedTitle = encodeURIComponent(opp.role);
        const jobLinks = {
          linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}`,
          indeed: `https://www.indeed.com/jobs?q=${encodedTitle}`,
          handshake: `https://app.joinhandshake.com/stu/postings?text=${encodedTitle}`
        };

        return (
          <div key={index} className="border rounded-lg p-6 hover:border-blue-200 transition-colors">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="font-medium text-lg text-gray-900 mb-1">{opp.role}</h3>
                <p className="text-sm text-gray-600">{opp.company}</p>
                <div className="flex flex-wrap gap-4 mt-3">
                  <span className="inline-flex items-center text-sm text-gray-600">
                    <MapPin className="h-4 w-4 mr-1" />
                    {opp.location}
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
              <div className="ml-4">
                <span className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium">
                  {opp.matchScore}% Match
                </span>
              </div>
            </div>

            {opp.description && (
              <p className="text-sm text-gray-700 mb-4">{opp.description}</p>
            )}

            <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
              <a 
                href={jobLinks.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                View on LinkedIn
                <ChevronRight className="h-4 w-4" />
              </a>
              <a 
                href={jobLinks.indeed}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                View on Indeed
                <ChevronRight className="h-4 w-4" />
              </a>
              <a 
                href={jobLinks.handshake}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors inline-flex items-center gap-1"
              >
                View on Handshake
                <ChevronRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        );
      })
    )}
  </div>
</div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                {/* Goals Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Target className="h-6 w-6 text-blue-600" />
                      <h2 className="text-xl font-semibold">Path Goals</h2>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {isGoalsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : (
                      personalizedGoals.map((goal, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{goal.title}</span>
                            <span className="text-blue-600">
                              {goal.current}/{goal.target} {goal.unit}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{goal.description}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-600 rounded-full h-2"
                              style={{ width: `${(goal.current / goal.target) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Events Section */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-6 w-6 text-blue-600" />
                      <h2 className="text-xl font-semibold">Upcoming Milestones</h2>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {isEventsLoading ? (
                      <div className="animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : (
                      personalizedEvents.map((event, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-blue-50 rounded-lg">
                              {event.type === 'certification' ? (
                                <Award className="h-5 w-5 text-blue-600" />
                              ) : (
                                <Target className="h-5 w-5 text-blue-600" />
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium">{event.title}</h3>
                              <p className="text-sm text-gray-600">{event.description}</p>
                              <p className="text-sm text-gray-600 mt-1">{event.deadline}</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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