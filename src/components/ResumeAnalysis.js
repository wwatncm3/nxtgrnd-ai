import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { 
  File, ArrowLeft, ChevronLeft, CheckCircle, AlertCircle, 
  RefreshCw, Download, ChevronDown, ChevronUp, TrendingUp, Target, 
  Zap, Book, Star, Award, Briefcase, Clock 
} from 'lucide-react';
import { useAchievements } from './AchievementSystem';
import * as lucide from 'lucide-react';

const ANALYSIS_CACHE_KEY = 'resumeAnalysisCache';

// Helper function to validate resume data structure
const isValidResumeData = (data) => {
  return data && 
         typeof data === 'object' &&
         data.content &&
         data.name &&
         data.type &&
         data.path;
};

const getStoredAnalysis = (userId, resumePath) => {
  try {
    const stored = sessionStorage.getItem(
      `${ANALYSIS_CACHE_KEY}_${userId}_${resumePath}`
    );
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (err) {
    console.error('Error reading analysis from session:', err);
  }
  return null;
};

const downloadResumeFromS3 = async (path) => {
  try {
    console.log('Downloading and analyzing resume:', path);
    const response = await fetch('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: path
      }),
    });

    if (!response.ok) throw new Error('Failed to download resume');
    
    const data = await response.json();
    console.log('Resume download successful:', {
      contentLength: data.fileContent?.length,
      hasTextractAnalysis: !!data.textractAnalysis
    });

    return {
      content: data.fileContent,
      textractAnalysis: data.textractAnalysis
    };
  } catch (error) {
    console.error('Error downloading resume:', error);
    throw error;
  }
};

