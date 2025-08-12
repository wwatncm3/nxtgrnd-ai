import React, { useState, useEffect, useContext } from 'react';
import { 
  Compass, ChevronLeft, GitBranch, Briefcase, 
  TrendingUp, Star, Users, CircleDollarSign,
  Building2, GraduationCap, ChevronRight, BarChart, 
  Award, MapPin, RefreshCw, LineChart, Clock, BookOpen, Book,
  AlertCircle, User, Upload, RotateCcw
} from 'lucide-react';
import { UserContext } from '../App';
import _ from 'lodash';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';

// CareerPathCard Component (unchanged)
const CareerPathCard = ({ path, onSelect, isSelected }) => (
  <button
    onClick={() => onSelect(path)}
    className={`w-full text-left p-6 rounded-xl border-2 transition-all
      ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
  >
    <div className="flex items-start gap-4">
      <div className={`p-3 rounded-lg ${isSelected ? 'bg-blue-500' : 'bg-gray-100'}`}>
        <GitBranch className={`h-6 w-6 ${isSelected ? 'text-white' : 'text-gray-600'}`} />
      </div>
      <div>
        <h3 className="font-semibold text-lg mb-2">{path.title}</h3>
        <p className="text-gray-600 mb-4">{path.description}</p>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-gray-500">Salary Range</p>
            <p className="font-medium">{path.salaryRange || 'Contact for details'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Match Score</p>
            <div className="flex items-center gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 rounded-full h-2"
                  style={{ width: `${path.matchScore || 0}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 ml-2">{path.matchScore || 0}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {(path.requiredSkills || []).map((skill, index) => (
              <span 
                key={index}
                className={`px-2 py-1 rounded-full text-sm
                  ${isSelected ? 'bg-blue-200 text-blue-800' : 'bg-gray-100 text-gray-700'}`}
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  </button>
);

// Refresh Options Banner Component
const RefreshOptionsBanner = ({ onUpdateSkills, onRefreshRecommendations, onDismiss }) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-6">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <RotateCcw className="h-5 w-5 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Update Your Career Path</h3>
        </div>
        <p className="text-gray-600 mb-4">
          Want to explore different options? You can update your skills, upload a new resume, or get fresh AI recommendations based on your current preferences.
        </p>
        
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onUpdateSkills}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <User className="h-4 w-4" />
            Update Skills & Resume
          </button>
          <button
            onClick={onRefreshRecommendations}
            className="flex items-center gap-2 px-4 py-2 bg-white text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Get Fresh Recommendations
          </button>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
    </div>
  </div>
);

// Enhanced recommendation generation (same as before but with force refresh option)
const generateEnhancedRecommendations = async (user, includePredictions = true, forceRefresh = false) => {
  if (!user?.userID) {
    console.error('No user ID provided for recommendations');
    return null;
  }
  console.log('Starting generateEnhancedRecommendations...', { forceRefresh });
  console.log('User data:', {
    userID: user?.userID,
    interests: user?.interests,
    skills: user?.skills,
    pathType: user?.pathType,
    careerStage: user?.careerStage
  });
  console.log('Include predictions:', includePredictions);
  
  try {
    const recommendationPayload = {
      userId: user?.userID,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      pathType: user?.pathType,
      careerStage: user?.careerStage,
      primaryGoal: user?.primaryGoal,
      interests: Array.isArray(user?.interests) ? user.interests : [],
      skills: Array.isArray(user?.skills) ? user.skills : [],
      experienceLevel: user?.experienceLevel || user?.careerStage || 'entry',
      includeEnhancedDetails: true,
      includePredictions,
      forceRefresh, // Add this flag to bypass any server-side caching
      detailsRequested: [
        'roleDescription',
        'salaryRangeByExperience',
        'marketDemand',
        'growthPotential',
        'careerSimulations',
        'skillImpactAnalysis',
        'marketTrendPredictions',
        'recommendedMilestones',
        'learningPathways',
        'roadmapSteps',
        'marketData'
      ]
    };

    const recPayload = {
      httpMethod: 'POST',
      path: '/recommendations/generate',
      body: JSON.stringify(recommendationPayload),
    };

    const response = await fetch(
      'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(recPayload),
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch enhanced recommendations');
    }

    const data = await response.json();
    const parsedBody = JSON.parse(data.body);
    
    return {
      careerPaths: parsedBody.recommendations?.careerPaths || [],
      marketTrends: parsedBody.recommendations?.marketTrends || [],
      simulations: parsedBody.recommendations?.careerSimulations || [],
      skillImpact: parsedBody.recommendations?.skillImpactAnalysis || []
    };
  } catch (error) {
    console.error('Error generating enhanced recommendations:', error);
    throw error;
  }
};

