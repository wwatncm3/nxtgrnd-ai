import React, { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Lightbulb } from 'lucide-react';
import { storageUtils } from '../utils/authUtils';

// Context for managing tooltip state across the app
const TooltipContext = createContext();

const TOOLTIP_STORAGE_KEY = 'onboarding_tooltips_seen';
const NEW_USER_WINDOW_MS = 5 * 60 * 1000; // 5 minutes - consider user "new" if account created within this window

// Tooltip configurations for each page/stage
export const TOOLTIP_CONFIGS = {
  dashboard: {
    id: 'dashboard',
    title: 'Welcome to Your Dashboard!',
    steps: [
      {
        target: 'learning-paths',
        title: 'Learning Paths',
        content: 'Personalized courses and resources tailored to your career goals. Track your progress as you learn new skills.',
        position: 'bottom'
      },
      {
        target: 'opportunities',
        title: 'Job Opportunities',
        content: 'Real job listings matched to your skills and interests. Click any job to view details or apply.',
        position: 'bottom'
      },
      {
        target: 'goals',
        title: 'Your Goals',
        content: 'Track milestones on your career journey. Complete goals to unlock achievements!',
        position: 'bottom'
      },
      {
        target: 'sidebar',
        title: 'Quick Navigation',
        content: 'Access all features from the sidebar - Career Compass, Settings, and more.',
        position: 'right'
      }
    ]
  },
  careerCompass: {
    id: 'careerCompass',
    title: 'AI Career Compass',
    steps: [
      {
        target: 'career-paths',
        title: 'Your Career Paths',
        content: 'AI-generated career recommendations based on your skills and interests. Each path shows salary ranges and growth potential.',
        position: 'bottom'
      },
      {
        target: 'path-details',
        title: 'Explore Details',
        content: 'Click any career path to see required skills, certifications, and a roadmap to success.',
        position: 'left'
      },
      {
        target: 'refresh-btn',
        title: 'Get New Suggestions',
        content: 'Not seeing what you want? Refresh to generate new career path recommendations.',
        position: 'bottom'
      }
    ]
  },
  interestSelection: {
    id: 'interestSelection',
    title: 'Tell Us About You',
    steps: [
      {
        target: 'skills-section',
        title: 'Select Your Skills',
        content: 'Choose skills you already have or want to develop. This helps us personalize your career recommendations.',
        position: 'bottom'
      },
      {
        target: 'resume-upload',
        title: 'Upload Your Resume',
        content: 'Optional: Upload your resume and we\'ll automatically extract your skills and experience.',
        position: 'top'
      }
    ]
  },
  learningPaths: {
    id: 'learningPaths',
    title: 'Learning Paths',
    steps: [
      {
        target: 'course-list',
        title: 'Your Courses',
        content: 'Curated learning resources from top providers. Filter by skill level or topic.',
        position: 'bottom'
      },
      {
        target: 'progress-tracker',
        title: 'Track Progress',
        content: 'Mark courses as complete to track your learning journey and unlock achievements.',
        position: 'right'
      }
    ]
  },
  jobs: {
    id: 'jobs',
    title: 'Job Opportunities',
    steps: [
      {
        target: 'job-filters',
        title: 'Filter Jobs',
        content: 'Filter by location, job type, or salary range to find the perfect opportunity.',
        position: 'bottom'
      },
      {
        target: 'match-score',
        title: 'Match Score',
        content: 'See how well each job matches your skills. Higher scores mean better fits!',
        position: 'left'
      },
      {
        target: 'save-job',
        title: 'Save for Later',
        content: 'Bookmark jobs you\'re interested in to review later.',
        position: 'left'
      }
    ]
  },
  certifications: {
    id: 'certifications',
    title: 'Certifications',
    steps: [
      {
        target: 'cert-list',
        title: 'Recommended Certifications',
        content: 'Industry-recognized certifications to boost your career. Sorted by relevance to your goals.',
        position: 'bottom'
      },
      {
        target: 'cert-progress',
        title: 'Track Your Progress',
        content: 'Mark certifications as in-progress or complete to track your achievements.',
        position: 'right'
      }
    ]
  }
};