const ResumeAnalysis = ({ setStage }) => {
  const { user, setUser } = useContext(UserContext);
  const { unlockAchievement } = useAchievements();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resumeData, setResumeData] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    overallScore: true,
    keyStrengths: false,
    improvementAreas: false,
    actionPlan: false
  });

  const getResumeData = async () => {
    console.log('Getting resume data...');
    
    // First try session storage
    const storedResume = sessionStorage.getItem('userResume');
    console.log('Session storage resume check:', storedResume ? 'Found' : 'Not found');
  
    if (storedResume) {
      try {
        const parsedResume = JSON.parse(storedResume);
        if (isValidResumeData(parsedResume)) {
          console.log('Valid resume data found in session storage');
          return parsedResume;
        }
      } catch (err) {
        console.error('Error parsing stored resume:', err);
      }
    }
  
    // If session storage failed, try S3
    if (user?.resume?.path) {
      try {
        const { content, textractAnalysis } = await downloadResumeFromS3(user.resume.path);
        
        if (!content) {
          throw new Error('No content received from S3');
        }
  
        const newResumeData = {
          content,
          name: user.resume.name || 'resume.pdf',
          type: user.resume.type || 'application/pdf',
          path: user.resume.path,
          textractAnalysis
        };
  
        console.log('Successfully downloaded and analyzed resume from S3');
        sessionStorage.setItem('userResume', JSON.stringify(newResumeData));
        return newResumeData;
      } catch (err) {
        console.error('Error downloading resume from S3:', err);
        throw err;
      }
    }
  
    console.warn('No valid resume source found');
    return null;
  };

  const analyzeResume = async (forceRefresh = false) => {
    console.log('Starting resume analysis...', {
      hasResumeData: !!resumeData,
      contentLength: resumeData?.content?.length,
      name: resumeData?.name
    });

    // First ensure we have resume data
    let currentResumeData = resumeData;
    if (!currentResumeData?.content) {
      console.log('No resume content, attempting to reload...');
      try {
        const freshData = await getResumeData();
        if (!freshData?.content) {
          throw new Error('Unable to load resume content');
        }
        currentResumeData = freshData;
        setResumeData(freshData);
      } catch (error) {
        console.error('Failed to reload resume data:', error);
        setError('Unable to load resume content. Please try uploading again.');
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Now use currentResumeData which we know exists
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedAnalysis = getStoredAnalysis(user.userID, currentResumeData.path);
        if (cachedAnalysis) {
          console.log('Using cached analysis results');
          setAnalysis(cachedAnalysis);
          setLoading(false);
          return;
        }
      }

      console.log('Generating new analysis...', {
        userId: user.userID,
        resumeName: currentResumeData.name,
        contentLength: currentResumeData.content.length
      });

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
        resume: {
          content: currentResumeData.content,
          name: currentResumeData.name,
          type: currentResumeData.type,
          path: currentResumeData.path,
          textract: {
            rawText: currentResumeData.textractAnalysis?.rawText || '',
            formFields: currentResumeData.textractAnalysis?.forms || {},
            tables: currentResumeData.textractAnalysis?.tables || [],
          }
        },
        selectedCareerPath: user.selectedCareerPath?.title,
        detailsRequested: [
          'resumeAnalysis',
          'skillGapAnalysis',
          'improvementSuggestions',
          'careerAlignment'
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
        throw new Error('Failed to analyze resume');
      }

      const data = await response.json();
      console.log('Analysis response received:', {
        status: response.status,
        hasBody: !!data.body
      });
      
      if (data.body) {
        const cleanBody = data.body.replace(/```json\n|\n```/g, '');
        const parsedBody = typeof cleanBody === 'string' ? JSON.parse(cleanBody) : cleanBody;
        
        if (parsedBody.recommendations) {
          const analysisResult = {
            careerAnalysis: parsedBody.recommendations.careerAnalysis,
            resumeScore: parsedBody.recommendations.resumeScore,
            actionPlan: parsedBody.recommendations.actionPlan
          };
          
          // Store in session
          sessionStorage.setItem(
            `${ANALYSIS_CACHE_KEY}_${user.userID}_${currentResumeData.path}`,
            JSON.stringify(analysisResult)
          );

          setAnalysis(analysisResult);
          unlockAchievement('resume_analyzed');
        } else {
          console.error('Missing recommendations in response:', parsedBody);
          throw new Error('Recommendations data not available');
        }
      } else {
        throw new Error('Empty response received');
      }
    } catch (error) {
      console.error('Resume analysis failed:', error);
      setError('Failed to analyze resume. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initResumeData = async () => {
      try {
        console.log('Initializing resume data...');
        const resumeData = await getResumeData();
        
        if (!resumeData) {
          console.log('No valid resume found, redirecting to upload...');
          setStage(4);
          return;
        }

        setResumeData(resumeData);
        console.log('Resume data initialized, starting analysis');
        
        // Now that we have resume data, check for cached analysis
        const cachedAnalysis = getStoredAnalysis(user.userID, resumeData.path);
        if (cachedAnalysis) {
          console.log('Found cached analysis, using it');
          setAnalysis(cachedAnalysis);
          setLoading(false);
        } else {
          // Start analysis with the confirmed resume data
          console.log('Starting fresh analysis');
          await analyzeResume(false);
        }
      } catch (error) {
        console.error('Error during resume initialization:', error);
        setError('Failed to load resume data. Please try uploading again.');
        setLoading(false);
      }
    };

    initResumeData();
  }, [user?.resume, setStage]);

  // Rendering functions...
  const renderLoadingState = () => (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <RefreshCw className="h-12 w-12 text-blue-600 animate-spin mx-auto" />
        <p className="mt-4 text-xl font-medium">Analyzing Your Resume...</p>
        <p className="mt-2 text-gray-600">
          We're conducting an in-depth review against industry standards and your chosen career path
        </p>
      </div>
    </div>
  );

  const renderErrorState = () => (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="text-center">
        <AlertCircle className="h-12 w-12 text-red-600 mx-auto" />
        <p className="mt-4 text-xl font-medium text-red-600">{error}</p>
        <button
          onClick={() => setStage(4)}
          className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Upload Resume
        </button>
      </div>
    </div>
  );

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const renderScoreCard = () => {
    if (!analysis || !analysis.resumeScore) return null;
  
    return (
      <div className="space-y-6">
        {/* Overall Score Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Star className="h-8 w-8 text-yellow-500" />
              <h2 className="text-2xl font-bold text-gray-900">Overall Resume Score</h2>
            </div>
            <div className={`text-3xl font-bold ${
              analysis.resumeScore.totalScore >= 90 ? 'text-green-600' :
              analysis.resumeScore.totalScore >= 80 ? 'text-green-500' :
              analysis.resumeScore.totalScore >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {analysis.resumeScore.totalScore}/100
            </div>
          </div>
  
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Performance: {analysis.resumeScore.performance}</h3>
            <div className="space-y-2">
              {analysis.resumeScore.scoreBreakdown.map((category, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-1/3 text-gray-700">{category.category}</div>
                  <div className="w-2/3">
                    <div className="bg-gray-200 rounded-full h-2.5">
                      <div 
                        className="bg-blue-600 rounded-full h-2.5" 
                        style={{width: `${(category.score / category.maxPoints) * 100}%`}}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Plan Section */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Personalized Action Plan</h2>
          </div>
          
          {analysis.actionPlan.map((plan, index) => (
  <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-3">
        <span className={`h-5 w-5 ${
          plan.priority === 'High' ? 'text-red-500' :
          plan.priority === 'Medium' ? 'text-yellow-500' :
          'text-green-500'
        }`}>
          {React.createElement(lucide[plan.icon])}
        </span>
        <h3 className="font-semibold text-gray-900">{plan.title}</h3>
      </div>
                <span className={`text-sm font-medium ${
                  plan.priority === 'High' ? 'text-red-600' :
                  plan.priority === 'Medium' ? 'text-yellow-600' :
                  'text-green-600'
                }`}>
                  {plan.priority} Priority
                </span>
              </div>
              <p className="text-gray-700 mb-2">{plan.description}</p>
              <ul className="list-disc list-inside text-gray-600">
                {plan.steps.map((step, stepIndex) => (
                  <li key={stepIndex}>{step}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDetailedAnalysis = () => {
    const sections = [
      {
        id: 'overview',
        title: 'Overview',
        content: analysis?.careerAnalysis || {},
        icon: File
      },
      {
        id: 'strengths',
        title: 'Key Strengths',
        content: analysis?.careerAnalysis?.keyStrengths || [],
        icon: CheckCircle
      },
      {
        id: 'improvements',
        title: 'Development Areas',
        content: analysis?.careerAnalysis?.developmentAreas || [],
        icon: AlertCircle
      }
    ];

    return sections.map(({ id, title, content, icon: Icon }) => (
      <div key={id} className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <Icon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{title}</h2>
          </div>
          {expandedSections[id] ? (
            <ChevronUp className="h-5 w-5 text-gray-400" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {expandedSections[id] && (
          <div className="mt-4 pl-9">
            {id === 'overview' && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900">Current Stage</h3>
                  <p className="text-blue-700 mt-2">{content.currentStage || 'Not available'}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">Progression Path</h3>
                  <p className="text-gray-700 mt-2">{content.progressionPath || 'Not available'}</p>
                </div>
              </div>
            )}

            {id === 'strengths' && (
              <div className="space-y-4">
                <ul className="mt-2 space-y-2">
                  {content.length > 0 ? content.map((strength, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {strength}
                    </li>
                  )) : (
                    <li className="text-gray-500">No strengths identified yet</li>
                  )}
                </ul>
              </div>
            )}

            {id === 'improvements' && (
              <div className="space-y-4">
                <ul className="mt-2 space-y-2">
                  {content.length > 0 ? content.map((improvement, index) => (
                    <li key={index} className="flex items-center gap-2 text-gray-700">
                      <AlertCircle className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      {improvement}
                    </li>
                  )) : (
                    <li className="text-gray-500">No improvement areas identified yet</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    ));
  };

  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!analysis) return null;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => {
            const storedDashboard = sessionStorage.getItem(`userDashboard_${user.userID}`);
            if (storedDashboard) {
              setStage(6);
            } else {
              alert('Session data lost. Please navigate to Career Compass first.');
              setStage(5);
            }
          }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <button
          onClick={() => analyzeResume(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white 
                     rounded-lg hover:bg-blue-700 transition-all"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh Analysis
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Comprehensive Resume Analysis
        </h1>
        <p className="text-gray-600">
          Detailed insights for your career path: {user.selectedCareerPath?.title || 'Not selected'}
        </p>
      </div>

      {renderScoreCard()}
      {renderDetailedAnalysis()}
    </div>
  );
};

export default ResumeAnalysis;