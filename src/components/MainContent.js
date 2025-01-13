import React, { useState, useContext, useEffect } from 'react';
import {
  Compass, BookOpen, Target, Award, Users, Menu, 
  UserCircle, BellIcon, Search, Lightbulb, Building2, 
  BarChart, Calendar, ChevronRight, RefreshCw
} from 'lucide-react';
import { UserContext } from '../App';

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

 
  
  const generateLearningPaths = async () => {
    try {
      const generatePayload = {
        httpMethod: 'POST',
        path: '/recommendations/generate',
        body: JSON.stringify({
          userId: user.userID,
          careerPath: selectedCareerPath.title,
          requestType: 'learning_paths',
          skills: selectedCareerPath.requiredSkills,
          experienceLevel: user.experienceLevel || 'entry'
        })
      };

      const response = await fetch(
        'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatePayload)
        }
      );

      if (!response.ok) throw new Error('Failed to fetch learning paths');
      const data = await response.json();
      console.log('Learning Paths:', data.recommendations?.learningPaths);
      return data.recommendations?.learningPaths || [];
    } catch (error) {
      console.error('Error generating learning paths:', error);
      return [{
        title: `${selectedCareerPath.title} Fundamentals`,
        progress: 0,
        provider: "CareerDay Pro",
        nextLesson: "Getting Started"
      }];
    }
  };

  const generateOpportunities = async () => {
    try {
      const generatePayload = {
        httpMethod: 'POST',
        path: '/recommendations/generate',
        body: JSON.stringify({
          userId: user.userID,
          careerPath: selectedCareerPath.title,
          requestType: 'opportunities',
          skills: selectedCareerPath.requiredSkills,
          experienceLevel: user.experienceLevel || 'entry'
        })
      };

      const response = await fetch(
        'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(generatePayload)
        }
      );

      if (!response.ok) throw new Error('Failed to fetch opportunities');
      const data = await response.json();
      console.log('Opportunities:', data.recommendations?.opportunities);
      return data.recommendations?.opportunities || [];
    } catch (error) {
      console.error('Error generating opportunities:', error);
      return [{
        type: "job",
        role: selectedCareerPath.title,
        company: "Top Company",
        location: "Remote",
        matchScore: 85,
        postedDate: "Recently"
      }];
    }
  };

  const generateGoals = async () => {
    try {
      console.log('Goals:', selectedCareerPath?.roadmap?.steps);
      return selectedCareerPath?.roadmap?.steps?.map(step => ({
        title: step.title,
        current: 0,
        target: 100,
        unit: 'Progress',
        description: step.description
      })) || [];
    } catch (error) {
      console.error('Error generating goals:', error);
      return [];
    }
  };

  const generateEvents = async () => {
    try {
      console.log('Events:', selectedCareerPath?.recommendedCertifications);
      return selectedCareerPath?.recommendedCertifications?.map(cert => ({
        type: 'certification',
        title: cert.name,
        description: `Complete ${cert.name} certification`,
        deadline: 'Next Month'
      })) || [];
    } catch (error) {
      console.error('Error generating events:', error);
      return [];
    }
  };

  const loadLearningPaths = async () => {
    setIsLearningPathsLoading(true);
    const learningPaths = await generateLearningPaths();
    setPersonalizedLearningPaths(learningPaths);
    setIsLearningPathsLoading(false);
  };

  const loadOpportunities = async () => {
    setIsOpportunitiesLoading(true);
    const opportunities = await generateOpportunities();
    setPersonalizedOpportunities(opportunities);
    setIsOpportunitiesLoading(false);
  };

  const loadGoals = async () => {
    setIsGoalsLoading(true);
    const goals = await generateGoals();
    setPersonalizedGoals(goals);
    setIsGoalsLoading(false);
  };

  const loadEvents = async () => {
    setIsEventsLoading(true);
    const events = await generateEvents();
    setPersonalizedEvents(events);
    setIsEventsLoading(false);
  };
  
  const loadPersonalizedContent = async () => {
    setIsDashboardLoading(true);
    setDashboardError(null);

    try {
      await Promise.all([loadLearningPaths(), loadOpportunities()]);
      
      loadGoals();
      loadEvents();
      
    } catch (error) {
      console.error('Error loading personalized content:', error);
      setDashboardError('Failed to load some personalized content. Please try refreshing.');
    } finally {
      setIsDashboardLoading(false);
    }
  };

  useEffect(() => {
    console.log('Selected Career Path:', selectedCareerPath);
    if (selectedCareerPath) {
      loadPersonalizedContent();
    }
  }, [selectedCareerPath]);

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

  const navigationItems = [
    { icon: Compass, label: 'Career Compass', onClick: () => setStage(5) },
    { icon: BookOpen, label: 'Learning Paths' },
    { icon: Building2, label: 'Jobs & Projects' },
    { icon: Users, label: 'Mentorship' },
    { icon: Award, label: 'Certifications' }
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
                    onClick={() => {
                      setUser({});
                      setStage(1);
                    }}
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
                  className="w-full flex items-center space-x-3 px-3 py-2 
                           text-gray-700 rounded-lg hover:bg-gray-100"
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
                  </div>
                  <div className="space-y-4">
                    {isLearningPathsLoading ? (
                      <div className="animate-pulse">
                        {/* Placeholder loading state */}
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : (
                      personalizedLearningPaths.map((course, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-medium">{course.title}</h3>
                              <p className="text-sm text-gray-600">{course.provider}</p>
                            </div>
                            <span className="text-sm font-medium text-blue-600">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className="bg-blue-600 rounded-full h-2"
                              style={{ width: `${course.progress}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">
                              Next: {course.nextLesson}
                            </span>
                            <button className="text-sm text-blue-600 hover:text-blue-700">
                              Continue
                            </button>
                          </div>
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
                  </div>
                  <div className="space-y-4">
                    {isOpportunitiesLoading ? (
                      <div className="animate-pulse">
                        {/* Placeholder loading state */}
                        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    ) : (
                      personalizedOpportunities.map((opp, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{opp.role}</h3>
                              <p className="text-sm text-gray-600">{opp.company}</p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="text-sm text-gray-600">{opp.location}</span>
                                <span className="text-sm text-gray-600">•</span>
                                <span className="text-sm text-gray-600">{opp.postedDate}</span>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                              {opp.matchScore}% Match
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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
                        {/* Placeholder loading state */}
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
                        {/* Placeholder loading state */}
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