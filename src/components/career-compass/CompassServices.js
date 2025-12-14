import API_CONFIG from '../../config/api';

// Enhanced recommendation generation with force refresh option
export const generateEnhancedRecommendations = async (user, includePredictions = true, forceRefresh = false) => {
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
      forceRefresh,
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
      API_CONFIG.recommendations.generate(),
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

// Run career simulation
export const runCareerSimulation = async (user, selectedPath, scenarioType) => {
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
  return parsedBody.recommendations?.simulation;
};

// Generate default timeline steps if none provided by API
export const generateDefaultTimeline = (path) => {
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
export const generateDefaultMarketData = (path) => {
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

// Generate fallback simulation results
export const generateFallbackSimulation = (selectedPath, scenarioType) => {
  return {
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
  };
};
