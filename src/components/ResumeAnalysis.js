import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import { 
  File, ArrowLeft, ChevronLeft, CheckCircle, AlertCircle, 
  RefreshCw, Download, ChevronDown, ChevronUp, TrendingUp, Target, 
  Zap, Book, Star, Award, Briefcase, Clock 
} from 'lucide-react';
import { useAchievements } from './AchievementSystem';

const downloadResumeFromS3 = async (path) => {
  try {
    console.log('Downloading resume from S3:', path);
    const response = await fetch('https://7dgswradw7.execute-api.us-east-1.amazonaws.com/files/download', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filename: path
      }),
    });

    if (!response.ok) throw new Error('Failed to download resume');
    
    const data = await response.json();
    console.log('Resume download response received');
    return data.fileContent; // This should be the base64 content
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

  // Resume data retrieval effect
  useEffect(() => {
    const getResumeData = async () => {
      const storedResume = sessionStorage.getItem('userResume');
      console.log('Checking session storage for resume data:', storedResume ? 'Found' : 'Not found');

      if (storedResume) {
        try {
          const parsedResume = JSON.parse(storedResume);
          console.log('Resume data from session storage:', {
            name: parsedResume.name,
            type: parsedResume.type,
            hasContent: !!parsedResume.content
          });
          
          if (parsedResume.content) {
            setResumeData(parsedResume);
            return true;
          }
        } catch (err) {
          console.error('Error parsing stored resume:', err);
        }
      }

      // Check user context if not found in session storage
      if (user?.resume?.path) {
        try {
          const resumeContent = await downloadResumeFromS3(user.resume.path);
          const resumeData = {
            ...user.resume,
            content: resumeContent,
          };
          console.log('Found resume in user context:', {
            name: resumeData.name,
            type: resumeData.type,
          });
          sessionStorage.setItem('userResume', JSON.stringify(resumeData));
          setResumeData(resumeData);
          return true;
        } catch (err) {
          console.error('Error downloading resume:', err);
        }
      }

      console.log('No valid resume data found');
      return false;
    };

    const initResumeData = async () => {
      const hasResume = await getResumeData();
      if (!hasResume) {
        console.log('No valid resume found, redirecting to upload...');
        setStage(4);
      }
    };

    initResumeData();
  }, [user?.resume, setStage]);

  // Analysis effect
  useEffect(() => {
    const analyzeResume = async () => {
      if (!resumeData?.content) {
        console.log('No resume content available for analysis');
        return;
      }

      console.log('Starting resume analysis for:', {
        fileName: resumeData.name,
        fileType: resumeData.type,
        uploadDate: resumeData.uploadDate,
        path: resumeData.path
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
          resume: {
            content: resumeData.content,
            name: resumeData.name,
            type: resumeData.type,
            path: resumeData.path
          },
          selectedCareerPath: user.selectedCareerPath?.title,
          detailsRequested: [
            'resumeAnalysis',
            'skillGapAnalysis',
            'improvementSuggestions',
            'careerAlignment'
          ]
        };

        console.log('Sending resume analysis request...');

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

        if (!response.ok) throw new Error('Failed to analyze resume');

        const data = await response.json();
        console.log('Resume analysis raw response:', data);
        
        if (data.body) {
          const cleanBody = data.body.replace(/```json\n|\n```/g, '');
          const parsedBody = typeof cleanBody === 'string' ? JSON.parse(cleanBody) : cleanBody;
          console.log('Parsed analysis response:', parsedBody);
          
          if (parsedBody.recommendations?.careerAnalysis) {
            setAnalysis(parsedBody.recommendations.careerAnalysis);
            unlockAchievement('resume_analyzed');
          } else {
            console.warn('Career analysis data not found in response');
            setError('Career analysis data not available. Please try again later.');
          }
        } else {
          console.warn('Empty response body received');
          setError('Unable to analyze resume. Please try again later.');
        }
      } catch (error) {
        console.error('Resume analysis failed:', error);
        setError('Failed to analyze resume. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (resumeData?.content) {
      analyzeResume();
    }
  }, [resumeData, user, unlockAchievement]);

  const toggleSection = (sectionId) => {
    console.log('Toggling section:', sectionId);
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const calculateResumeScore = (analysis) => {
    let score = 0;
    const maxScore = 100;

    // Scoring Criteria
    const scoringRules = [
      { 
        category: 'Relevance',
        maxPoints: 25,
        evaluate: () => {
          const relevanceScore = analysis.keyStrengths.length * 5;
          return Math.min(relevanceScore, 25);
        }
      },
      { 
        category: 'Clarity',
        maxPoints: 20,
        evaluate: () => {
          // Check for concise, well-structured descriptions
          const clarityScore = analysis.keyStrengths.every(s => s.length < 100) ? 20 : 10;
          return clarityScore;
        }
      },
      { 
        category: 'Career Alignment',
        maxPoints: 25,
        evaluate: () => {
          const careerAlignmentScore = analysis.progressionPath ? 25 : 10;
          return careerAlignmentScore;
        }
      },
      { 
        category: 'Skill Depth',
        maxPoints: 15,
        evaluate: () => {
          const skillDepthScore = analysis.developmentAreas.length < 3 ? 15 : 
                                   analysis.developmentAreas.length < 5 ? 10 : 5;
          return skillDepthScore;
        }
      },
      { 
        category: 'Professional Impact',
        maxPoints: 15,
        evaluate: () => {
          const impactScore = analysis.currentStage === 'Highly Competitive' ? 15 :
                               analysis.currentStage === 'Competitive' ? 10 : 5;
          return impactScore;
        }
      }
    ];

    // Calculate total score
    const scoreBreakdown = scoringRules.map(rule => ({
      category: rule.category,
      score: rule.evaluate(),
      maxPoints: rule.maxPoints
    }));

    score = scoreBreakdown.reduce((total, item) => total + item.score, 0);

    return {
      totalScore: Math.round(score),
      scoreBreakdown,
      performance: 
        score >= 90 ? 'Exceptional' :
        score >= 80 ? 'Strong' :
        score >= 70 ? 'Good' :
        score >= 60 ? 'Needs Improvement' :
        'Requires Significant Work'
    };
  };

  const generateActionPlan = (analysis, resumeScore) => {
    return [
      {
        priority: 'High',
        icon: Zap,
        title: 'Skill Alignment',
        description: `Focus on highlighting skills directly related to ${user.selectedCareerPath?.title}. 
          Your current resume shows potential gaps in skill presentation.`,
        steps: [
          'List skills explicitly mentioned in job descriptions',
          'Use industry-specific keywords',
          'Quantify skill impact with metrics and achievements'
        ]
      },
      {
        priority: 'Medium',
        icon: Target,
        title: 'Experience Narrative',
        description: 'Craft a more compelling story about your professional journey.',
        steps: [
          'Restructure job descriptions to show progression',
          'Use action verbs that demonstrate leadership and impact',
          'Align job descriptions with career path goals'
        ]
      },
      {
        priority: resumeScore.totalScore < 70 ? 'High' : 'Low',
        icon: Book,
        title: 'Continuous Learning',
        description: 'Address skill development areas identified in the analysis.',
        steps: [
          'Create a learning plan for identified skill gaps',
          'Consider online courses or certifications',
          'Seek projects that demonstrate emerging skills'
        ]
      },
      {
        priority: 'Low',
        icon: Award,
        title: 'Professional Branding',
        description: 'Enhance your professional narrative and visibility.',
        steps: [
          'Update LinkedIn profile to match resume',
          'Create a personal portfolio website',
          'Engage in professional networking'
        ]
      }
    ];
  };

  const renderScoreCard = () => {
    if (!analysis) return null;

    const resumeScore = calculateResumeScore(analysis);
    const actionPlan = generateActionPlan(analysis, resumeScore);

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
              resumeScore.totalScore >= 90 ? 'text-green-600' :
              resumeScore.totalScore >= 80 ? 'text-green-500' :
              resumeScore.totalScore >= 70 ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {resumeScore.totalScore}/100
            </div>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-2">Performance: {resumeScore.performance}</h3>
            <div className="space-y-2">
              {resumeScore.scoreBreakdown.map((category, index) => (
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
          
          {actionPlan.map((plan, index) => (
            <div key={index} className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <plan.icon className={`h-5 w-5 ${
                    plan.priority === 'High' ? 'text-red-500' :
                    plan.priority === 'Medium' ? 'text-yellow-500' :
                    'text-green-500'
                  }`} />
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

  const renderDetailedAnalysis = () => {
    const sections = [
      {
        id: 'overview',
        title: 'Overview',
        content: analysis || {},
        icon: File
      },
      {
        id: 'strengths',
        title: 'Key Strengths',
        content: analysis?.keyStrengths || [],
        icon: CheckCircle
      },
      {
        id: 'improvements',
        title: 'Development Areas',
        content: analysis?.developmentAreas || [],
        icon: AlertCircle
      }
    ];

    return (
      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => setStage(6)}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5" />
          Back to Dashboard
        </button>

        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Comprehensive Resume Analysis</h1>
          <p className="text-gray-600">
            Detailed insights for your career path: {user.selectedCareerPath?.title}
          </p>
        </div>

        {renderScoreCard()}

        {sections.map(({ id, title, content, icon: Icon }) => (
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
                      <p className="text-blue-700 mt-2">{content.currentStage}</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">Progression Path</h3>
                      <p className="text-gray-700 mt-2">{content.progressionPath}</p>
                    </div>
                  </div>
                )}

                {id === 'strengths' && (
                  <div className="space-y-4">
                    <ul className="mt-2 space-y-2">
                      {content.map((strength, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          {strength}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {id === 'improvements' && (
                  <div className="space-y-4">
                    <ul className="mt-2 space-y-2">
                      {content.map((improvement, index) => (
                        <li key={index} className="flex items-center gap-2 text-gray-700">
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          {improvement}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Main render method
  if (loading) return renderLoadingState();
  if (error) return renderErrorState();
  if (!analysis) return null;

  return (
    <>
      {renderDetailedAnalysis()}
    </>
  );
};

export default ResumeAnalysis;