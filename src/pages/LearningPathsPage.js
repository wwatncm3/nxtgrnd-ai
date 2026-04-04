import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  ArrowLeft, BookOpen, Search, ChevronRight, Star, Clock,
  Users, Link, Award, RefreshCw, X, CheckCircle, ExternalLink,
  TrendingUp, Target, Zap, Heart
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';
import API_CONFIG, { fetchWithTimeout } from '../config/api';
import { FullPageLoader } from '../components/ui/AnimatedComponents';
import { getDashboardFromSession } from '../components/dashboard';
import { usePageTooltip } from '../components/OnboardingTooltip';

const LearningPathsPage = ({ setStage }) => {
  // Trigger learning paths tooltip for new users
  usePageTooltip('learningPaths');
  const { user } = useContext(UserContext);
  const selectedCareerPath = user?.selectedCareerPath;

  const [learningPaths, setLearningPaths] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [courseProgress, setCourseProgress] = useState({});
  const [completedTasks, setCompletedTasks] = useState({});
  const [expandedPath, setExpandedPath] = useState(null);
  const [favorites, setFavorites] = useState({});

  // Load data on mount
  useEffect(() => {
    loadLearningPaths();
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, selectedCareerPath]);

  const loadProgress = () => {
    // storageUtils.getItem already returns parsed data
    const savedProgress = storageUtils.getItem(`courseProgress_${user?.userID}`);
    const savedTasks = storageUtils.getItem(`completedTasks_${user?.userID}`);
    const savedFavorites = storageUtils.getItem(`learningFavorites_${user?.userID}`);

    if (savedProgress) setCourseProgress(savedProgress);
    if (savedTasks) setCompletedTasks(savedTasks);
    if (savedFavorites) setFavorites(savedFavorites);
  };

  // Toggle favorite status
  const toggleFavorite = (pathId, e) => {
    e?.stopPropagation();
    setFavorites(prev => {
      const newFavorites = { ...prev, [pathId]: !prev[pathId] };
      storageUtils.setItem(`learningFavorites_${user?.userID}`, newFavorites);
      return newFavorites;
    });
  };

  const loadLearningPaths = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // First try to get from stored dashboard data using the shared utility (skip if forcing refresh)
      if (!forceRefresh) {
        const dashboardData = getDashboardFromSession(user?.userID, selectedCareerPath);
        if (dashboardData?.learningPaths?.length > 0) {
          setLearningPaths(dashboardData.learningPaths);
          setIsLoading(false);
          return;
        }
      }

      // If no stored data or forcing refresh, generate new learning paths
      const paths = await generateLearningPaths();
      setLearningPaths(paths);
    } catch (err) {
      console.error('Error loading learning paths:', err);
      setError('Unable to load learning paths. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateLearningPaths = async () => {
    if (!selectedCareerPath) return [];

    try {
      const response = await fetchWithTimeout(
        API_CONFIG.recommendations.generate(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/recommendations/generate',
            body: JSON.stringify({
              userId: user?.userID,
              careerPath: selectedCareerPath.title,
              pathType: 'learning_paths',
              experienceLevel: user?.experienceLevel || 'entry',
              skills: selectedCareerPath.requiredSkills || [],
              requestDetails: {
                requestType: 'learning_resources',
                generateLinks: true,
                categories: ['onlineCourses', 'certifications', 'tutorials', 'communities']
              }
            })
          })
        }
      );

      const data = await response.json();
      if (data.body) {
        const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        return parsedBody.recommendations?.learningPaths || getFallbackPaths();
      }
    } catch (error) {
      console.error('Error generating learning paths:', error);
    }

    return getFallbackPaths();
  };

  const getFallbackPaths = () => {
    const careerTitle = selectedCareerPath?.title || 'Career';
    return [
      {
        id: 'core-skills',
        title: `${careerTitle} Core Skills`,
        description: 'Master the essential skills required for your role',
        provider: 'NxtGrnd AI Pro',
        difficulty: 'Beginner',
        duration: '20-30 hours',
        progress: 0,
        category: 'fundamentals',
        resources: [
          {
            type: 'course',
            title: 'LinkedIn Learning Path',
            url: `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(careerTitle)}`,
            provider: 'LinkedIn Learning',
            description: 'Professional courses for your career path',
            rating: 4.5,
            duration: '20-30 hours'
          },
          {
            type: 'course',
            title: 'Udemy Courses',
            url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(careerTitle)}`,
            provider: 'Udemy',
            description: 'Hands-on tutorials and projects',
            rating: 4.3,
            duration: '15-25 hours'
          }
        ]
      },
      {
        id: 'professional-dev',
        title: 'Professional Development',
        description: 'Enhance your professional capabilities and soft skills',
        provider: 'NxtGrnd AI Pro',
        difficulty: 'Intermediate',
        duration: '15-20 hours',
        progress: 0,
        category: 'professional',
        resources: [
          {
            type: 'community',
            title: 'Professional Network',
            url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(careerTitle)}`,
            platform: 'Meetup',
            description: 'Join local professional groups',
            memberCount: 5000
          },
          {
            type: 'course',
            title: 'Coursera Professional Certificates',
            url: `https://www.coursera.org/search?query=${encodeURIComponent(careerTitle)}`,
            provider: 'Coursera',
            description: 'Industry-recognized credentials',
            rating: 4.6,
            duration: '40-60 hours'
          }
        ]
      },
      {
        id: 'advanced-skills',
        title: 'Advanced Specialization',
        description: 'Deep dive into advanced topics and specializations',
        provider: 'NxtGrnd AI Pro',
        difficulty: 'Advanced',
        duration: '30-40 hours',
        progress: 0,
        category: 'advanced',
        resources: [
          {
            type: 'certification',
            title: 'Industry Certification Prep',
            url: `https://www.coursera.org/search?query=${encodeURIComponent(careerTitle)}+certification`,
            provider: 'Various',
            description: 'Prepare for professional certifications',
            duration: '3-6 months'
          }
        ]
      }
    ];
  };

  // Save progress when it changes
  // storageUtils.setItem handles JSON stringification internally
  useEffect(() => {
    if (user?.userID && Object.keys(courseProgress).length > 0) {
      storageUtils.setItem(`courseProgress_${user.userID}`, courseProgress);
    }
  }, [courseProgress, user?.userID]);

  useEffect(() => {
    if (user?.userID && Object.keys(completedTasks).length > 0) {
      storageUtils.setItem(`completedTasks_${user.userID}`, completedTasks);
    }
  }, [completedTasks, user?.userID]);

  const markTaskComplete = (pathIndex, taskType) => {
    const taskKey = `${pathIndex}-${taskType}`;
    setCompletedTasks(prev => {
      const newCompletedTasks = { ...prev, [taskKey]: !prev[taskKey] };

      if (newCompletedTasks[taskKey]) {
        const path = learningPaths[pathIndex];
        analytics.trackTaskCompleted(path?.title || 'Unknown Path', taskType);
      }

      // Calculate new progress
      const path = learningPaths[pathIndex];
      if (path) {
        const totalTasks = (path.resources?.length || 0) + 1;
        const completedCount = Object.keys(newCompletedTasks).filter(key =>
          key.startsWith(`${pathIndex}-`) && newCompletedTasks[key]
        ).length;

        const newProgress = Math.round((completedCount / totalTasks) * 100);
        setCourseProgress(prevProgress => ({
          ...prevProgress,
          [pathIndex]: newProgress
        }));
      }

      return newCompletedTasks;
    });
  };

  // Filter and search
  const filteredPaths = useMemo(() => {
    let filtered = learningPaths;

    // Apply favorites filter
    if (activeFilter === 'favorites') {
      filtered = filtered.filter(path => favorites[path.id || path.title]);
    }
    // Apply category/difficulty filter
    else if (activeFilter !== 'all') {
      filtered = filtered.filter(path => path.category === activeFilter || path.difficulty?.toLowerCase() === activeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(path =>
        path.title?.toLowerCase().includes(query) ||
        path.description?.toLowerCase().includes(query) ||
        path.provider?.toLowerCase().includes(query) ||
        path.resources?.some(r => r.title?.toLowerCase().includes(query))
      );
    }

    return filtered;
  }, [learningPaths, activeFilter, searchQuery, favorites]);

  // Count favorites
  const favoritesCount = Object.values(favorites).filter(Boolean).length;

  const getIconForType = (type) => {
    switch (type) {
      case 'course': return <BookOpen className="h-5 w-5" />;
      case 'certification': return <Award className="h-5 w-5" />;
      case 'community': return <Users className="h-5 w-5" />;
      default: return <Link className="h-5 w-5" />;
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <FullPageLoader
        icon={BookOpen}
        message="Loading your learning paths..."
        subMessage="Preparing personalized recommendations"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Learning Paths</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => loadLearningPaths(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setStage(5)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStage(5)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Learning Paths</h1>
                  <p className="text-sm text-gray-500">{selectedCareerPath?.title || 'Your Career'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => loadLearningPaths(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <BookOpen className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{learningPaths.length}</p>
                <p className="text-sm text-gray-500">Total Paths</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(Object.values(courseProgress).reduce((a, b) => a + b, 0) / Math.max(learningPaths.length, 1))}%
                </p>
                <p className="text-sm text-gray-500">Avg Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Target className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(courseProgress).filter(p => p === 100).length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search learning paths, courses, providers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5">
                  <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
              {['all', 'favorites', 'beginner', 'intermediate', 'advanced'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setActiveFilter(filter)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                    activeFilter === filter
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filter === 'favorites' && <Heart className={`h-4 w-4 ${activeFilter === 'favorites' ? 'fill-current' : ''}`} />}
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'favorites' && favoritesCount > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      activeFilter === 'favorites' ? 'bg-white/20' : 'bg-blue-100 text-blue-600'
                    }`}>
                      {favoritesCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Learning Paths Grid */}
        {filteredPaths.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No learning paths found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPaths.map((path, index) => {
              const originalIndex = learningPaths.findIndex(p => p.title === path.title);
              const progress = courseProgress[originalIndex] || 0;
              const isExpanded = expandedPath === originalIndex;

              return (
                <div key={path.id || index} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {/* Path Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => setExpandedPath(isExpanded ? null : originalIndex)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900">{path.title}</h3>
                          {path.difficulty && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(path.difficulty)}`}>
                              {path.difficulty}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 mb-3">{path.description}</p>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Zap className="h-4 w-4" />
                            {path.provider}
                          </span>
                          {path.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {path.duration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-4 w-4" />
                            {path.resources?.length || 0} resources
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 ml-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => toggleFavorite(path.id || path.title, e)}
                            className={`p-2 rounded-full transition-colors ${
                              favorites[path.id || path.title]
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-gray-400 hover:text-red-500 hover:bg-gray-100'
                            }`}
                            title={favorites[path.id || path.title] ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart className={`h-5 w-5 ${favorites[path.id || path.title] ? 'fill-current' : ''}`} />
                          </button>
                          <div className="text-right">
                            <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                            <p className="text-sm text-gray-500">Complete</p>
                          </div>
                        </div>
                        <ChevronRight className={`h-5 w-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-4">
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div
                          className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-6">
                      <h4 className="font-medium text-gray-900 mb-4">Resources & Tasks</h4>

                      {/* Main Task */}
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markTaskComplete(originalIndex, 'main-lesson');
                            }}
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                              completedTasks[`${originalIndex}-main-lesson`]
                                ? 'bg-green-500 border-green-500'
                                : 'border-gray-300 hover:border-blue-500'
                            }`}
                          >
                            {completedTasks[`${originalIndex}-main-lesson`] && (
                              <CheckCircle className="h-4 w-4 text-white" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span className={`font-medium ${completedTasks[`${originalIndex}-main-lesson`] ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                              Complete: Introduction to {path.title}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Resource Cards */}
                      <div className="grid gap-4 sm:grid-cols-2">
                        {path.resources?.map((resource, resIndex) => (
                          <div key={resIndex} className="bg-white rounded-lg border p-4">
                            <div className="flex items-start gap-3">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markTaskComplete(originalIndex, `resource-${resIndex}`);
                                }}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors flex-shrink-0 mt-1 ${
                                  completedTasks[`${originalIndex}-resource-${resIndex}`]
                                    ? 'bg-green-500 border-green-500'
                                    : 'border-gray-300 hover:border-blue-500'
                                }`}
                              >
                                {completedTasks[`${originalIndex}-resource-${resIndex}`] && (
                                  <CheckCircle className="h-4 w-4 text-white" />
                                )}
                              </button>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="p-1.5 bg-blue-50 rounded">
                                    {getIconForType(resource.type)}
                                  </div>
                                  <span className="text-xs font-medium text-blue-600 uppercase">{resource.type}</span>
                                </div>
                                <h5 className={`font-medium mb-1 ${completedTasks[`${originalIndex}-resource-${resIndex}`] ? 'text-green-700 line-through' : 'text-gray-900'}`}>
                                  {resource.title}
                                </h5>
                                <p className="text-sm text-gray-600 mb-2">{resource.description}</p>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    {resource.rating && (
                                      <span className="flex items-center gap-1">
                                        <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                        {resource.rating}
                                      </span>
                                    )}
                                    {resource.duration && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-4 w-4" />
                                        {resource.duration}
                                      </span>
                                    )}
                                  </div>
                                  <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
                                  >
                                    Open <ExternalLink className="h-4 w-4" />
                                  </a>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Progress Summary */}
                      <div className="mt-6 pt-4 border-t flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {Object.keys(completedTasks).filter(key => key.startsWith(`${originalIndex}-`) && completedTasks[key]).length} of {(path.resources?.length || 0) + 1} tasks completed
                        </span>
                        {progress === 100 ? (
                          <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                            <CheckCircle className="h-4 w-4" />
                            Path Completed!
                          </div>
                        ) : (
                          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Continue Learning
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default LearningPathsPage;
