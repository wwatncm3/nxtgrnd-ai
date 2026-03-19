import React, { useState, useEffect, useContext } from 'react';
import { UserContext } from '../App';
import {
  File, ArrowLeft, CheckCircle, AlertCircle,
  RefreshCw, ChevronDown, ChevronUp, TrendingUp, Target,
  Zap, Book, Star, Award, Briefcase, Clock, Sparkles, BarChart3,
  FileText, Lightbulb, ArrowRight, CheckCircle2, Download,
  Shield, User, XCircle, ScanLine
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
    const cacheKey = userId
      ? `${ANALYSIS_CACHE_KEY}_${userId}_${resumePath}`
      : `${ANALYSIS_CACHE_KEY}_${resumePath}`;
    const stored = storageUtils.getItem(cacheKey);
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

const getCareerPathKeywords = (careerPath) => {
  const path = (careerPath || '').toLowerCase();
  const keywordMap = {
    devops: ['docker', 'kubernetes', 'ci/cd', 'terraform', 'ansible', 'jenkins', 'aws', 'azure', 'gcp', 'linux', 'python', 'bash', 'helm', 'git', 'monitoring'],
    cloud: ['aws', 'azure', 'gcp', 'terraform', 'kubernetes', 'docker', 'serverless', 'iam', 'lambda', 'vpc', 'cloudformation', 'infrastructure', 'security', 'networking'],
    'machine learning': ['python', 'tensorflow', 'pytorch', 'scikit', 'ml', 'ai', 'neural', 'nlp', 'statistics', 'pandas', 'numpy', 'model', 'training', 'data'],
    'software engineer': ['javascript', 'python', 'java', 'react', 'node', 'sql', 'api', 'git', 'agile', 'testing', 'typescript', 'microservices', 'rest', 'backend'],
    'data engineer': ['python', 'sql', 'spark', 'kafka', 'etl', 'pipeline', 'airflow', 'aws', 'databricks', 'warehouse', 'postgresql', 'hadoop'],
    'full stack': ['javascript', 'react', 'node', 'python', 'sql', 'html', 'css', 'api', 'database', 'git', 'typescript', 'aws'],
    'product manager': ['roadmap', 'stakeholder', 'agile', 'scrum', 'kpi', 'user research', 'strategy', 'requirements', 'analytics', 'prioritization'],
  };
  const matchedKey = Object.keys(keywordMap).find(k => path.includes(k));
  return keywordMap[matchedKey] || ['python', 'javascript', 'aws', 'git', 'agile', 'sql', 'api', 'cloud', 'docker', 'leadership'];
};

const computeATSScore = (resumeData, user) => {
  const text = resumeData?.textractAnalysis?.rawText || '';
  const careerPath = user?.selectedCareerPath?.title || '';

  // Contact Info (20 pts)
  const hasEmail = /[\w.+-]+@[\w.-]+\.\w+/.test(text);
  const hasPhone = /(\d{3}[\s.-]?\d{3}[\s.-]?\d{4}|\(\d{3}\)\s?\d{3}[\s.-]?\d{4})/.test(text);
  const hasLinkedIn = /linkedin/i.test(text);
  const contactScore = (hasEmail ? 8 : 0) + (hasPhone ? 8 : 0) + (hasLinkedIn ? 4 : 0);

  // Sections (20 pts)
  const sectionChecks = [
    { label: 'Work Experience', regex: /work experience|experience|employment history/i, pts: 5 },
    { label: 'Education', regex: /education|academic background/i, pts: 4 },
    { label: 'Skills', regex: /skills|competencies|proficiencies/i, pts: 4 },
    { label: 'Summary / Objective', regex: /summary|objective|profile/i, pts: 4 },
    { label: 'Certifications', regex: /certification|licenses|credentials/i, pts: 3 },
  ];
  const foundSections = sectionChecks.filter(s => s.regex.test(text));
  const sectionScore = foundSections.reduce((sum, s) => sum + s.pts, 0);

  // Keywords (30 pts)
  const pathKeywords = getCareerPathKeywords(careerPath);
  const foundKeywords = pathKeywords.filter(k => new RegExp(`\\b${k}\\b`, 'i').test(text));
  const keywordScore = Math.round((foundKeywords.length / Math.max(pathKeywords.length, 1)) * 20);
  const actionVerbs = ['developed', 'implemented', 'designed', 'led', 'managed', 'created', 'built', 'engineered', 'optimized', 'reduced', 'increased', 'improved', 'delivered', 'collaborated', 'architected', 'automated', 'deployed', 'integrated', 'launched', 'mentored'];
  const foundVerbs = actionVerbs.filter(v => new RegExp(`\\b${v}`, 'i').test(text));
  const verbScore = Math.min(10, foundVerbs.length);

  // Experience Quality (15 pts)
  const metricsMatches = text.match(/\d+%|\$[\d,]+|\d+\s*(users|clients|employees|projects|applications|systems|teams|people)/gi) || [];
  const metricScore = Math.min(10, metricsMatches.length * 2);
  const hasDatePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s+\d{4}|\d{4}\s*[-–]\s*(\d{4}|present|current)/i.test(text);
  const dateScore = hasDatePattern ? 5 : 0;

  // ATS Format (15 pts)
  const textLength = text.length;
  const lengthScore = textLength > 300 && textLength < 12000 ? 5 : 2;
  const hasCleanText = (text.match(/[^\x00-\x7F]/g) || []).length < 20;
  const cleanScore = hasCleanText ? 5 : 2;
  const fileTypeScore = resumeData?.type === 'application/pdf' ? 5 : 3;
  const formatScore = lengthScore + cleanScore + fileTypeScore;

  const total = Math.min(100, contactScore + sectionScore + keywordScore + verbScore + metricScore + dateScore + formatScore);

  return {
    total,
    performance: total >= 90 ? 'Excellent' : total >= 75 ? 'Good' : total >= 60 ? 'Fair' : 'Needs Work',
    breakdown: [
      {
        label: 'Keyword Match',
        score: keywordScore + verbScore,
        max: 30,
        Icon: Target,
        color: 'blue',
        items: [
          `${foundKeywords.length}/${pathKeywords.length} role keywords matched`,
          `${foundVerbs.length} action verbs detected`,
          foundKeywords.length > 0 ? `Found: ${foundKeywords.slice(0, 4).join(', ')}` : 'Add more role-specific keywords',
        ],
      },
      {
        label: 'Contact Information',
        score: contactScore,
        max: 20,
        Icon: User,
        color: 'teal',
        items: [
          hasEmail ? '✓ Email address found' : '✗ Add email address',
          hasPhone ? '✓ Phone number found' : '✗ Add phone number',
          hasLinkedIn ? '✓ LinkedIn found' : '✗ Consider adding LinkedIn URL',
        ],
      },
      {
        label: 'Resume Sections',
        score: sectionScore,
        max: 20,
        Icon: FileText,
        color: 'purple',
        items: sectionChecks.map(s => `${s.regex.test(text) ? '✓' : '✗'} ${s.label}`),
      },
      {
        label: 'Experience Quality',
        score: metricScore + dateScore,
        max: 15,
        Icon: TrendingUp,
        color: 'green',
        items: [
          `${metricsMatches.length} quantifiable achievement${metricsMatches.length !== 1 ? 's' : ''} found`,
          hasDatePattern ? '✓ Employment dates present' : '✗ Add dates to all experience entries',
          metricsMatches.length < 3 ? '⚠ Add numbers/metrics to strengthen impact' : '✓ Good use of metrics',
        ],
      },
      {
        label: 'ATS Format',
        score: formatScore,
        max: 15,
        Icon: Shield,
        color: 'orange',
        items: [
          resumeData?.type === 'application/pdf' ? '✓ PDF format (ATS compatible)' : '⚠ Consider submitting as PDF',
          hasCleanText ? '✓ Clean text, no encoding issues' : '⚠ Special characters detected',
          textLength > 300 ? '✓ Sufficient content length' : '✗ Resume content seems too short',
        ],
      },
    ],
  };
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
  const [atsResults, setAtsResults] = useState(null);
  const [atsScanning, setAtsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
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
        requestType: 'resume_analysis',
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

        const fallbackCacheKey = user?.userID
          ? `${ANALYSIS_CACHE_KEY}_${user.userID}_${currentResumeData.path}`
          : `${ANALYSIS_CACHE_KEY}_${currentResumeData.path}`;
        storageUtils.setItem(fallbackCacheKey, fallbackAnalysis);
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

      const analysisCacheKey = user?.userID
        ? `${ANALYSIS_CACHE_KEY}_${user.userID}_${currentResumeData.path}`
        : `${ANALYSIS_CACHE_KEY}_${currentResumeData.path}`;
      storageUtils.setItem(analysisCacheKey, analysisResult);
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

  const startATSScan = () => {
    setAtsResults(null);
    setAtsScanning(true);
    setScanProgress(0);
    let progress = 0;
    const interval = setInterval(() => {
      progress += 1;
      setScanProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        const results = computeATSScore(resumeData, user);
        setAtsResults(results);
        setAtsScanning(false);
      }
    }, 28); // ~2.8 seconds total
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

        {/* ATS Scanner */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-8">
          <div className="px-6 py-5 bg-gradient-to-r from-purple-50 to-indigo-50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-xl">
                <Shield className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">ATS Compatibility Scanner</h2>
                <p className="text-xs text-gray-500">See how your resume performs against applicant tracking systems</p>
              </div>
            </div>
            {atsResults && (
              <button onClick={startATSScan} className="text-sm text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1">
                <RefreshCw className="h-3 w-3" /> Re-scan
              </button>
            )}
          </div>

          <div className="p-8">
            {/* Initial state */}
            {!atsScanning && !atsResults && (
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Document preview */}
                <div className="flex-shrink-0">
                  <div className="relative w-40 h-52 bg-white border-2 border-gray-200 rounded-lg shadow-md overflow-hidden">
                    <div className="p-2 h-full overflow-hidden">
                      {(resumeData?.textractAnalysis?.rawText || '').split('\n').slice(0, 18).map((line, i) => (
                        <div key={i} className={`h-1.5 rounded mb-1 ${i === 0 ? 'bg-gray-500 w-3/4' : i === 1 ? 'bg-gray-400 w-1/2' : 'bg-gray-200'}`}
                          style={{ width: i > 1 ? `${50 + (i * 17 % 40)}%` : undefined }} />
                      ))}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-purple-100/30 to-transparent" />
                  </div>
                </div>
                {/* CTA */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Check ATS Compatibility</h3>
                  <p className="text-gray-600 mb-4 text-sm">
                    75% of resumes are rejected by ATS before a human sees them. Scan yours to find formatting issues, missing keywords, and gaps that could be costing you interviews.
                  </p>
                  <ul className="text-sm text-gray-500 mb-6 space-y-1">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Keyword match against your target role</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Section & formatting check</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-green-500" /> Contact info & dates validation</li>
                  </ul>
                  <button
                    onClick={startATSScan}
                    className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all duration-200 font-medium flex items-center gap-2 mx-auto md:mx-0"
                  >
                    <ScanLine className="h-5 w-5" />
                    Scan My Resume
                  </button>
                </div>
              </div>
            )}

            {/* Scanning animation */}
            {atsScanning && (
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Animated document */}
                <div className="flex-shrink-0">
                  <div className="relative w-40 h-52 bg-white border-2 border-purple-300 rounded-lg shadow-md overflow-hidden">
                    <div className="p-2 h-full overflow-hidden">
                      {(resumeData?.textractAnalysis?.rawText || '').split('\n').slice(0, 18).map((line, i) => (
                        <div key={i} className={`h-1.5 rounded mb-1 ${i === 0 ? 'bg-gray-500 w-3/4' : i === 1 ? 'bg-gray-400 w-1/2' : 'bg-gray-200'}`}
                          style={{ width: i > 1 ? `${50 + (i * 17 % 40)}%` : undefined }} />
                      ))}
                    </div>
                    {/* Scan line */}
                    <div
                      className="absolute left-0 right-0 h-0.5 pointer-events-none"
                      style={{
                        top: `${scanProgress}%`,
                        background: 'linear-gradient(90deg, transparent, #7c3aed, #4f46e5, #7c3aed, transparent)',
                        boxShadow: '0 0 8px 2px rgba(124, 58, 237, 0.6)',
                      }}
                    />
                    {/* Scanned overlay */}
                    <div
                      className="absolute left-0 right-0 top-0 bg-purple-500/5 pointer-events-none"
                      style={{ height: `${scanProgress}%` }}
                    />
                  </div>
                </div>
                {/* Progress */}
                <div className="flex-1 text-center md:text-left">
                  <p className="text-purple-700 font-semibold text-lg mb-1">Scanning resume...</p>
                  <p className="text-gray-500 text-sm mb-4">
                    {scanProgress < 30 ? 'Checking contact information & sections...'
                      : scanProgress < 60 ? 'Matching keywords against your target role...'
                      : scanProgress < 85 ? 'Analyzing experience quality & metrics...'
                      : 'Evaluating ATS format compatibility...'}
                  </p>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-2">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full transition-all duration-100"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                  <p className="text-purple-600 font-bold text-2xl">{scanProgress}%</p>
                </div>
              </div>
            )}

            {/* Results */}
            {atsResults && (
              <div>
                {/* Score hero */}
                <div className="flex flex-col md:flex-row items-center gap-6 mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl">
                  {/* Circular score */}
                  <div className="relative flex-shrink-0">
                    <div className="w-32 h-32 relative">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="56" stroke="rgba(124,58,237,0.15)" strokeWidth="10" fill="none" />
                        <circle cx="64" cy="64" r="56" stroke="url(#atsGrad)" strokeWidth="10" fill="none"
                          strokeLinecap="round"
                          strokeDasharray={`${(atsResults.total / 100) * 352} 352`}
                        />
                        <defs>
                          <linearGradient id="atsGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#7c3aed" />
                            <stop offset="100%" stopColor="#4f46e5" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-bold text-purple-700">{atsResults.total}</span>
                        <span className="text-xs text-gray-500">/ 100</span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl font-bold text-gray-900">{atsResults.performance}</span>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        atsResults.total >= 90 ? 'bg-green-100 text-green-700'
                        : atsResults.total >= 75 ? 'bg-blue-100 text-blue-700'
                        : atsResults.total >= 60 ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                      }`}>ATS Score</span>
                    </div>
                    <p className="text-gray-600 text-sm">
                      {atsResults.total >= 90 ? 'Your resume is highly ATS compatible and should pass most automated filters.'
                        : atsResults.total >= 75 ? 'Your resume passes most ATS filters. A few tweaks could push it higher.'
                        : atsResults.total >= 60 ? 'Your resume may pass some ATS systems but could be filtered out. Review the areas below.'
                        : 'Your resume is at risk of being filtered out. Address the issues below before applying.'}
                    </p>
                  </div>
                </div>

                {/* Breakdown */}
                <div className="space-y-4">
                  {atsResults.breakdown.map((section, i) => {
                    const pct = Math.round((section.score / section.max) * 100);
                    const { Icon } = section;
                    const barColor = pct >= 80 ? 'from-green-400 to-emerald-500'
                      : pct >= 60 ? 'from-yellow-400 to-orange-400'
                      : 'from-red-400 to-rose-500';
                    return (
                      <div key={i} className="border border-gray-100 rounded-xl p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-gray-500" />
                            <span className="font-medium text-gray-800 text-sm">{section.label}</span>
                          </div>
                          <span className={`text-sm font-bold ${pct >= 80 ? 'text-green-600' : pct >= 60 ? 'text-yellow-600' : 'text-red-500'}`}>
                            {section.score}/{section.max}
                          </span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-3">
                          <div className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-700`}
                            style={{ width: `${pct}%` }} />
                        </div>
                        <ul className="space-y-1">
                          {section.items.map((item, j) => (
                            <li key={j} className={`text-xs flex items-start gap-1.5 ${
                              item.startsWith('✓') ? 'text-green-700'
                              : item.startsWith('✗') ? 'text-red-600'
                              : item.startsWith('⚠') ? 'text-yellow-700'
                              : 'text-gray-600'
                            }`}>
                              <span className="mt-0.5 flex-shrink-0">
                                {item.startsWith('✓') ? <CheckCircle className="h-3 w-3" />
                                  : item.startsWith('✗') ? <XCircle className="h-3 w-3" />
                                  : item.startsWith('⚠') ? <AlertCircle className="h-3 w-3" />
                                  : <ArrowRight className="h-3 w-3 text-gray-400" />}
                              </span>
                              <span>{item.replace(/^[✓✗⚠]\s*/, '')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
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
