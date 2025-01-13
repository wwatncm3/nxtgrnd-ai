


import React, { useState, useRef, useContext, useEffect } from 'react';
import {
  Compass, BookOpen, Target, Award, MessageSquare, 
  PlayCircle, ChevronRight, Home, Briefcase, GraduationCap,
  Users, Menu, UserCircle, BellIcon, Search, Book,
  Lightbulb, Settings, LogOut, Building2, BarChart,
  Calendar, ChevronLeft, RefreshCw
} from 'lucide-react';
import { UserContext } from '../App';

// Utility function to normalize career paths and remove duplicates
const normalizeCareerPaths = (paths) => {
  if (!Array.isArray(paths)) return [];
  
  const uniquePaths = new Map();
  
  paths.forEach(path => {
    const normalizedTitle = path.title.toLowerCase().trim();
    const experienceLevel = 
      normalizedTitle.includes('junior') ? 'junior' :
      normalizedTitle.includes('senior') ? 'senior' : 'mid';
    const key = `${normalizedTitle}-${experienceLevel}`;
    
    if (!uniquePaths.has(key) || 
        (path.matchScore > uniquePaths.get(key).matchScore)) {
      uniquePaths.set(key, {
        ...path,
        matchScore: path.matchScore || 0,
        requiredSkills: Array.isArray(path.requiredSkills) ? 
          path.requiredSkills : []
      });
    }
  });
  
  return Array.from(uniquePaths.values());
};

