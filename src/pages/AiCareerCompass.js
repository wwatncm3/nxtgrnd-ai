import React, { useState, useEffect, useContext,useRef } from 'react';
import { 
  Compass, ChevronLeft, GitBranch, Briefcase, 
  TrendingUp, Star, Users, CircleDollarSign,
  Building2, GraduationCap, ChevronRight, BarChart, Award, MapPin, RefreshCw
} from 'lucide-react';
import { UserContext } from '../App';

// CareerPathCard component remains the same
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





const AICareerCompass = ({ setStage: setStageFromProps }) => {
  const { user, setUser, setStage: setStageFromContext } = useContext(UserContext);
  const setStage = setStageFromProps || setStageFromContext;
  const [selectedPath, setSelectedPath] = useState(null);
  const [careerPaths, setCareerPaths] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);// Add a state for tracking initialization instead of a ref
  const [isInitialized, setIsInitialized] = useState(false);

  // At the top of AICareerCompass component
const initializationKey = `career_compass_initialized_${user?.userID}`;
const pathsKey = `career_compass_paths_${user?.userID}`;

  
  
  
  const fallbackPaths = [
    {
      id: 1,
      title: "Software Developer",
      description: "Build and maintain software applications",
      salaryRange: "$70,000 - $150,000",
      matchScore: 85,
      requiredSkills: ["JavaScript", "React", "Node.js"],
      nextSteps: [
        "Complete a coding bootcamp",
        "Build a portfolio of projects",
        "Practice technical interviews"
      ]
    },
    {
      id: 2,
      title: "Data Analyst",
      description: "Analyze data and create insights",
      salaryRange: "$60,000 - $120,000",
      matchScore: 75,
      requiredSkills: ["SQL", "Python", "Data Visualization"],
      nextSteps: [
        "Learn SQL fundamentals",
        "Practice with real datasets",
        "Master visualization tools"
      ]
    }
  ];

  const dedupPaths = (paths) => {
    console.log('Before deduplication:', paths);
    const uniquePaths = [];
    const seenPaths = new Set();
  
    // Normalize title function
    const normalizeTitle = (title) => {
      return title.toLowerCase().replace(/\s+/g, ' ').trim();
    };
  
    // Group similar titles but respect experience levels
    const isSimilarTitle = (title1, title2) => {
      const t1 = normalizeTitle(title1);
      const t2 = normalizeTitle(title2);
      
      // Direct match
      if (t1 === t2) return true;
      
      // Don't consider Junior/Senior as duplicates
      if (t1.includes('junior') || t2.includes('junior') || 
          t1.includes('senior') || t2.includes('senior')) {
        return t1 === t2;
      }
      
      // For other cases, check if base titles match
      const baseTitle1 = t1.replace(/(junior|senior)\s*/g, '');
      const baseTitle2 = t2.replace(/(junior|senior)\s*/g, '');
      
      return baseTitle1 === baseTitle2;
    };
  
    // Sort by match score (higher first) and normalize
    const sortedPaths = [...paths].sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  
    for (const path of sortedPaths) {
      const titleKey = normalizeTitle(path.title);
      
      // Check if we already have a similar title
      const isDuplicate = uniquePaths.some(existingPath => 
        isSimilarTitle(existingPath.title, path.title)
      );
  
      console.log('Checking path:', path.title, '| Normalized:', titleKey, '| Duplicate:', isDuplicate);
      
      if (!isDuplicate) {
        uniquePaths.push({
          ...path,
          id: uniquePaths.length + 1
        });
      } else {
        console.log('Duplicate found:', path.title);
      }
    }
  
    console.log('After deduplication:', uniquePaths);
    return uniquePaths;
  };

  const fetchStoredRecommendations = async () => {
    console.log('Fetching stored recommendations...');
    try {
      const response = await fetch(
        `https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/${user.userID}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Origin': 'http://localhost:3000'
          },
          body: JSON.stringify({
            httpMethod: 'GET',
            path: `/recommendations/${user.userID}`,
          })
        }
      );
    
      // If we get a 500 error, treat it as if there are no recommendations
      if (!response.ok) {
        console.log('Error fetching recommendations, status:', response.status);
        return null;
      }
    
      const responseData = await response.json();
      const parsedBody = JSON.parse(responseData.body);
      
      if (!parsedBody || !parsedBody.recommendations || !Array.isArray(parsedBody.recommendations)) {
        console.log('No valid recommendations found in response');
        return null;
      }
  
      console.log('Found stored recommendations:', parsedBody.recommendations.length);
      const uniqueRecs = dedupPaths(parsedBody.recommendations);
      console.log('Deduped stored recommendations:', uniqueRecs.length);
      setCareerPaths(uniqueRecs);
      return uniqueRecs;
    } catch (error) {
      console.error('Error fetching stored recommendations:', error);
      return null;
    }
  };

  const generateNewRecommendations = async () => {
    console.log('Generating new recommendations...');
    console.log('Using user data:', {
      id: user?.userID,
      interests: user?.interests,
      skills: user?.skills,
      experienceLevel: user?.experienceLevel || user?.careerStage
    });
  
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
        location: 'United States',
        detailsRequested: [
          'roleDescription',
          'salaryRangeByExperience',
          'marketDemand',
          'growthPotential'
        ]
      };
  
      console.log('Sending recommendation request with payload:', recommendationPayload);
  
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
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(`Failed to fetch recommendations: ${errorData.message || 'Unknown error'}`);
      }
  
      const data = await response.json();
  
      if (data.body) {
        const cleanBody = data.body.replace(/```json\n|\n```/g, '');
        const parsedBody = typeof cleanBody === 'string' ? JSON.parse(cleanBody) : cleanBody;
        
        console.log('Raw API response:', parsedBody);
        
        let recommendations = [];
        if (parsedBody.recommendations && Array.isArray(parsedBody.recommendations)) {
          recommendations = parsedBody.recommendations;
        } else if (parsedBody.recommendations?.careerPaths) {
          recommendations = parsedBody.recommendations.careerPaths;
        }
  
        console.log('Initial recommendations:', recommendations.length);
  
        if (!Array.isArray(recommendations) || recommendations.length === 0) {
          console.log('No recommendations found, using fallback paths');
          return fallbackPaths;
        }
  
        // Format recommendations first
        const formattedRecs = recommendations.map(rec => ({
          id: rec.id,
          title: rec.title || 'Career Path',
          description: rec.description || 'No description available',
          salaryRange: rec.salaryRange || 'Varies by location and experience',
          matchScore: rec.matchScore || rec.MatchScore || 0,
          requiredSkills: Array.isArray(rec.requiredSkills) ? rec.requiredSkills : [],
          recommendedCertifications: Array.isArray(rec.recommendedCertifications) ? 
            rec.recommendedCertifications : [],
          roadmap: {
            timeToAchieve: rec.roadmap?.timeToAchieve || '1-2 years',
            steps: Array.isArray(rec.roadmap?.steps) ? rec.roadmap.steps : []
          },
          nextSteps: Array.isArray(rec.nextSteps) ? rec.nextSteps : []
        }));
  
        console.log('Formatted recommendations:', formattedRecs.length);
  
        // Then deduplicate
        const uniquePaths = dedupPaths(formattedRecs);
        console.log('Final unique paths:', uniquePaths.length);
  
        if (uniquePaths.length > 0) {
          console.log('Generated unique paths:', uniquePaths);
          
          // Update state BEFORE storing in backend
          setCareerPaths(uniquePaths); // Add this line
          
          // Store in backend
          const storagePayload = {
            httpMethod: 'PUT',
            path: `/recommendations/${user.userID}`,
            body: JSON.stringify({
              userId: user.userID,
              recommendations: uniquePaths,
              timestamp: new Date().toISOString()
            })
          };
      
          await fetch(
            `https://3ub6swm509.execute-api.us-east-1.amazonaws.com/dev/recommendations/${user.userID}`,
            {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(storagePayload)
            }
          );
      
          return uniquePaths;
        } else {
          console.log('No unique paths found, returning fallback paths');
          return fallbackPaths;
        }
      } else {
        console.log('No data body found, returning fallback paths');
        return fallbackPaths;
      }
    } catch (err) {
      console.error('Error in recommendation generation:', err);
      return fallbackPaths;
    }
  };

  const refreshRecommendations = async () => {
    console.log('Starting refresh of recommendations...');
    console.log('Current user context:', {
      userID: user?.userID,
      interests: user?.interests,
      skills: user?.skills,
      pathType: user?.pathType
    });
    
    setIsRefreshing(true);
  
    try {
      // First generate new recommendations
      const newRecommendations = await generateNewRecommendations();
      console.log('Generated new recommendations:', newRecommendations);
  
      if (newRecommendations && user?.userID) {
        // Update state and storage atomically
        setCareerPaths(newRecommendations);
        sessionStorage.setItem(pathsKey, JSON.stringify(newRecommendations));
        console.log('Updated career paths and session storage');
      }
  
    } catch (error) {
      console.error('Error during refresh:', error);
      setError('Failed to refresh recommendations');
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // Reset initialization when user changes
    if (!user?.userID) {
      console.log('No user ID, resetting initialization');
      setIsInitialized(false);
      setCareerPaths([]);
      setSelectedPath(null);
      setLoading(false);
      setError(null);
      sessionStorage.removeItem(initializationKey);
      sessionStorage.removeItem(pathsKey);
      return;
    }
  
    // Check if already initialized in this session
    const wasInitialized = sessionStorage.getItem(initializationKey);
    const storedPaths = sessionStorage.getItem(pathsKey);
  
    if (wasInitialized && storedPaths) {
      console.log('Found stored paths in session, using those');
      setCareerPaths(JSON.parse(storedPaths));
      setIsInitialized(true);
      setLoading(false);
      return;
    }
  
    // Only run if not initialized
    if (!isInitialized) {
      console.log('Component not initialized, starting initialization...');
      const initializeRecommendations = async () => {
        try {
          setLoading(true);
          console.log('Checking for stored recommendations...');
          
          // Try to get stored recommendations first
          const stored = await fetchStoredRecommendations();
          
          if (stored) {
            console.log('Found stored recommendations, using those');
            setCareerPaths(stored); // Make sure this line is here
            sessionStorage.setItem(pathsKey, JSON.stringify(stored));
          } else {
            console.log('No stored recommendations found, generating new ones');
            const newRecs = await generateNewRecommendations();
            setCareerPaths(newRecs); // Add this line
            sessionStorage.setItem(pathsKey, JSON.stringify(newRecs));
          }
    
          // Mark as initialized
          console.log('Initialization complete');
          sessionStorage.setItem(initializationKey, 'true');
          setIsInitialized(true);
        } catch (error) {
          console.error('Error during initialization:', error);
          setError('Failed to load recommendations');
          setCareerPaths(fallbackPaths);
        } finally {
          setLoading(false);
        }
      };
    
      initializeRecommendations();
    }
  
    // Clean up only on unmount or user change
    return () => {
      if (!user?.userID) {
        console.log('Cleaning up state - user changed/logged out');
        sessionStorage.removeItem(initializationKey);
        sessionStorage.removeItem(pathsKey);
      }
    };
  }, [user?.userID]);
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your career recommendations...</p>
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
      {user?.selectedCareerPath && (
          <button
            onClick={() => setStage(6)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ChevronLeft className="h-5 w-5" />
            Back to Dashboard
          </button>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Compass className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">AI Career Compass™</h1>
              <p className="text-gray-600 mt-1">
                Personalized career paths based on your profile and interests
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* User Profile Summary */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-4">
                <Briefcase className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Your Profile</h2>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Selected Interests</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(user?.interests) ? (
                      user.interests.map((interest, index) => (
                        <span key={index} className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                          {interest}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No interests selected yet</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Key Skills</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {Array.isArray(user?.skills) ? (
                      user.skills.map((skill, index) => (
                        <span key={index} className="px-2 py-1 bg-green-50 text-green-700 rounded-full text-sm">
                          {skill}
                        </span>
                      ))
                    ) : (
                      <span className="text-gray-500">No skills selected yet</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Career Paths */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <GitBranch className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Recommended Career Paths</h2>
                </div>
                <button
                  onClick={refreshRecommendations}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh Recommendations'}
                </button>
              </div>
              
              <div className="space-y-4">
                {careerPaths.map(path => (
                  <CareerPathCard
                    key={path.id}
                    path={path}
                    onSelect={setSelectedPath}
                    isSelected={selectedPath?.id === path.id}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="space-y-6">
            {selectedPath && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <Award className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Recommended Certifications</h2>
                </div>
                <div className="space-y-4">
                  {selectedPath.recommendedCertifications?.map((cert, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-medium text-lg mb-2">{cert.name}</h3>
                      <p className="text-sm text-gray-600 mb-4">{cert.provider}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-gray-500">Difficulty</span>
                          <p className="font-medium">{cert.difficulty}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Timeline</span>
                          <p className="font-medium">{cert.timeframe}</p>
                        </div>
                        <div>
                          <span className="text-gray-500">Priority</span>
                          <p className="font-medium">{cert.priority}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedPath && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                  <MapPin className="h-6 w-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Career Roadmap</h2>
                </div>
                <div className="space-y-8">
                  <p className="text-sm text-gray-600">
                    Estimated time to achieve: {selectedPath.roadmap?.timeToAchieve}
                  </p>
                  {selectedPath.roadmap?.steps.map((step, index) => (
                    <div key={index} className="border-l-2 pl-6 pt-2">
                      <div className="flex items-center mb-1">
                        <div className="w-4 h-4 rounded-full border-4 border-blue-500 bg-white -ml-[0.68rem]" />
                        <span className="font-semibold text-blue-600 ml-4">{step.title}</span>
                      </div>
                      <p className="text-gray-700 mb-2">{step.description}</p>
                      <p className="text-sm text-gray-500 mb-1">Timeline: {step.timeline}</p>
                      <div className="text-sm text-gray-500">
                        Recommended Resources:
                        {step.resources.map((resource, idx) => (
                          <React.Fragment key={idx}>
                            {resource}
                            {idx < step.resources.length - 1 ? ', ' : ''}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <BarChart className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold">Next Steps</h2>
              </div>
              {selectedPath ? (
                <div className="space-y-4">
                  <h3 className="font-medium">To pursue {selectedPath.title}:</h3>
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
    console.log('Selected career path:', selectedPath);

    // Update user context with selected path
    setUser(prevUser => {
      const updatedUser = {
        ...prevUser,
        selectedCareerPath: selectedPath
      };
      console.log('Updated user context:', updatedUser);
      return updatedUser;
    });
    
    // Store the selection
    sessionStorage.setItem('selectedCareerPath', JSON.stringify(selectedPath));
    console.log('Stored selected career path in session storage');
    
    // Trigger navigation to personalized dashboard
    console.log('Navigating to personalized dashboard (stage 6)');
    setStage(6);
  }}
  className="w-full mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
>
  Start This Path
</button>
                </div>
              ) : (
                <p className="text-gray-600">
                  Select a career path to see recommended next steps
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AICareerCompass;