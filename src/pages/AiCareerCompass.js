import React, { useState, useEffect, useContext } from 'react';
import { 
  Compass, ChevronLeft, GitBranch, Briefcase, 
  TrendingUp, Star, Users, CircleDollarSign,
  Building2, GraduationCap, ChevronRight, BarChart, 
  Award, MapPin, RefreshCw, LineChart, Clock,BookOpen
} from 'lucide-react';
import { UserContext } from '../App';
import _ from 'lodash';

// CareerPathCard Component
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
            <p className="font-medium">{path.salaryRange}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Match Score</p>
            <div className="flex items-center gap-1">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 rounded-full h-2"
                  style={{ width: `${path.matchScore}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 ml-2">{path.matchScore}%</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {path.requiredSkills.map((skill, index) => (
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

// Enhanced recommendation generation with additional data points
const generateEnhancedRecommendations = async (user, includePredictions = true) => {
  console.log('Starting generateEnhancedRecommendations...');
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
      detailsRequested: [
        'roleDescription',
        'salaryRangeByExperience',
        'marketDemand',
        'growthPotential',
        'careerSimulations',
        'skillImpactAnalysis',
        'marketTrendPredictions',
        'recommendedMilestones',
        'learningPathways'
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

// Enhanced Timeline Component using AI-generated milestones
const CareerTimeline = ({ path, onMilestoneSelect }) => {
  const [milestones, setMilestones] = useState([]);

  useEffect(() => {
    console.log('CareerTimeline: Fetching milestones for path:', path);
    
    const fetchMilestones = async () => {
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
      }
    };

    fetchMilestones();
  }, [path.id]);

  return (
    <div className="space-y-6">
      {milestones.map((milestone, index) => (
        <div
          key={index}
          className="relative flex items-start mb-8 cursor-pointer group"
          onClick={() => onMilestoneSelect(milestone)}
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

// Market Insights Component with Real-time Data
const MarketInsights = ({ pathId, path }) => {
  console.log('MarketInsights: Rendering with pathId:', pathId, 'and path:', path);
  const [insights, setInsights] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    console.log('MarketInsights: Starting to fetch insights for pathId:', pathId);
    
    const fetchMarketInsights = async () => {
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
      }
    };

    fetchMarketInsights();
  }, [pathId]);

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

// Enhanced AI Career Compass Component
const EnhancedAICareerCompass = ({ setStage }) => {
  const { user, setUser } = useContext(UserContext);
  const [selectedPath, setSelectedPath] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enhancedData, setEnhancedData] = useState(null);

  // Fetch enhanced recommendations on component mount
  useEffect(() => {
    const fetchEnhancedData = async () => {
      try {
        setIsLoading(true);
        const data = await generateEnhancedRecommendations(user, true);
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

  if (isLoading) {
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
            onClick={() => setStage(3)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <button
          onClick={() => setStage(3)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ChevronLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Compass className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Enhanced AI Career Compass™
              </h1>
              <p className="text-gray-600 mt-1">
                AI-Powered career insights and personalized guidance
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            {/* Career Paths Section */}
            <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">AI-Recommended Paths</h2>
                </div>
              </div>
              
              <div className="space-y-4">
                {enhancedData?.careerPaths.map(path => (
                  <CareerPathCard
                    key={path.id}
                    path={path}
                    onSelect={setSelectedPath}
                    isSelected={selectedPath?.id === path.id}
                  />
                ))}
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
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2">Key Skills</h4>
                          <div className="flex flex-wrap gap-2">
                            {selectedPath.requiredSkills.map((skill, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium mb-2">Salary Range</h4>
                          <p className="text-lg font-medium text-gray-900">{selectedPath.salaryRange}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

  {activeTab === 'timeline' && (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Career Timeline</h3>
      <div className="space-y-8">
        {selectedPath.roadmap?.steps.map((step, index) => (
          <div key={index} className="relative flex items-start mb-8">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                {index === 0 ? (
                  <BookOpen className="w-6 h-6 text-blue-600" />
                ) : index === selectedPath.roadmap.steps.length - 1 ? (
                  <Award className="w-6 h-6 text-blue-600" />
                ) : (
                  <Briefcase className="w-6 h-6 text-blue-600" />
                )}
              </div>
              {index < selectedPath.roadmap.steps.length - 1 && (
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
  )}

  {activeTab === 'market' && (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Market Analysis</h3>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Growth Rate</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">
              {selectedPath.growthRate || '12'}%
            </span>
            <span className="text-sm text-gray-600">Annual</span>
          </div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Market Demand</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-600">High</span>
          </div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Job Openings</h4>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-purple-600">5,000+</span>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Top Skills in Demand</h4>
        <div className="flex flex-wrap gap-2">
          {selectedPath.requiredSkills.map((skill, index) => (
            <span
              key={index}
              className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {skill}
            </span>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h4 className="font-medium mb-4">Industry Distribution</h4>
        <div className="space-y-3">
          {[
            { name: 'Technology', percentage: 45 },
            { name: 'Finance', percentage: 25 },
            { name: 'Healthcare', percentage: 15 },
            { name: 'Other', percentage: 15 }
          ].map((industry, index) => (
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
  )}

  {activeTab === 'simulation' && (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold mb-4">Career Path Simulator</h3>
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <p className="text-sm text-blue-800">
          Explore different scenarios and see how they could impact your career journey as a {selectedPath.title}.
        </p>
      </div>

      <div className="space-y-4">
        <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
          <h4 className="font-medium mb-2">Skill Acquisition Impact</h4>
          <p className="text-sm text-gray-600">See how learning new skills affects your career trajectory</p>
          <div className="mt-3 flex items-center text-blue-600">
            <span className="text-sm">Explore scenario</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
          <h4 className="font-medium mb-2">Certification ROI</h4>
          <p className="text-sm text-gray-600">Calculate the impact of professional certifications</p>
          <div className="mt-3 flex items-center text-blue-600">
            <span className="text-sm">Explore scenario</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>

        <div className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer">
          <h4 className="font-medium mb-2">Career Path Comparison</h4>
          <p className="text-sm text-gray-600">Compare different specialization options</p>
          <div className="mt-3 flex items-center text-blue-600">
            <span className="text-sm">Explore scenario</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </div>
      </div>
    </div>
  )}
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {selectedPath && (
              <>
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-3 mb-6">
                    <Award className="h-6 w-6 text-blue-600" />
                    <h2 className="text-xl font-semibold">Next Steps</h2>
                  </div>
                  <div className="space-y-4">
                    <ul className="space-y-3">
                      {selectedPath.nextSteps?.map((step, index) => (
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
                        
                        setUser(prevUser => ({
                          ...prevUser,
                          selectedCareerPath: selectedPath
                        }));
                        
                        sessionStorage.setItem('selectedCareerPath', JSON.stringify(selectedPath));
                        
                        setStage(6);
                      }}
                      className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start This Path
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedAICareerCompass;