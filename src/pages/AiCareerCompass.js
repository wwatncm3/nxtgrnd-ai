import React, { useState, useEffect, useContext } from 'react';
import {
  Compass, ChevronLeft, GitBranch, Briefcase,
  TrendingUp, Award, RefreshCw, Clock, BookOpen, Book,
  AlertCircle, User, RotateCcw
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

  console.log('Component mounted with setStage:', setStage);

  // Function to clear all cached data
  const clearAllCachedData = () => {
    console.log('Clearing all cached career data...');

    storageUtils.removeItem(STORAGE_KEYS.COMPASS_CACHE);
    storageUtils.removeItem(STORAGE_KEYS.CAREER_PATH);
    storageUtils.removeItem(STORAGE_KEYS.USER_DASHBOARD);

    setUser(prevUser => ({
      ...prevUser,
      selectedCareerPath: null
    }));

    console.log('All cached career data cleared');
  };

  // Function to handle updating skills and resume
  const handleUpdateSkillsAndResume = () => {
    console.log('Redirecting to skills and resume update...');
    clearAllCachedData();
    setStage(3);
  };

  // Function to refresh recommendations with current data
  const handleRefreshRecommendations = async () => {
    console.log('Refreshing recommendations with current data...');
    setIsRefreshing(true);

    try {
      storageUtils.removeItem(STORAGE_KEYS.COMPASS_CACHE);

      const data = await generateEnhancedRecommendations(user, true, true);

      if (data && data.careerPaths && data.careerPaths.length > 0) {
        storageUtils.setItem(STORAGE_KEYS.COMPASS_CACHE, data);
        setEnhancedData(data);
      }

      setShowRefreshOptions(false);
      console.log('Recommendations refreshed successfully');
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
      setError('Failed to refresh recommendations. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleStageChange = (newStage) => {
    console.log('Attempting to change stage to:', newStage);
    if (typeof setStage === 'function') {
      setStage(newStage);
    } else {
      console.error('setStage is not a function:', setStage);
    }
  };

  // Check for stored selection on component mount
  useEffect(() => {
    const storedPath = storageUtils.getItem(STORAGE_KEYS.CAREER_PATH);
    if (storedPath && !selectedPath) {
      console.log('Retrieved stored career path:', storedPath.title);
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
        console.log('Detected returning user - showing refresh options');
        setShowRefreshOptions(true);
      }

      if (cachedData) {
        console.log('Restoring Career Compass recommendations from session storage');
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
        currentSalary: parseInt(selectedPath.salaryRange?.split('-')[0].replace(/\D/g, '')) || 50000,
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
      const parsedBody = JSON.parse(data.body);

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
          <div className="bg-blue-50 p-4 rounded-lg">
            <h5 className="font-medium mb-2">Career Impact</h5>
            <p className="text-gray-700">{simulationResults.impact}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Projected Salary Increase</h5>
              <p className="text-2xl font-bold text-green-600">
                +{simulationResults.salaryIncrease}%
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2">Time Investment</h5>
              <p className="text-2xl font-bold text-purple-600">
                {simulationResults.timeInvestment}
              </p>
            </div>
          </div>

          {simulationResults.milestones && (
            <div className="bg-white border rounded-lg p-4">
              <h5 className="font-medium mb-3">Key Milestones</h5>
              <div className="space-y-3">
                {simulationResults.milestones.map((milestone, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      {milestone.type === 'certification' ? (
                        <Award className="h-4 w-4 text-blue-600" />
                      ) : milestone.type === 'skill' ? (
                        <Book className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Briefcase className="h-4 w-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{milestone.title}</p>
                      <p className="text-sm text-gray-600">{milestone.timeline}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {simulationResults.recommendations && (
            <div className="bg-white border rounded-lg p-4">
              <h5 className="font-medium mb-3">Recommendations</h5>
              <ul className="space-y-2">
                {simulationResults.recommendations.map((rec, index) => (
                  <li key={index} className="text-sm text-gray-700">• {rec}</li>
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
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Growth Rate</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
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
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Market Demand</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              {selectedPath.marketData?.demand || selectedPath.demand || 'Loading...'}
            </span>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Job Openings</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">
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
        message="Loading career insights..."
        subMessage="Analyzing your profile and career preferences"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={() => handleStageChange(3)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Return to Previous Step
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header Navigation */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => handleStageChange(5)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Dashboard
          </button>

          {user?.selectedCareerPath && (
            <button
              onClick={() => handleStageChange(5)}
              className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Go to Dashboard
            </button>
          )}
        </div>

        {/* Page Title */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Compass className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Career Compass</h1>
              <p className="text-gray-600 mt-1">AI-Powered career insights and personalized guidance</p>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-8 text-center">
              <LoadingSpinner size="lg" showDots />
              <p className="text-lg font-medium mt-6">Getting Fresh Recommendations...</p>
              <p className="text-gray-600 mt-2">Using AI to analyze your updated preferences</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Career Paths Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">AI-Recommended Paths</h2>
                </div>
                <button
                  onClick={handleRefreshRecommendations}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              <div className="space-y-4">
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
                    <p className="text-gray-500">No career paths available at this time.</p>
                    <p className="text-sm text-gray-400 mt-2">Please try refreshing or contact support.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Dynamic Content Section */}
            {selectedPath && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="border-b mb-6">
                  <nav className="flex space-x-8" aria-label="Tabs">
                    {[
                      { id: 'overview', label: 'Overview' },
                      { id: 'timeline', label: 'Timeline' },
                      { id: 'market', label: 'Market' },
                      { id: 'simulation', label: 'Simulation' }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`py-4 px-1 border-b-2 font-medium text-sm
                          ${activeTab === tab.id
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                          }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                </div>

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
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {selectedPath && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Next Steps</h2>
                </div>
                <div className="space-y-4">
                  <ul className="space-y-3">
                    {(selectedPath.nextSteps || selectedPath.recommendedActions || [
                      `Research ${selectedPath.title} job requirements`,
                      "Build relevant skills through online courses",
                      "Create projects for your portfolio",
                      "Network with professionals in the field",
                      "Apply for entry-level positions or internships"
                    ]).map((step, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 text-sm flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-gray-700">{step}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={async () => {
                      console.log('Selected path:', selectedPath);
                      analytics.trackCareerPathSelected(selectedPath);

                      // Clear dashboard cache for new career path selection (user-scoped)
                      storageService.removeItem(STORAGE_KEYS.USER_DASHBOARD);
                      console.log('Cleared dashboard cache for new career path selection');

                      setUser(prevUser => ({
                        ...prevUser,
                        selectedCareerPath: selectedPath
                      }));

                      // Store career path with user-scoped key AND sync to DynamoDB
                      storageService.setItem(STORAGE_KEYS.CAREER_PATH, selectedPath);

                      await new Promise(resolve => setTimeout(resolve, 100));
                      handleStageChange(5);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                  >
                    Select This Path
                  </button>
                </div>
              </div>
            )}

            {/* Quick Actions for returning users */}
            {isReturningUser && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-4">
                  <RotateCcw className="h-6 w-6 text-gray-600" />
                  <h2 className="text-xl font-semibold">Quick Actions</h2>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={handleUpdateSkillsAndResume}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                  >
                    <User className="h-5 w-5 text-gray-600" />
                    <div>
                      <p className="font-medium text-gray-900">Update Profile</p>
                      <p className="text-sm text-gray-600">Change skills & upload new resume</p>
                    </div>
                  </button>
                  <button
                    onClick={handleRefreshRecommendations}
                    disabled={isRefreshing}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`h-5 w-5 text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} />
                    <div>
                      <p className="font-medium text-gray-900">Fresh Recommendations</p>
                      <p className="text-sm text-gray-600">Get new AI-powered suggestions</p>
                    </div>
                  </button>
                  <button
                    onClick={() => clearAllCachedData()}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left border border-red-200 rounded-lg hover:border-red-300 hover:bg-red-50 transition-colors"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-900">Start Over</p>
                      <p className="text-sm text-red-600">Clear all data & begin fresh</p>
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