// Enhanced Timeline Component (same as before)
const CareerTimeline = ({ path, onMilestoneSelect }) => {
  const [milestones, setMilestones] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('CareerTimeline: Fetching milestones for path:', path);
    
    const fetchMilestones = async () => {
      setIsLoading(true);
      try {
        const payload = {
          httpMethod: 'POST',
          path: '/recommendations/generate',
          body: JSON.stringify({
            pathId: path.id,
            requestType: 'milestones',
            experienceLevel: path.experienceLevel,
            includeTimelines: true,
            pathType: path.type || 'career',
            skills: path.requiredSkills || []
          })
        };
        
        console.log('CareerTimeline: Sending milestone request with payload:', payload);
        
        const response = await fetch(
          'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              httpMethod: 'POST',
              path: '/recommendations/generate',
              body: JSON.stringify({
                pathId: path.id,
                requestType: 'milestones',
                experienceLevel: path.experienceLevel,
                includeTimelines: true
              })
            })
          }
        );

        const data = await response.json();
        const parsedBody = JSON.parse(data.body);
        setMilestones(parsedBody.recommendations?.milestones || []);
      } catch (error) {
        console.error('Error fetching milestones:', error);
        setMilestones([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (path?.id) {
      fetchMilestones();
    }
  }, [path.id]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div
          key={index}
          className="relative flex items-start mb-8 cursor-pointer group"
          onClick={() => onMilestoneSelect && onMilestoneSelect(milestone)}
        >
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              {milestone.type === 'skill' ? (
                <Award className="w-6 h-6 text-blue-600" />
              ) : (
                <Briefcase className="w-6 h-6 text-blue-600" />
              )}
            </div>
            {index < milestones.length - 1 && (
              <div className="absolute left-6 top-12 bottom-0 w-0.5 bg-blue-200" />
            )}
          </div>
          <div className="ml-4 flex-grow">
            <h4 className="text-lg font-medium">{milestone.title}</h4>
            <p className="text-gray-600 mt-1">{milestone.description}</p>
            <div className="mt-2 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">{milestone.timeline}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

// Market Insights Component (same as before)
const MarketInsights = ({ pathId, path }) => {
  console.log('MarketInsights: Rendering with pathId:', pathId, 'and path:', path);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('MarketInsights: Starting to fetch insights for pathId:', pathId);
    
    const fetchMarketInsights = async () => {
      setIsLoading(true);
      try {
        const payload = {
          httpMethod: 'POST',
          path: '/recommendations/generate',
          body: JSON.stringify({
            pathId,
            requestType: 'market_insights',
            includeProjections: true,
            location: 'United States',
            timeframe: '5years'
          })
        };

        console.log('MarketInsights: Sending request with payload:', payload);
        
        const response = await fetch(
          'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              httpMethod: 'POST',
              path: '/recommendations/generate',
              body: JSON.stringify({
                pathId,
                requestType: 'market_insights',
                includeProjections: true
              })
            })
          }
        );

        const data = await response.json();
        console.log('MarketInsights: Received raw data:', data);
        
        let parsedBody;
        try {
          parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
          console.log('MarketInsights: Parsed body:', parsedBody);
        } catch (parseError) {
          console.error('MarketInsights: Error parsing response body:', parseError);
          throw new Error('Invalid response format');
        }
        
        if (!parsedBody?.recommendations?.marketInsights) {
          console.warn('MarketInsights: No market insights found in response');
          throw new Error('No market insights available');
        }
        
        setInsights(parsedBody.recommendations.marketInsights);
      } catch (error) {
        console.error('Error fetching market insights:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    if (pathId) {
      fetchMarketInsights();
    }
  }, [pathId]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Unable to load market insights at this time.</p>
        <p className="text-sm text-gray-400 mt-2">{error}</p>
      </div>
    );
  }

  if (!insights) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Demand Growth</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {insights.demandGrowth}%
            </span>
            <span className="text-sm text-gray-600">YoY</span>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Avg. Salary</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">
              ${insights.averageSalary.toLocaleString()}
            </span>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Open Positions</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">
              {insights.openPositions.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Top Required Skills</h4>
        <div className="flex flex-wrap gap-2">
          {insights.requiredSkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill.name} ({skill.demandPercentage}%)
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Industry Distribution</h4>
        <div className="space-y-3">
          {insights.industryDistribution.map((industry, index) => (
            <div key={index}>
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
          ))}
        </div>
      </div>
    </div>
  );
};

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
  
  // New state for refresh functionality
  const [showRefreshOptions, setShowRefreshOptions] = useState(false);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  console.log('Component mounted with setStage:', setStage);

  // Function to clear all cached data
  const clearAllCachedData = () => {
    console.log('Clearing all cached career data...');
    
    // Clear AI Career Compass cache
    const COMPASS_CACHE_KEY = `aiCareerCompassRecs_${user?.userID}`;
    storageUtils.removeItem(COMPASS_CACHE_KEY);
    
    // Clear selected career path
    storageUtils.removeItem('selectedCareerPath');
    
    // Clear dashboard cache
    const USER_DASHBOARD_KEY = 'userDashboard';
    storageUtils.removeItem(`${USER_DASHBOARD_KEY}_${user?.userID}`);
    
    // Clear user state
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
    setStage(3); // Go to InterestSelection stage
  };

  // Function to refresh recommendations with current data
  const handleRefreshRecommendations = async () => {
    console.log('Refreshing recommendations with current data...');
    setIsRefreshing(true);
    
    try {
      // Clear cached recommendations
      const COMPASS_CACHE_KEY = `aiCareerCompassRecs_${user?.userID}`;
      storageUtils.removeItem(COMPASS_CACHE_KEY);
      
      // Fetch fresh data from API
      const data = await generateEnhancedRecommendations(user, true, true); // forceRefresh = true
      
      if (data && data.careerPaths && data.careerPaths.length > 0) {
        storageUtils.setItem(COMPASS_CACHE_KEY, JSON.stringify(data));
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

  // Debugging log for stage navigation
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
    const storedPath = storageUtils.getItem('selectedCareerPath');
    if (storedPath && !selectedPath) {
      try {
        const pathData = JSON.parse(storedPath);
        console.log('Retrieved stored career path:', pathData.title);
        setSelectedPath(pathData);
      } catch (error) {
        console.error('Error parsing stored career path:', error);
      }
    }
  }, [selectedPath]);

  // Fetch enhanced recommendations on component mount
  useEffect(() => {
    const COMPASS_CACHE_KEY = `aiCareerCompassRecs_${user?.userID}`;

    const fetchEnhancedData = async () => {
      // 1. Check for cached data first
      const cachedData = storageUtils.getItem(COMPASS_CACHE_KEY);
      
      // 2. Check if user is returning (has cached data or selected career path)
      const hasExistingPath = storageUtils.getItem('selectedCareerPath');
      const isReturning = !!(cachedData || hasExistingPath);
      setIsReturningUser(isReturning);
      
      if (isReturning) {
        console.log('Detected returning user - showing refresh options');
        setShowRefreshOptions(true);
      }
      
      if (cachedData) {
        console.log('Restoring Career Compass recommendations from session storage');
        try {
          setEnhancedData(JSON.parse(cachedData));
          setIsLoading(false);
          return; // Exit early if we have cached data
        } catch (parseError) {
          console.error('Error parsing cached data:', parseError);
          // Continue to fetch fresh data if cache is corrupted
        }
      }

      // 3. If no cache, fetch new data from the API
      try {
        setIsLoading(true);
        const data = await generateEnhancedRecommendations(user, true);

        // 4. Save the new data to the cache
        if (data && data.careerPaths && data.careerPaths.length > 0) {
          storageUtils.setItem(COMPASS_CACHE_KEY, JSON.stringify(data));
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

  // Add simulation functions (same as before)
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
        'https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/generate',
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

      // Fallback data if API fails
      setSimulationResults(parsedBody.recommendations?.simulation || {
        impact: `Based on ${scenarioType.replace('_', ' ')}, your ${selectedPath.title} career trajectory shows significant potential for growth and advancement.`,
        salaryIncrease: Math.floor(Math.random() * 30 + 20),
        timeInvestment: scenarioType === 'certification' ? '6-12 months' : '12-18 months',
        milestones: [
          {
            type: scenarioType === 'certification' ? 'certification' : 'skill',
            title: scenarioType === 'certification' 
              ? `${selectedPath.title} Professional Certification`
              : `Advanced ${selectedPath.title} Skills`,
            timeline: scenarioType === 'certification' ? '6-12 months' : '3-6 months'
          },
          {
            type: 'experience',
            title: `${selectedPath.title} Portfolio Project`,
            timeline: '1-3 months'
          }
        ],
        recommendations: [
          `Focus on ${selectedPath.requiredSkills?.[0] || 'core competencies'} development`,
          `Build practical ${selectedPath.title.toLowerCase()} experience through projects`,
          `Network with ${selectedPath.title} professionals in your target industry`,
          `Stay updated with latest trends in ${selectedPath.title.toLowerCase()} field`
        ]
      });

    } catch (error) {
      console.error('Simulation error:', error);
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

  // Generate default timeline steps if none provided by API
  const generateDefaultTimeline = (path) => {
    return [
      {
        title: "Learn Fundamentals",
        description: `Master the basics of ${path.title}`,
        timeline: "0-3 months",
        resources: ["Online courses", "Practice projects"]
      },
      {
        title: "Build Portfolio",
        description: "Create projects to showcase your skills",
        timeline: "3-6 months", 
        resources: ["GitHub portfolio", "Personal projects"]
      },
      {
        title: "Gain Experience",
        description: "Apply for entry-level positions or internships",
        timeline: "6-12 months",
        resources: ["Job applications", "Networking events"]
      },
      {
        title: "Professional Development",
        description: "Continue learning and advancing in your career",
        timeline: "12+ months",
        resources: ["Certifications", "Advanced training"]
      }
    ];
  };

  // Generate default market data if none provided by API
  const generateDefaultMarketData = (path) => {
    return {
      growthRate: 'Loading...',
      demand: 'Loading...',
      jobOpenings: 'Loading...',
      topSkills: path.requiredSkills || [],
      industries: [
        { id: 'loading', name: 'Loading market data...', percentage: 100 }
      ]
    };
  };

  if (isLoading && !isRefreshing) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading enhanced career insights...</p>
        </div>
      </div>
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
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => handleStageChange(5)} // Go back to dashboard
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

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Compass className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                AI Career Compass™
              </h1>
              <p className="text-gray-600 mt-1">
                AI-Powered career insights and personalized guidance
              </p>
            </div>
          </div>
        </div>

        {/* Enhanced Refresh Options Banner for returning users */}
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
            <div className="bg-white rounded-lg p-6 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-lg font-medium">Getting Fresh Recommendations...</p>
              <p className="text-gray-600 mt-2">Using AI to analyze your updated preferences</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Career Paths Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">AI-Recommended Paths</h2>
                </div>
                {/* Add refresh button next to title */}
                <button
                  onClick={handleRefreshRecommendations}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
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

            {/* Dynamic Content Section - same as before */}
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

                {activeTab === 'timeline' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4">Career Timeline</h3>
                    <div className="space-y-8">
                      {selectedPath.roadmap?.steps?.length > 0 ? (
                        selectedPath.roadmap.steps.map((step, index, steps) => (
                          <div key={`api-step-${index}-${step.title}`} className="relative flex items-start mb-8">
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
                        ))
                      ) : selectedPath.timeline?.length > 0 ? (
                        selectedPath.timeline.map((step, index, steps) => (
                          <div key={`timeline-step-${index}-${step.title}`} className="relative flex items-start mb-8">
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
                        ))
                      ) : (
                        generateDefaultTimeline(selectedPath).map((step, index, steps) => (
                          <div key={`default-step-${index}-${step.title}`} className="relative flex items-start mb-8">
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
                        ))
                      )}
                    </div>
                  </div>
                )}

                {activeTab === 'market' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4">Market Analysis</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Growth Rate</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-blue-600">
                            {selectedPath.marketData?.growthRate ? 
                              `${selectedPath.marketData.growthRate}%` : 
                              selectedPath.growthRate ? 
                                `${selectedPath.growthRate}%` : 
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
                            {selectedPath.marketData?.demand || 
                             selectedPath.demand || 
                             'Loading...'
                            }
                          </span>
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-medium mb-2">Job Openings</h4>
                        <div className="flex items-baseline gap-2">
                          <span className="text-2xl font-bold text-purple-600">
                            {selectedPath.marketData?.jobOpenings?.toLocaleString() || 
                             'Loading...'
                            }
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
                )}

                {activeTab === 'simulation' && (
                  <div className="space-y-6">
                    <h3 className="text-xl font-semibold mb-4">Career Path Simulator</h3>
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <p className="text-sm text-blue-800">
                        Explore different scenarios and see how they could impact your career journey as a {selectedPath.title}.
                      </p>
                    </div>

                    {isSimulationLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Simulating career scenario...</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <button
                          onClick={() => runSimulation('skill_acquisition')}
                          className="w-full border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium mb-2">Skill Acquisition Impact</h4>
                              <p className="text-sm text-gray-600">
                                Simulate your career trajectory with additional skills
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>

                        <button
                          onClick={() => runSimulation('certification')}
                          className="w-full border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium mb-2">Certification ROI</h4>
                              <p className="text-sm text-gray-600">
                                Calculate the impact of professional certifications
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>

                        <button
                          onClick={() => runSimulation('specialization')}
                          className="w-full border rounded-lg p-4 hover:bg-gray-50 transition-colors text-left"
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h4 className="font-medium mb-2">Career Path Comparison</h4>
                              <p className="text-sm text-gray-600">
                                Compare different specialization options
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </button>
                      </div>
                    )}

                    {simulationResults && renderSimulationResults()}
                  </div>
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
                      
                      // Clear dashboard cache when selecting a new career path
                      const USER_DASHBOARD_KEY = 'userDashboard';
                      storageUtils.removeItem(`${USER_DASHBOARD_KEY}_${user?.userID}`);
                      console.log('Cleared dashboard cache for new career path selection');
                      
                      // Update user state
                      setUser(prevUser => ({
                        ...prevUser,
                        selectedCareerPath: selectedPath
                      }));
                      
                      // Store in session storage
                      storageUtils.setItem('selectedCareerPath', JSON.stringify(selectedPath));
                      
                      // Add small delay to ensure state update completes
                      await new Promise(resolve => setTimeout(resolve, 100));
                      
                      // Progress to dashboard
                      handleStageChange(5);
                    }}
                    className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Select This Path
                  </button>
                </div>
              </div>
            )}

            {/* Add Quick Actions for returning users */}
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