// Provider component
export const TooltipProvider = ({ children, userId }) => {
  const [seenTooltips, setSeenTooltips] = useState({});
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [isNewUser, setIsNewUser] = useState(true); // Default to true, will be set to false if tooltips exist
  const seenTooltipsRef = useRef({});

  // Load seen tooltips from storage on mount
  useEffect(() => {
    if (userId) {
      const stored = storageUtils.getItem(TOOLTIP_STORAGE_KEY, userId);
      if (stored && Object.keys(stored).length > 0) {
        setSeenTooltips(stored);
        seenTooltipsRef.current = stored;
        setIsNewUser(false);
      } else {
        // New user - no tooltips seen yet
        setSeenTooltips({});
        seenTooltipsRef.current = {};
        setIsNewUser(true);
        console.log('[Tooltips] New user detected, tooltips enabled');
      }
    }
  }, [userId]);

  // Mark a tooltip set as seen
  const markTooltipSeen = useCallback((tooltipId) => {
    setSeenTooltips(prev => {
      const updated = { ...prev, [tooltipId]: true };
      seenTooltipsRef.current = updated;
      if (userId) {
        storageUtils.setItem(TOOLTIP_STORAGE_KEY, updated, userId);
      }
      return updated;
    });
  }, [userId]);

  // Check if a tooltip has been seen - use ref for immediate access
  const hasSeenTooltip = useCallback((tooltipId) => {
    return seenTooltipsRef.current[tooltipId] === true;
  }, []);

  // Start a tooltip tour
  const startTooltip = useCallback((tooltipId) => {
    if (!seenTooltipsRef.current[tooltipId] && TOOLTIP_CONFIGS[tooltipId]) {
      console.log('[Tooltips] Starting tooltip:', tooltipId);
      setActiveTooltip(tooltipId);
      setCurrentStep(0);
    }
  }, []);

  // Close current tooltip
  const closeTooltip = useCallback(() => {
    setActiveTooltip(current => {
      if (current) {
        markTooltipSeen(current);
      }
      return null;
    });
    setCurrentStep(0);
  }, [markTooltipSeen]);

  // Go to next step
  const nextStep = useCallback(() => {
    // Read current state directly
    const currentTooltipId = activeTooltip;
    const config = TOOLTIP_CONFIGS[currentTooltipId];

    if (!config) return;

    if (currentStep < config.steps.length - 1) {
      // More steps remaining
      setCurrentStep(currentStep + 1);
    } else {
      // Last step - close and mark as seen
      markTooltipSeen(currentTooltipId);
      setActiveTooltip(null);
      setCurrentStep(0);
    }
  }, [activeTooltip, currentStep, markTooltipSeen]);

  // Go to previous step
  const prevStep = useCallback(() => {
    setCurrentStep(prev => prev > 0 ? prev - 1 : prev);
  }, []);

  // Skip all tooltips
  const skipAll = useCallback(() => {
    const allSeen = Object.keys(TOOLTIP_CONFIGS).reduce((acc, key) => {
      acc[key] = true;
      return acc;
    }, {});
    setSeenTooltips(allSeen);
    seenTooltipsRef.current = allSeen;
    if (userId) {
      storageUtils.setItem(TOOLTIP_STORAGE_KEY, allSeen, userId);
    }
    setActiveTooltip(null);
    setCurrentStep(0);
  }, [userId]);

  // Reset tooltips (for testing or user preference)
  const resetTooltips = useCallback(() => {
    setSeenTooltips({});
    seenTooltipsRef.current = {};
    if (userId) {
      storageUtils.removeItem(TOOLTIP_STORAGE_KEY, userId);
    }
    setIsNewUser(true);
  }, [userId]);

  return (
    <TooltipContext.Provider value={{
      isNewUser,
      activeTooltip,
      currentStep,
      hasSeenTooltip,
      startTooltip,
      closeTooltip,
      nextStep,
      prevStep,
      skipAll,
      resetTooltips
    }}>
      {children}
    </TooltipContext.Provider>
  );
};

// Hook to use tooltip context
export const useTooltip = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    return {
      isNewUser: false,
      activeTooltip: null,
      currentStep: 0,
      hasSeenTooltip: () => true,
      startTooltip: () => {},
      closeTooltip: () => {},
      nextStep: () => {},
      prevStep: () => {},
      skipAll: () => {},
      resetTooltips: () => {}
    };
  }
  return context;
};

// Tooltip overlay component
export const TooltipOverlay = () => {
  const { activeTooltip, currentStep, nextStep, prevStep, closeTooltip, skipAll } = useTooltip();

  if (!activeTooltip || !TOOLTIP_CONFIGS[activeTooltip]) {
    return null;
  }

  const config = TOOLTIP_CONFIGS[activeTooltip];
  // Safeguard against out-of-bounds step
  const safeStep = Math.min(currentStep, config.steps.length - 1);
  const step = config.steps[safeStep];
  const isLastStep = safeStep === config.steps.length - 1;
  const isFirstStep = safeStep === 0;

  if (!step) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
        onClick={closeTooltip}
      />

      {/* Tooltip Card */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 pointer-events-auto opacity-0 animate-fade-in-slow">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">{config.title}</p>
                <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
              </div>
            </div>
            <button
              onClick={closeTooltip}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            {step.content}
          </p>

          {/* Progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {config.steps.map((_, idx) => (
              <div
                key={idx}
                className={`w-2 h-2 rounded-full transition-colors ${
                  idx === safeStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={skipAll}
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip all tips
            </button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-1 px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Back
                </button>
              )}
              <button
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {isLastStep ? 'Got it!' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Hook to auto-start tooltip when page loads
export const usePageTooltip = (tooltipId) => {
  const { isNewUser, hasSeenTooltip, startTooltip } = useTooltip();

  useEffect(() => {
    // Only trigger for new users who haven't seen this tooltip
    if (isNewUser && !hasSeenTooltip(tooltipId)) {
      // Small delay to let the page render first
      const timer = setTimeout(() => {
        startTooltip(tooltipId);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isNewUser, tooltipId, hasSeenTooltip, startTooltip]);
};

export default TooltipOverlay;
