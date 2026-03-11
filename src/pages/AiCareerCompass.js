import React, { useState, useEffect, useContext } from 'react';
import {
  Compass, ChevronLeft, GitBranch, Briefcase,
  TrendingUp, Award, RefreshCw, Clock, BookOpen, Book,
  AlertCircle, User, RotateCcw, Info, Calendar, BarChart3, Target
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils, STORAGE_KEYS } from '../utils/authUtils';
import { storageService } from '../services/storageService';
import analytics from '../utils/analytics';
import CareerScenarioSimulator from '../components/CareerScenarioSimulator';
import API_CONFIG from '../config/api';
import { LoadingSpinner, FullPageLoader } from '../components/ui/AnimatedComponents';

// Import extracted components and services
import {
  CareerPathCard,
  RefreshOptionsBanner,
  MarketInsights,
  generateEnhancedRecommendations,
  generateDefaultTimeline,
  generateFallbackSimulation
} from '../components/career-compass';

// Enhanced AI Career Compass Component with refresh functionality
const EnhancedAICareerCompass = ({ setStage: setStageFromProps }) => {
  const { setStage: setStageFromContext } = useContext(UserContext);
  const setStage = setStageFromProps || setStageFromContext;
  const { user, setUser } = useContext(UserContext);
  const [selectedPath, setSelectedPath] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);
  const [simulationResults, setSimulationResults] = useState(null);
  const [isSimulationLoading, setIsSimulationLoading] = useState(false);

  // State for refresh functionality
  const [showRefreshOptions, setShowRefreshOptions] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Function to clear all cached data
  const clearAllCachedData = () => {
    storageUtils.removeItem(STORAGE_KEYS.COMPASS_CACHE);
    storageUtils.removeItem(STORAGE_KEYS.CAREER_PATH);
    storageUtils.removeItem(STORAGE_KEYS.USER_DASHBOARD);

    setUser(prevUser => ({
      ...prevUser,
      selectedCareerPath: null
    }));
  };

  // Function to handle updating skills and resume
  const handleUpdateSkillsAndResume = () => {
    clearAllCachedData();
    setStage(3);
  };

  // Function to refresh recommendations with current data
  const handleRefreshRecommendations = async () => {
    setIsRefreshing(true);

    try {
      storageUtils.removeItem(STORAGE_KEYS.COMPASS_CACHE);

      const data = await generateEnhancedRecommendations(user, true, true);

      if (data && data.careerPaths && data.careerPaths.length > 0) {
        storageUtils.setItem(STORAGE_KEYS.COMPASS_CACHE, data);
        setEnhancedData(data);
      }

      setShowRefreshOptions(false);
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to refresh recommendations. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStageChange = (newStage) => {
    if (typeof setStage === 'function') {
      setStage(newStage);
    }
  };

  // Check for stored selection on component mount
  useEffect(() => {
    const storedPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH);
    if (storedPath && !selectedPath) {
      setSelectedPath(storedPath);
    }
  }, [selectedPath]);

  // Fetch enhanced recommendations on component mount
  useEffect(() => {
    const fetchEnhancedData = async () => {
      const cachedData = storageUtils.getItem(STORAGE_KEYS.COMPASS_CACHE);
      const hasExistingPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH);
      const isReturning = !!(cachedData || hasExistingPath);
      setIsReturningUser(isReturning);

      if (isReturning) {
        setShowRefreshOptions(true);
      }

      if (cachedData) {
        setEnhancedData(cachedData);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await generateEnhancedRecommendations(user, true);

        if (data && data.careerPaths && data.careerPaths.length > 0) {
          storageUtils.setItem(STORAGE_KEYS.COMPASS_CACHE, data);
        }

        setEnhancedData(data);
      } catch (error) {
        console.error('Error fetching enhanced data:', error);
        setError('Failed to load enhanced recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.userID) {
      fetchEnhancedData();
    }
  }, [user?.userID]);

  // Run simulation function
  const runSimulation = async (scenarioType) => {
    if (!selectedPath) return;

    setIsSimulationLoading(true);
    analytics.trackEvent('career_simulation_run', {
      careerPath: selectedPath.title,
      scenarioType: scenarioType
    });

    try {
      const simulationPayload = {
        userId: user?.userID,
        careerPath: selectedPath.title,
        scenarioType,
        experienceLevel: user?.experienceLevel || 'entry',
        skills: selectedPath.requiredSkills || [],
        currentSalary: parseInt(selectedPath.salaryRange?.split('-')?.[0]?.replace(/\D/g, '') || '50000') || 50000,
        timeframe: '5years',
        includeDetails: true
      };

      const response = await fetch(
        API_CONFIG.recommendations.generate(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/recommendations/generate',
            body: JSON.stringify({
              requestType: 'career_simulation',
              ...simulationPayload
            })
          })
        }
      );

      const data = await response.json();
      const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;

      setSimulationResults(parsedBody.recommendations?.simulation || generateFallbackSimulation(selectedPath, scenarioType));
    } catch (error) {
      console.error('Simulation error:', error);
      setSimulationResults(generateFallbackSimulation(selectedPath, scenarioType));
    } finally {
      setIsSimulationLoading(false);
    }
  };

  const renderSimulationResults = () => {
    if (!simulationResults) return null;

    return (
      <div className="mt-6 border-t pt-6">
        <h4 className="text-lg font-semibold mb-4">Simulation Results</h4>

        <div className="space-y-4">
          <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-100">
            <h5 className="font-medium mb-2 text-blue-900">Career Impact</h5>
            <p className="text-gray-700">{simulationResults.impact}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-xl">
              <h5 className="font-medium mb-2">Projected Salary Increase</h5>
              <p className="text-2xl font-bold text-green-600">
                +{simulationResults.salaryIncrease}%
              </p>
            </div>
            <div className="bg-teal-50 p-4 rounded-xl">
              <h5 className="font-medium mb-2">Time Investment</h5>
              <p className="text-2xl font-bold text-teal-600">
                {simulationResults.timeInvestment}
              </p>
            </div>
          </div>

          {simulationResults.milestones && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h5 className="font-medium mb-3 text-gray-900">Key Milestones</h5>
              <div className="space-y-3">
                {simulationResults.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-gradient-to-br from-blue-100 to-teal-100 rounded-xl">
                      {milestone.type === 'certification' ? (
                        <Award className="h-4 w-4 text-blue-900" />
                      ) : milestone.type === 'skill' ? (
                        <Book className="h-4 w-4 text-blue-900" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-blue-900" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{milestone.title}</p>
                      <p className="text-sm text-gray-500">{milestone.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {simulationResults.recommendations && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
              <h5 className="font-medium mb-3 text-gray-900">Recommendations</h5>
              <ul className="space-y-2">
                {simulationResults.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-teal-500">•</span>
                    {rec}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Render timeline section
  const renderTimeline = () => {
    const timelineSteps = selectedPath.roadmap?.steps?.length > 0
      ? selectedPath.roadmap.steps
      : selectedPath.timeline?.length > 0
        ? selectedPath.timeline
        : generateDefaultTimeline(selectedPath);

    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold mb-4">Career Timeline</h3>
        <div className="space-y-8">
          {timelineSteps.map((step, index, steps) => (
            <div key={`step-${index}-${step.title}`} className="relative flex items-start mb-8">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                  {index === 0 ? (
                    <BookOpen className="w-6 h-6 text-blue-600" />
                  ) : index === steps.length - 1 ? (
                    <Award className="w-6 h-6 text-blue-600" />
                  ) : (
                    <Briefcase className="w-6 h-6 text-blue-600" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-blue-200" />
                )}
              </div>
              <div className="ml-4 flex-grow">
                <h4 className="text-lg font-medium">{step.title}</h4>
                <p className="text-gray-600 mt-1">{step.description}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">{step.timeline}</span>
                </div>
                {step.resources && step.resources.length > 0 && (
                  <div className="mt-3">
                    <h5 className="text-sm font-medium text-gray-700">Recommended Resources:</h5>
                    <ul className="mt-1 list-disc list-inside text-sm text-gray-600">
                      {step.resources.map((resource, idx) => (
                        <li key={idx}>{resource}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render market analysis section
  const renderMarketAnalysis = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Market Analysis</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-xl">
          <h4 className="font-medium mb-2">Growth Rate</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-900">
              {selectedPath.marketData?.growthRate ?
                (selectedPath.marketData.growthRate.toString().includes('%') ?
                  selectedPath.marketData.growthRate :
                  `${selectedPath.marketData.growthRate}%`) :
                selectedPath.growthRate ?
                  (selectedPath.growthRate.toString().includes('%') ?
                    selectedPath.growthRate :
                    `${selectedPath.growthRate}%`) :
                  'Loading...'
              }
            </span>
            <span className="text-sm text-gray-600">Annual</span>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-xl">
          <h4 className="font-medium mb-2">Market Demand</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              {selectedPath.marketData?.demand || selectedPath.demand || 'Loading...'}
            </span>
          </div>
        </div>
        <div className="bg-teal-50 p-4 rounded-xl">
          <h4 className="font-medium mb-2">Job Openings</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-teal-600">
              {selectedPath.marketData?.jobOpenings?.toLocaleString() || 'Loading...'}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Top Skills in Demand</h4>
        <div className="flex flex-wrap gap-2">
          {(selectedPath.marketData?.topSkills || selectedPath.requiredSkills || []).map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {typeof skill === 'object' ? `${skill.name} (${skill.demand}%)` : skill}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Industry Distribution</h4>
        <div className="space-y-3">
          {selectedPath.marketData?.industries?.length > 0 ? (
            selectedPath.marketData.industries.map((industry, index) => (
              <div key={industry.id || industry.name || index}>
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-600">{industry.name}</span>
                  <span className="text-sm font-medium">{industry.percentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 rounded-full h-2"
                    style={{ width: `${industry.percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">Loading industry distribution data...</p>
            </div>
          )}
        </div>
      </div>

      <MarketInsights pathId={selectedPath.id} path={selectedPath} />
    </div>
  );

  if (isLoading && !isRefreshing) {
    return (
      <FullPageLoader
        icon={Compass}
        message="Loading career insights..."
        subMessage="Analyzing your profile and career preferences"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-8 max-w-md">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => handleStageChange(3)}
            className="px-6 py-3 bg-gradient-to-r from-blue-900 to-teal-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
          >
            Return to Previous Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Hero Header Card */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8">
          {/* Gradient Header */}
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-600 px-6 sm:px-8 py-8 text-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => handleStageChange(5)}
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <div className="p-3 bg-white/10 backdrop-blur-sm rounded-2xl">
                  <Compass className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">AI Career Compass</h1>
                  <p className="text-blue-100 mt-1">AI-Powered career insights and personalized guidance</p>
                </div>
              </div>
              {user?.selectedCareerPath && (
                <button
                  onClick={() => handleStageChange(5)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm font-medium transition-colors"
                >
                  Go to Dashboard
                </button>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="px-6 sm:px-8 py-4 bg-gradient-to-r from-blue-50/50 to-teal-50/50 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">{enhancedData?.careerPaths?.length || 0}</p>
              <p className="text-sm text-gray-600">Career Paths</p>
            </div>
            <div className="text-center border-x border-gray-200">
              <p className="text-2xl font-bold text-teal-600">{selectedPath ? '1' : '0'}</p>
              <p className="text-sm text-gray-600">Selected</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-blue-900">AI</p>
              <p className="text-sm text-gray-600">Powered</p>
            </div>
          </div>
        </div>

        {/* Refresh Options Banner */}
        {showRefreshOptions && isReturningUser && (
          <RefreshOptionsBanner
            onUpdateSkills={handleUpdateSkillsAndResume}
            onRefreshRecommendations={handleRefreshRecommendations}
            onDismiss={() => setShowRefreshOptions(false)}
          />
        )}

        {/* Loading overlay for refresh */}
        {isRefreshing && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-3xl p-8 text-center shadow-2xl max-w-sm mx-4">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <RefreshCw className="h-8 w-8 text-blue-900 animate-spin" />
              </div>
              <p className="text-xl font-bold text-gray-900">Getting Fresh Recommendations...</p>
              <p className="text-gray-500 mt-2">Using AI to analyze your updated preferences</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Career Paths Section */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
              <div className="bg-gradient-to-r from-blue-50 to-teal-50 px-6 py-4 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <GitBranch className="h-5 w-5 text-blue-900" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">AI-Recommended Paths</h2>
                  </div>
                  <button
                    onClick={handleRefreshRecommendations}
                    disabled={isRefreshing}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {enhancedData?.careerPaths?.length > 0 ? (
                  enhancedData.careerPaths.map(path => (
                    <CareerPathCard
                      key={path.id}
                      path={path}
                      onSelect={setSelectedPath}
                      isSelected={selectedPath?.id === path.id}
                    />
                  ))
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <GitBranch className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No career paths available at this time.</p>
                    <p className="text-sm text-gray-400 mt-2">Please try refreshing or contact support.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Content Section */}
            {selectedPath && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                {/* Selected Path Header */}
                <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-600 px-6 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedPath.title}</h3>
                      <p className="text-sm text-blue-100">{selectedPath.salaryRange || 'Salary info available'}</p>
                    </div>
                  </div>
                </div>

                {/* Modern Pill Tabs */}
                <div className="bg-gradient-to-r from-blue-50 to-teal-50 px-6 py-4">
                  <nav className="flex gap-2 flex-wrap" aria-label="Tabs">
                    {[
                      { id: 'overview', label: 'Overview', Icon: Info },
                      { id: 'timeline', label: 'Timeline', Icon: Calendar },
                      { id: 'market', label: 'Market', Icon: BarChart3 },
                      { id: 'simulation', label: 'Simulation', Icon: Target }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-200 flex items-center gap-2
                          ${activeTab === tab.id
                            ? 'bg-white text-blue-900 shadow-md'
                            : 'text-gray-600 hover:bg-white/60 hover:text-gray-900'
                          }`}
                      >
                        <tab.Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-6">

                {activeTab === 'overview' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4">Path Overview</h3>
                    <div className="space-y-4">
                      <p className="text-gray-600">{selectedPath.description}</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                        <div>
                          <h4 className="font-medium mb-2">Key Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {(selectedPath.requiredSkills || []).map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Salary Range</h4>
                          <p className="text-lg font-medium text-gray-900">{selectedPath.salaryRange || 'Contact for details'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && renderTimeline()}
                {activeTab === 'market' && renderMarketAnalysis()}

                {activeTab === 'simulation' && (
                  <CareerScenarioSimulator
                    selectedPath={selectedPath}
                    user={user}
                  />
                )}
                </div>
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {selectedPath && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-900 to-teal-600 px-6 py-4 text-white">
                  <div className="flex items-center gap-3">
                    <Award className="h-6 w-6" />
                    <h2 className="text-lg font-semibold">Next Steps</h2>
                  </div>
                </div>
                <div className="p-6 space-y-4">
                  <ul className="space-y-3">
                    {(selectedPath.nextSteps || selectedPath.recommendedActions || [
                      `Research ${selectedPath.title} job requirements`,
                      "Build relevant skills through online courses",
                      "Create projects for your portfolio",
                      "Network with professionals in the field",
                      "Apply for entry-level positions or internships"
                    ]).map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-7 h-7 rounded-xl bg-gradient-to-br from-blue-100 to-teal-100 text-blue-900 text-sm font-medium flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={async () => {
                      analytics.trackCareerPathSelected(selectedPath);

                      // Clear dashboard cache for new career path selection (user-scoped)
                      storageService.removeItem(STORAGE_KEYS.USER_DASHBOARD);

                      setUser(prevUser => ({
                        ...prevUser,
                        selectedCareerPath: selectedPath
                      }));

                      // Store career path with user-scoped key AND sync to DynamoDB
                      storageService.setItem(STORAGE_KEYS.CAREER_PATH, selectedPath);

                      await new Promise(resolve => setTimeout(resolve, 100));
                      handleStageChange(5);
                    }}
                    className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                  >
                    Select This Path
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions for returning users */}
            {isReturningUser && (
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-4 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <RotateCcw className="h-5 w-5 text-blue-900" />
                    </div>
                    <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <button
                    onClick={handleUpdateSkillsAndResume}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all"
                  >
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <User className="h-5 w-5 text-blue-900" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Update Profile</p>
                      <p className="text-sm text-gray-500">Change skills & upload new resume</p>
                    </div>
                  </button>
                  <button
                    onClick={handleRefreshRecommendations}
                    disabled={isRefreshing}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-gray-200 rounded-xl hover:border-teal-300 hover:bg-teal-50 transition-all disabled:opacity-50"
                  >
                    <div className="p-2 bg-teal-50 rounded-lg">
                      <RefreshCw className={`h-5 w-5 text-teal-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">Fresh Recommendations</p>
                      <p className="text-sm text-gray-500">Get new AI-powered suggestions</p>
                    </div>
                  </button>
                  <button
                    onClick={() => clearAllCachedData()}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left border border-red-200 rounded-xl hover:border-red-300 hover:bg-red-50 transition-all"
                  >
                    <div className="p-2 bg-red-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                    </div>
                    <div>
                      <p className="font-medium text-red-900">Start Over</p>
                      <p className="text-sm text-red-500">Clear all data & begin fresh</p>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAICareerCompass;