const CareerCompassWidget = ({ setStage, careerPaths, isLoading }) => {
  const { user } = useContext(UserContext);
  const [profileProgress, setProfileProgress] = useState(0);

  // Calculate profile progress
  useEffect(() => {
    const calculateProgress = () => {
      const requiredFields = [
        'firstName',
        'lastName',
        'email',
        'interests',
        'skills',
        'careerStage',
        'pathType',
        'primaryGoal'
      ];
      
      let completedFields = 0;
      requiredFields.forEach(field => {
        if (user[field] && 
            (Array.isArray(user[field]) ? user[field].length > 0 : true)) {
          completedFields++;
        }
      });
      
      return Math.round((completedFields / requiredFields.length) * 100);
    };

    setProfileProgress(calculateProgress());
  }, [user]);

  // Simply use the first path from sorted careerPaths
  const topMatch = careerPaths?.[0] || {
    title: 'Complete your profile to see matches',
    matchScore: 0,
    requiredSkills: []
  };

  return (
    <div className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Compass className="h-6 w-6" />
          <h2 className="text-xl font-semibold">AI Career Compass™</h2>
        </div>
        <button 
          onClick={() => setStage(11)} 
          className="flex items-center gap-2 text-blue-100 hover:text-white transition-colors"
        >
          View Details
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div className="bg-white/10 rounded-lg p-4">
          <h3 className="font-medium mb-2">Top Career Match</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-lg font-medium">{topMatch.title}</span>
              {topMatch.matchScore > 0 && (
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  {topMatch.matchScore}% Match
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {topMatch.requiredSkills?.slice(0, 3).map((skill, index) => (
                <span key={index} className="text-sm bg-white/20 px-2 py-1 rounded">
                  {skill}
                </span>
              ))}
              {(!topMatch.requiredSkills || topMatch.requiredSkills.length === 0) && (
                <span className="text-sm bg-white/20 px-2 py-1 rounded">
                  Update your profile to see required skills
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="bg-white/10 rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-medium">Profile Completion</h3>
            <span className="text-sm">
              {profileProgress}% complete
            </span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500" 
              style={{ width: `${profileProgress}%` }}
            />
          </div>
          {profileProgress < 100 && (
            <button 
              onClick={() => setStage(4)}
              className="w-full mt-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
            >
              Complete Your Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// Learning Paths Section Component
const LearningPathSection = () => {
  const { user } = useContext(UserContext);
  const [currentCourses, setCurrentCourses] = useState([]);
  
  useEffect(() => {
    const fetchLearningPaths = async () => {
      if (!user?.userID) return;

      try {
        const response = await fetch(
          'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              httpMethod: 'POST',
              path: '/recommendations/generate',
              body: JSON.stringify({
                userId: user.userID,
                requestType: 'learning_paths',
                interests: user.interests || [],
                skills: user.skills || [],
                experienceLevel: user.experienceLevel || 'entry'
              })
            })
          }
        );

        if (!response.ok) throw new Error('Failed to fetch learning paths');
        const data = await response.json();
        
        const recommendedCourses = data.recommendations?.learningPaths?.map(path => ({
          title: path.title,
          progress: path.progress || 0,
          provider: path.provider,
          nextLesson: path.nextLesson || 'Getting Started'
        })) || [];

        setCurrentCourses(recommendedCourses);
      } catch (error) {
        console.error('Error fetching learning paths:', error);
        setCurrentCourses([{
          title: `${user.interests?.[0] || 'Technology'} Fundamentals`,
          progress: 0,
          provider: "CareerDay Pro",
          nextLesson: "Introduction"
        }]);
      }
    };

    fetchLearningPaths();
  }, [user]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-blue-600" />
          Learning Paths
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {currentCourses.map((course, index) => (
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
        ))}
      </div>
    </div>
  );
};

// Opportunity Section Component
const OpportunitySection = () => {
  const { user } = useContext(UserContext);
  const [opportunities, setOpportunities] = useState([]);

  useEffect(() => {
    const fetchOpportunities = async () => {
      if (!user?.userID) return;

      try {
        const response = await fetch(
          'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              httpMethod: 'POST',
              path: '/recommendations/generate',
              body: JSON.stringify({
                userId: user.userID,
                requestType: 'opportunities',
                interests: user.interests || [],
                skills: user.skills || [],
                experienceLevel: user.experienceLevel || 'entry',
                careerGoals: user.careerGoals || []
              })
            })
          }
        );

        if (!response.ok) throw new Error('Failed to fetch opportunities');
        const data = await response.json();
        
        const matchedOpportunities = data.recommendations?.opportunities?.map(opp => ({
          type: opp.type,
          role: opp.role || opp.title,
          company: opp.company || opp.client,
          location: opp.location || 'Remote',
          duration: opp.duration,
          matchScore: opp.matchScore || Math.floor(Math.random() * 20 + 80),
          postedDate: opp.postedDate || 'Recently'
        })) || [];

        setOpportunities(matchedOpportunities);
      } catch (error) {
        console.error('Error fetching opportunities:', error);
        setOpportunities([{
          type: "job",
          role: `${user.interests?.[0] || 'Technology'} Professional`,
          company: "Top Tech Company",
          location: "Remote",
          matchScore: 85,
          postedDate: "Recently"
        }]);
      }
    };

    fetchOpportunities();
  }, [user]);

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Matched Opportunities
        </h2>
        <button className="text-sm text-blue-600 hover:text-blue-700">
          View All
        </button>
      </div>
      
      <div className="space-y-4">
        {opportunities.map((opp, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium">
                  {opp.type === 'job' ? opp.role : opp.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {opp.type === 'job' ? opp.company : opp.client}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-gray-600">
                    {opp.type === 'job' ? opp.location : `Duration: ${opp.duration}`}
                  </span>
                  <span className="text-sm text-gray-600">•</span>
                  <span className="text-sm text-gray-600">{opp.postedDate}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="inline-block px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                  {opp.matchScore}% Match
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Main Content Component
const MainContent = () => {
  const { setStage, setUser, user } = useContext(UserContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [careerPaths, setCareerPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCareerPaths = async () => {
      if (!user?.userID) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(
          `https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/${user.userID}`,
          {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
          }
        );

        if (!response.ok) {
          console.warn('No stored recommendations found');
          setCareerPaths([]);
          return;
        }

        const data = await response.json();
        if (data?.recommendations) {
          const normalizedPaths = normalizeCareerPaths(data.recommendations);
          setCareerPaths(normalizedPaths);
        }
      } catch (error) {
        console.error('Error loading career paths:', error);
        setCareerPaths([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadCareerPaths();
  }, [user?.userID]);

  // Handle navigation
  const handleNavigation = (stage) => {
    setStage(stage);
  };

  const navigationItems = [
    { icon: Home, label: 'Dashboard', onClick: () => handleNavigation(4) },
    { icon: Compass, label: 'Career Compass', onClick: () => handleNavigation(11) },
    { icon: BookOpen, label: 'Learning Paths', onClick: () => handleNavigation(8) },
    { icon: Building2, label: 'Jobs & Projects', onClick: () => handleNavigation(9) },
    { icon: Users, label: 'Mentorship', onClick: () => handleNavigation(10) },
    { icon: Award, label: 'Certifications', onClick: () => handleNavigation(12) }
  ];

  const mentorCategories = [
    'Software Architecture',
    'Cloud Computing',
    'Data Science',
    'Product Management',
    'Leadership & Management'
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
                      console.log('User logging out...');
                      console.log('Clearing user state:', user);
                      setUser({});
                      console.log('User state cleared');
                      console.log('Redirecting to stage 1 (login)');
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
        <aside
          className={`w-64 bg-white border-r h-[calc(100vh-64px)] sticky top-16 
                    transition-transform duration-200 
                    ${isSidebarOpen ? 'translate-x-0' : '-translate-x-64'}`}
        >
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

            <div className="mt-8">
              <h3 className="px-3 text-sm font-semibold text-gray-500 uppercase">
                Mentor Categories
              </h3>
              <div className="mt-2 space-y-1">
                {mentorCategories.map((category, index) => (
                  <button
                    key={index}
                    className="w-full flex items-center space-x-3 px-3 py-2 
                             text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    <Users size={20} />
                    <span className="truncate">{category}</span>
                  </button>
                ))}
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Dashboard Content */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Title */}
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Your Career Dashboard</h1>
              <p className="mt-1 text-gray-600">Track your progress and explore opportunities</p>
            </div>

            {/* Grid with two columns (left wide, right narrow) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column (spans 2 in large screens) */}
              <div className="lg:col-span-2 space-y-6">
                <CareerCompassWidget 
                  setStage={setStage} 
                  careerPaths={careerPaths}
                  isLoading={isLoading}
                />
                <OpportunitySection />
                <LearningPathSection />
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                {/* Weekly Goals */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      Weekly Goals
                    </h2>
                  </div>
                  {careerPaths?.[0]?.goals ? (
                    <div className="space-y-4">
                      {careerPaths[0].goals.map((goal, index) => (
                        <div key={index}>
                          <div className="flex items-center justify-between">
                            <span>{goal.title}</span>
                            <span className="text-blue-600">
                              {goal.current}/{goal.target} {goal.unit}
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 rounded-full h-2" 
                              style={{ 
                                width: `${(goal.current / goal.target) * 100}%` 
                              }} 
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      Select a career path to see personalized goals
                    </div>
                  )}
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      Upcoming Events
                    </h2>
                  </div>
                  <div className="space-y-4">
                    {careerPaths?.[0]?.milestones ? (
                      careerPaths[0].milestones
                        .filter(milestone => !milestone.completed)
                        .slice(0, 2)
                        .map((milestone, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="flex items-start gap-3">
                              <div className={`p-2 ${
                                milestone.type === 'mentor' ? 'bg-blue-50' : 
                                milestone.type === 'certification' ? 'bg-purple-50' : 
                                'bg-green-50'
                              } rounded-lg`}>
                                {milestone.type === 'mentor' ? (
                                  <Users className="h-5 w-5 text-blue-600" />
                                ) : milestone.type === 'certification' ? (
                                  <Award className="h-5 w-5 text-purple-600" />
                                ) : (
                                  <BookOpen className="h-5 w-5 text-green-600" />
                                )}
                              </div>
                              <div>
                                <h3 className="font-medium">{milestone.title}</h3>
                                <p className="text-sm text-gray-600">{milestone.description}</p>
                                <p className="text-sm text-gray-600 mt-1">{milestone.deadline}</p>
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <div className="text-center text-gray-500">
                        Select a career path to see upcoming milestones
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold flex items-center gap-2">
                      <Lightbulb className="h-5 w-5 text-blue-600" />
                      Quick Actions
                    </h2>
                  </div>
                  <div className="space-y-3">
                    <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-blue-600" />
                        Find a Mentor
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-blue-600" />
                        Start New Course
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
                    <button className="w-full flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <span className="flex items-center gap-2">
                        <BarChart className="h-4 w-4 text-blue-600" />
                        View Progress Report
                      </span>
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </button>
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