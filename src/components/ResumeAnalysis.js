import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import {
  File, ArrowLeft, CheckCircle, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, TrendingUp, Target,
  Zap, Book, Star, Award, Briefcase, Clock, Sparkles, BarChart3,
  FileText, Lightbulb, ArrowRight, CheckCircle2, Download
} from 'lucide-react';
import { useAchievements } from './AchievementSystem';
import * as lucide from 'lucide-react';
import { storageUtils, STORAGE_KEYS } from '../utils/authUtils';
import analytics from '../utils/analytics';
import API_CONFIG from '../config/api';
import { FullPageLoader } from './ui/AnimatedComponents';

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

// Add this helper function to safely get icons
const getSafeIcon = (iconName) => {
  const IconComponent = lucide[iconName];
  return IconComponent || lucide.Zap;
};

const getStoredAnalysis = (userId, resumePath) => {
  try {
    const stored = storageUtils.getItem(`${ANALYSIS_CACHE_KEY}_${resumePath}`);
    if (stored) {
      return stored;
    }
  } catch (err) {
    console.error('Error reading analysis from session:', err);
  }
  return null;
};

const downloadResumeFromS3 = async (path) => {
  try {
    const response = await fetch(API_CONFIG.files.download(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filename: path }),
    });

    if (!response.ok) throw new Error('Failed to download resume');

    const data = await response.json();

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
  const { user } = useContext(UserContext);
  const { unlockAchievement } = useAchievements();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState(null);
  const [isFallbackAnalysis, setIsFallbackAnalysis] = useState(false);
  const [resumeData, setResumeData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [expandedSections, setExpandedSections] = useState({
    overallScore: true,
    keyStrengths: true,
    improvementAreas: true,
    actionPlan: true
  });

  // Handle resume template download
  const handleDownloadTemplate = () => {
    const link = document.createElement('a');
    link.href = '/Resume Template.docx';
    link.download = 'Resume Template.docx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowTemplateModal(false);
  };

  const getResumeData = async () => {
    const storedResume = storageUtils.getItem(STORAGE_KEYS.USER_RESUME);

    if (storedResume) {
      if (isValidResumeData(storedResume)) {
        analytics.trackEvent('resume_loaded_from_storage', {
          fileType: storedResume.type,
          hasContent: !!storedResume.content
        });
        return storedResume;
      }
    }

    if (user?.resume?.path) {
      try {
        const { content, textractAnalysis } = await downloadResumeFromS3(user.resume.path);
        analytics.trackResumeUploaded(user.resume.type || 'application/pdf', content?.length || 0);
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

        storageUtils.setItem(STORAGE_KEYS.USER_RESUME, newResumeData);
        return newResumeData;
      } catch (err) {
        console.error('Error downloading resume from S3:', err);
        throw err;
      }
    }

    console.warn('No valid resume source found');
    return null;
  };

  const analyzeResume = async (forceRefresh = false, providedResumeData = null) => {
    const analysisStartTime = Date.now();

    // Use provided data, or fall back to state
    let currentResumeData = providedResumeData || resumeData;

    if (!currentResumeData?.content) {
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
      if (!forceRefresh) {
        const cachedAnalysis = getStoredAnalysis(user.userID, currentResumeData.path);
        if (cachedAnalysis) {
          setAnalysis(cachedAnalysis);
          setLoading(false);
          return;
        }
      }

      setLoadingMessage('Sending your resume for analysis...');

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
          name: currentResumeData.name,
          type: currentResumeData.type,
          path: currentResumeData.path,
          extractedText: currentResumeData.textractAnalysis?.rawText || '',
          formFields: currentResumeData.textractAnalysis?.forms || {},
          tables: currentResumeData.textractAnalysis?.tables || [],
        },
        selectedCareerPath: user.selectedCareerPath?.title,
        detailsRequested: ['resumeAnalysis', 'skillGapAnalysis', 'improvementSuggestions', 'careerAlignment']
      };

      const recPayload = {
        httpMethod: 'POST',
        path: '/recommendations/generate',
        body: JSON.stringify(recommendationPayload),
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000);

      const messageTimers = [
        setTimeout(() => setLoadingMessage('Extracting resume content...'), 5000),
        setTimeout(() => setLoadingMessage('Analyzing skills and experience...'), 15000),
        setTimeout(() => setLoadingMessage('Matching against career requirements...'), 30000),
        setTimeout(() => setLoadingMessage('Generating personalized recommendations...'), 45000),
        setTimeout(() => setLoadingMessage('Finalizing your analysis report...'), 60000),
        setTimeout(() => setLoadingMessage('Almost done... complex resumes take longer'), 90000)
      ];

      let response;
      try {
        response = await fetch(API_CONFIG.recommendations.generate(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(recPayload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        messageTimers.forEach(t => clearTimeout(t));
      } catch (fetchError) {
        clearTimeout(timeoutId);
        messageTimers.forEach(t => clearTimeout(t));

        if (fetchError.name === 'AbortError') {
          if (retryCount < 2) {
            setRetryCount(prev => prev + 1);
            setLoadingMessage(`Request timed out. Retrying (attempt ${retryCount + 2}/3)...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            return analyzeResume(forceRefresh);
          }
          throw new Error('Request timed out after multiple attempts.');
        }
        throw fetchError;
      }

      if (response.status === 504 || response.status === 502 || response.status === 503) {
        // Retry up to 3 times before showing fallback
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setLoadingMessage(`Server busy. Retrying (attempt ${retryCount + 2}/3)...`);
          await new Promise(resolve => setTimeout(resolve, 3000 * (retryCount + 1)));
          return analyzeResume(forceRefresh);
        }

        // After 3 failed attempts, show fallback instead of error
        console.warn(`API returned ${response.status} after ${retryCount + 1} attempts, using fallback analysis`);

        // Calculate score based on resume content
        const calculateFallbackScore = (resumeData, textractData) => {
          let contentScore = 5;
          let formattingScore = 5;
          let skillsScore = 5;

          if (resumeData.content) {
            const contentLength = resumeData.content.length;
            if (contentLength > 100000) contentScore = 9;
            else if (contentLength > 50000) contentScore = 8;
            else if (contentLength > 20000) contentScore = 7;
            else if (contentLength > 10000) contentScore = 6;
          }

          if (textractData?.rawText) {
            const text = textractData.rawText.toLowerCase();
            const hasNumbers = /\d+%|\$\d+|increased|decreased|improved|reduced/.test(text);
            if (hasNumbers) contentScore = Math.min(10, contentScore + 1);
            const hasActionVerbs = /led|managed|developed|created|implemented|designed|achieved/.test(text);
            if (hasActionVerbs) contentScore = Math.min(10, contentScore + 1);
          }

          if (resumeData.type === 'application/pdf') formattingScore += 2;
          if (textractData?.forms && Object.keys(textractData.forms).length > 0) formattingScore += 2;
          formattingScore = Math.min(10, formattingScore);

          const userSkills = user?.skills || [];
          if (userSkills.length > 10) skillsScore = 9;
          else if (userSkills.length > 5) skillsScore = 8;
          else if (userSkills.length > 3) skillsScore = 7;
          else if (userSkills.length > 0) skillsScore = 6;

          const totalScore = Math.round(((contentScore + formattingScore + skillsScore) / 30) * 100);

          return {
            totalScore,
            performance: totalScore >= 80 ? 'Excellent' : totalScore >= 70 ? 'Good' : totalScore >= 60 ? 'Fair' : 'Needs Improvement',
            scoreBreakdown: [
              { category: 'Content Quality', score: contentScore, maxPoints: 10 },
              { category: 'Formatting', score: formattingScore, maxPoints: 10 },
              { category: 'Skills Match', score: skillsScore, maxPoints: 10 }
            ]
          };
        };

        const fallbackScore = calculateFallbackScore(currentResumeData, currentResumeData.textractAnalysis);

        const fallbackAnalysis = {
          careerAnalysis: {
            currentStage: user?.careerStage || 'Professional',
            progressionPath: `Your ${user?.pathType || 'career'} path offers multiple growth opportunities`,
            keyStrengths: [
              'Professional experience documented',
              'Clear career direction',
              'Relevant skills and background'
            ],
            developmentAreas: [
              'Consider adding quantifiable achievements',
              'Highlight specific technical skills',
              'Include relevant certifications or courses'
            ]
          },
          resumeScore: fallbackScore,
          actionPlan: [
            {
              title: 'Enhance Resume Content',
              description: 'Add measurable achievements and quantify your impact',
              priority: 'High',
              icon: 'FileText',
              steps: [
                'Add numbers and metrics to job descriptions',
                'Include specific technologies and tools used',
                'Quantify project outcomes and results'
              ]
            },
            {
              title: 'Optimize for ATS',
              description: 'Ensure your resume is optimized for applicant tracking systems',
              priority: 'Medium',
              icon: 'Target',
              steps: [
                'Use standard section headings',
                'Include relevant keywords from job descriptions',
                'Keep formatting simple and clean'
              ]
            }
          ]
        };

        storageUtils.setItem(`${ANALYSIS_CACHE_KEY}_${currentResumeData.path}`, fallbackAnalysis);
        setAnalysis(fallbackAnalysis);
        setIsFallbackAnalysis(true);
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(`API request failed with status: ${response.status}`);
      }

      setRetryCount(0);
      const data = await response.json();

      if (!data.body) {
        throw new Error('Empty response body from API');
      }

      let parsedBody;
      try {
        let bodyContent = data.body;
        if (typeof bodyContent === 'string') {
          bodyContent = bodyContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        }
        parsedBody = typeof bodyContent === 'string' ? JSON.parse(bodyContent) : bodyContent;
      } catch (parseError) {
        throw new Error(`Failed to parse API response: ${parseError.message}`);
      }

      let recommendations = parsedBody.recommendations;

      if (!recommendations || Object.keys(recommendations).length === 0) {
        if (parsedBody.resumeScore || parsedBody.careerAnalysis || parsedBody.actionPlan) {
          recommendations = parsedBody;
        } else if (parsedBody.data?.recommendations) {
          recommendations = parsedBody.data.recommendations;
        } else if (parsedBody.message && typeof parsedBody.message === 'object') {
          recommendations = parsedBody.message;
        } else {
          recommendations = {};
        }
      }

      // Calculate score based on resume content if API doesn't provide one
      const calculateResumeScore = (resumeData, textractData) => {
        let contentScore = 5; // Base score
        let formattingScore = 5;
        let skillsScore = 5;

        // Content Quality (0-10)
        if (resumeData.content) {
          const contentLength = resumeData.content.length;
          if (contentLength > 100000) contentScore = 9;
          else if (contentLength > 50000) contentScore = 8;
          else if (contentLength > 20000) contentScore = 7;
          else if (contentLength > 10000) contentScore = 6;
        }

        if (textractData?.rawText) {
          const text = textractData.rawText.toLowerCase();
          // Check for quantifiable achievements (numbers)
          const hasNumbers = /\d+%|\$\d+|increased|decreased|improved|reduced/.test(text);
          if (hasNumbers) contentScore = Math.min(10, contentScore + 1);

          // Check for action verbs
          const hasActionVerbs = /led|managed|developed|created|implemented|designed|achieved/.test(text);
          if (hasActionVerbs) contentScore = Math.min(10, contentScore + 1);
        }

        // Formatting Score (0-10)
        if (resumeData.type === 'application/pdf') formattingScore += 2;
        if (textractData?.forms && Object.keys(textractData.forms).length > 0) formattingScore += 2;
        formattingScore = Math.min(10, formattingScore);

        // Skills Match (0-10)
        const userSkills = user?.skills || [];
        if (userSkills.length > 10) skillsScore = 9;
        else if (userSkills.length > 5) skillsScore = 8;
        else if (userSkills.length > 3) skillsScore = 7;
        else if (userSkills.length > 0) skillsScore = 6;

        const totalScore = Math.round(((contentScore + formattingScore + skillsScore) / 30) * 100);

        return {
          totalScore,
          performance: totalScore >= 80 ? 'Excellent' : totalScore >= 70 ? 'Good' : totalScore >= 60 ? 'Fair' : 'Needs Improvement',
          scoreBreakdown: [
            { category: 'Content Quality', score: contentScore, maxPoints: 10 },
            { category: 'Formatting', score: formattingScore, maxPoints: 10 },
            { category: 'Skills Match', score: skillsScore, maxPoints: 10 }
          ]
        };
      };

      // Use API score if valid, otherwise calculate our own
      const calculatedScore = calculateResumeScore(currentResumeData, currentResumeData.textractAnalysis);
      const defaultScore = calculatedScore;

      const defaultCareerAnalysis = {
        currentStage: 'Professional with relevant experience',
        progressionPath: 'Multiple advancement opportunities available',
        keyStrengths: ['Relevant experience', 'Technical skills', 'Professional background'],
        developmentAreas: ['Consider additional certifications', 'Expand skill set', 'Strengthen specific competencies']
      };

      const defaultActionPlan = [
        {
          title: 'Resume Enhancement',
          description: 'Optimize resume content and structure',
          priority: 'High',
          icon: 'FileText',
          steps: ['Review and enhance job descriptions', 'Ensure consistent formatting', 'Add relevant keywords']
        }
      ];

      const analysisResult = {
        careerAnalysis: recommendations.careerAnalysis || defaultCareerAnalysis,
        resumeScore: recommendations.resumeScore || defaultScore,
        actionPlan: recommendations.actionPlan || defaultActionPlan
      };

      analytics.trackResumeAnalyzed(analysisResult.resumeScore.totalScore, Date.now() - analysisStartTime);

      storageUtils.setItem(`${ANALYSIS_CACHE_KEY}_${currentResumeData.path}`, analysisResult);
      setAnalysis(analysisResult);
      unlockAchievement('RESUME_ANALYZED');

    } catch (error) {
      console.error('Resume analysis failed:', error);
      let errorMessage = error.message;
      if (error.message.includes('504') || error.message.includes('timeout')) {
        errorMessage = 'Resume analysis timed out. Please try again.';
      } else if (error.message.includes('502') || error.message.includes('503')) {
        errorMessage = 'Server temporarily unavailable. Please try again in a few minutes.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const initResumeData = async () => {
      try {
        const resumeData = await getResumeData();
        if (!resumeData) {
          setStage(4);
          return;
        }
        setResumeData(resumeData);

        const cachedAnalysis = getStoredAnalysis(user.userID, resumeData.path);
        if (cachedAnalysis) {
          setAnalysis(cachedAnalysis);
          setLoading(false);
        } else {
          await analyzeResume(false, resumeData);
        }
      } catch (error) {
        console.error('Error during resume initialization:', error);
        setError('Failed to load resume data. Please try uploading again.');
        setLoading(false);
      }
    };

    initResumeData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.resume, setStage]);

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({ ...prev, [sectionId]: !prev[sectionId] }));
  };

  // Get score color based on value
  const getScoreColor = (score) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-green-500';
    if (score >= 70) return 'text-yellow-600';
    if (score >= 60) return 'text-orange-500';
    return 'text-red-500';
  };

  const getScoreGradient = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-500';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    return 'from-orange-500 to-red-500';
  };

  // Loading state with modern design - Brand Colors
  if (loading) {
    return (
      <FullPageLoader
        message="Analyzing Your Resume"
        subMessage={loadingMessage || "We're conducting an in-depth review..."}
        icon={FileText}
      />
    );
  }

  // Error state with modern design - Brand Colors
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-3xl shadow-xl p-8 max-w-md animate-scale-in">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Analysis Failed</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => analyzeResume(true)}
              className="px-6 py-3 bg-blue-900 text-white rounded-xl hover:shadow-lg hover:bg-blue-800 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setStage(5)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all duration-200 font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!analysis) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-blue-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => setStage(5)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="font-medium">Back to Dashboard</span>
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowTemplateModal(true)}
              className="flex items-center gap-2 px-4 py-2 border-2 border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-medium"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Resume Template</span>
            </button>
            <button
              onClick={() => analyzeResume(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-900 text-white rounded-xl hover:shadow-lg hover:bg-blue-800 transition-all duration-200 font-medium"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="hidden sm:inline">Refresh Analysis</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Fallback Analysis Notice */}
        {isFallbackAnalysis && (
          <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-yellow-900 mb-1">Basic Analysis Shown</h3>
                <p className="text-sm text-yellow-700">
                  We encountered a temporary issue generating your detailed AI analysis. You're viewing a basic resume assessment.
                  Click "Refresh Analysis" above to try generating a detailed report again.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Hero Section - Brand Colors */}
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden mb-8">
          <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-teal-600 px-8 py-10 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                    <BarChart3 className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-white/80">Resume Analysis Report</span>
                </div>
                <h1 className="text-3xl font-bold mb-2">Your Resume Score</h1>
                <p className="text-white/80">
                  Personalized insights for your {user.selectedCareerPath?.title || 'career'} journey
                </p>
              </div>

              {/* Score Circle */}
              <div className="relative">
                <div className="w-36 h-36 relative">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="72" cy="72" r="64" stroke="rgba(255,255,255,0.2)" strokeWidth="12" fill="none" />
                    <circle
                      cx="72" cy="72" r="64"
                      stroke="white"
                      strokeWidth="12"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${(analysis.resumeScore.totalScore / 100) * 402} 402`}
                      className="transition-all duration-1000"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-bold">{analysis.resumeScore.totalScore}</span>
                    <span className="text-sm text-white/80">out of 100</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="px-8 py-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {analysis.resumeScore.scoreBreakdown.map((category, index) => (
                <div key={index} className="bg-gray-50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <span className={`font-bold ${getScoreColor((category.score / category.maxPoints) * 100)}`}>
                      {category.score}/{category.maxPoints}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-gradient-to-r ${getScoreGradient((category.score / category.maxPoints) * 100)} rounded-full transition-all duration-700`}
                      style={{ width: `${(category.score / category.maxPoints) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Analysis Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Key Strengths */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('keyStrengths')}
              className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 rounded-xl">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Key Strengths</h2>
              </div>
              {expandedSections.keyStrengths ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            {expandedSections.keyStrengths && (
              <div className="px-6 py-4">
                <ul className="space-y-3">
                  {(analysis.careerAnalysis?.keyStrengths || []).map((strength, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-green-50 rounded-xl">
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Development Areas */}
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <button
              onClick={() => toggleSection('improvementAreas')}
              className="w-full px-6 py-5 flex items-center justify-between bg-gradient-to-r from-orange-50 to-yellow-50"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-500 rounded-xl">
                  <Lightbulb className="h-5 w-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900">Areas to Improve</h2>
              </div>
              {expandedSections.improvementAreas ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
            </button>
            {expandedSections.improvementAreas && (
              <div className="px-6 py-4">
                <ul className="space-y-3">
                  {(analysis.careerAnalysis?.developmentAreas || []).map((area, index) => (
                    <li key={index} className="flex items-start gap-3 p-3 bg-orange-50 rounded-xl">
                      <AlertCircle className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Career Overview - Brand Colors */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-5 bg-gradient-to-r from-blue-50 to-teal-50 flex items-center gap-3">
            <div className="p-2 bg-blue-900 rounded-xl">
              <Target className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Career Overview</h2>
          </div>
          <div className="px-6 py-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-xl">
              <h3 className="font-medium text-blue-900 mb-2">Current Stage</h3>
              <p className="text-blue-700">{analysis.careerAnalysis?.currentStage || 'Not available'}</p>
            </div>
            <div className="p-4 bg-teal-50 rounded-xl">
              <h3 className="font-medium text-teal-900 mb-2">Progression Path</h3>
              <p className="text-teal-700">{analysis.careerAnalysis?.progressionPath || 'Not available'}</p>
            </div>
          </div>
        </div>

        {/* Action Plan - Brand Colors */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-5 bg-gradient-to-r from-teal-50 to-blue-50 flex items-center gap-3">
            <div className="p-2 bg-teal-600 rounded-xl">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Your Action Plan</h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {analysis.actionPlan.map((plan, index) => {
                const Icon = getSafeIcon(plan.icon);
                return (
                  <div key={index} className="p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${
                        plan.priority === 'High' ? 'bg-red-100' :
                        plan.priority === 'Medium' ? 'bg-yellow-100' : 'bg-green-100'
                      }`}>
                        <Icon className={`h-5 w-5 ${
                          plan.priority === 'High' ? 'text-red-600' :
                          plan.priority === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{plan.title}</h3>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            plan.priority === 'High' ? 'bg-red-100 text-red-700' :
                            plan.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {plan.priority} Priority
                          </span>
                        </div>
                        <p className="text-gray-600 mb-3">{plan.description}</p>
                        <ul className="space-y-2">
                          {plan.steps.map((step, stepIndex) => (
                            <li key={stepIndex} className="flex items-center gap-2 text-sm text-gray-600">
                              <ArrowRight className="h-4 w-4 text-blue-500" />
                              {step}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Call to Action - Brand Colors */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 via-blue-800 to-teal-600 rounded-2xl p-8 text-white text-center">
          <Sparkles className="h-10 w-10 mx-auto mb-4 text-amber-400" />
          <h2 className="text-2xl font-bold mb-2">Ready to Level Up?</h2>
          <p className="text-white/80 mb-6 max-w-lg mx-auto">
            Explore learning paths and opportunities tailored to your career goals
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => setStage(9)}
              className="px-6 py-3 bg-white text-blue-900 rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <Book className="h-5 w-5" />
              View Learning Paths
            </button>
            <button
              onClick={() => setStage(10)}
              className="px-6 py-3 bg-white/20 text-white rounded-xl hover:bg-white/30 transition-all duration-200 font-medium flex items-center justify-center gap-2"
            >
              <Briefcase className="h-5 w-5" />
              Explore Jobs
            </button>
          </div>
        </div>
      </main>

      {/* Resume Template Download Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-900 to-teal-600 px-6 py-4 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-xl">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold">Resume Template</h3>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              {/* Preview Card */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6 border border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <FileText className="h-8 w-8 text-blue-900" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">Resume Template.docx</p>
                    <p className="text-sm text-gray-500 mt-1">Professional resume template with modern formatting</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">Microsoft Word</span>
                      <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs rounded-full">Editable</span>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-6">
                Use this template to create a polished resume. It includes sections for contact info, summary, experience, education, and skills.
              </p>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setShowTemplateModal(false)}
                  className="flex-1 px-4 py-3 border-2 border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDownloadTemplate}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-900 to-teal-600 text-white font-medium rounded-xl hover:shadow-lg transition-all"
                >
                  <Download className="h-5 w-5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResumeAnalysis;
