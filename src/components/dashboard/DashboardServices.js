// Dashboard API Services
import API_CONFIG from '../../config/api';
import { calculateMatchScore } from './DashboardUtils';
import { getJobRecommendations, getJobBoardSearchUrls } from '../../services/jobSearchService';

// Generate Learning Paths
export const generateLearningPaths = async (user, selectedCareerPath) => {
  console.log('Generating learning paths for career:', selectedCareerPath.title);
  try {
    const recommendationPayload = {
      userId: user.userID,
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      careerPath: selectedCareerPath.title,
      pathType: 'learning_paths',
      experienceLevel: user?.experienceLevel || user?.careerStage || 'entry',
      includeEnhancedDetails: true,
      skills: selectedCareerPath.requiredSkills || [],
      interests: Array.isArray(user?.interests) ? user.interests : [],
      requestDetails: {
        requestType: 'learning_resources',
        generateLinks: true,
        categories: ['onlineCourses', 'certifications', 'tutorials', 'communities', 'professionalResources']
      }
    };

    const response = await fetch(API_CONFIG.recommendations.generate(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        httpMethod: 'POST',
        path: '/recommendations/generate',
        body: JSON.stringify(recommendationPayload)
      })
    });

    const data = await response.json();
    console.log('Learning paths raw response:', data);

    if (data.body) {
      const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
      console.log('Learning paths parsed body:', parsedBody);

      const recommendations = parsedBody.recommendations || {};
      console.log('Extracted recommendations:', recommendations);

      const learningPaths = [];

      if (recommendations.careerPaths && recommendations.careerPaths.length > 0) {
        const mainPath = recommendations.careerPaths[0];
        learningPaths.push({
          title: `${selectedCareerPath.title} Core Skills`,
          progress: 0,
          provider: "NxtGrnd AI Pro",
          nextLesson: "Fundamentals",
          description: mainPath.description || "Master the essential skills required for your role",
          skills: mainPath.requiredSkills || [],
          resources: [
            {
              type: 'course',
              title: 'LinkedIn Learning Path',
              url: `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(selectedCareerPath.title)}`,
              provider: 'LinkedIn Learning',
              description: 'Professional courses for your career path',
              rating: 4.5,
              duration: '20-30 hours'
            },
            {
              type: 'tutorial',
              title: 'Online Training',
              url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(selectedCareerPath.title)}`,
              provider: 'Udemy',
              description: 'Hands-on tutorials and projects',
              difficulty: 'Beginner to Advanced'
            }
          ]
        });

        learningPaths.push({
          title: "Professional Development",
          progress: 0,
          provider: "NxtGrnd AI Pro",
          nextLesson: "Industry Standards",
          description: "Enhance your professional capabilities",
          resources: [
            {
              type: 'community',
              title: 'Professional Network',
              url: `https://www.meetup.com/find/?keywords=${encodeURIComponent(selectedCareerPath.title)}`,
              platform: 'Meetup',
              description: 'Join local professional groups',
              memberCount: 5000
            },
            {
              type: 'resource',
              title: 'Industry News & Updates',
              url: `https://news.google.com/search?q=${encodeURIComponent(selectedCareerPath.title)}+industry+news`,
              provider: 'Google News',
              description: 'Stay updated with industry trends',
              category: 'News'
            }
          ]
        });

        if (mainPath.recommendedCertifications) {
          mainPath.recommendedCertifications.forEach(cert => {
            learningPaths.push({
              title: cert.name,
              progress: 0,
              provider: cert.provider || "Industry Standard",
              nextLesson: "Certification Basics",
              description: `Prepare for ${cert.name} certification`,
              resources: [
                {
                  type: 'certification',
                  title: `${cert.name} Official Prep`,
                  url: `https://www.coursera.org/search?query=${encodeURIComponent(cert.name)}`,
                  provider: 'Coursera',
                  description: 'Official certification preparation course',
                  examCode: cert.code || 'TBD',
                  preparationTime: cert.timeframe || '3-6 months'
                },
                {
                  type: 'community',
                  title: 'Study Group',
                  url: `https://www.reddit.com/r/certification/search/?q=${encodeURIComponent(cert.name)}`,
                  platform: 'Reddit',
                  description: 'Join certification study groups',
                  memberCount: 10000
                }
              ]
            });
          });
        }
      }

      console.log('Generated learning paths:', learningPaths);
      return learningPaths;
    }

    throw new Error('No valid learning paths found');

  } catch (error) {
    console.error('Error in generateLearningPaths:', error);
    return [{
      title: `${selectedCareerPath.title} Fundamentals`,
      progress: 0,
      provider: "NxtGrnd AI Pro",
      nextLesson: "Introduction to " + selectedCareerPath.title,
      description: `Essential skills and knowledge for ${selectedCareerPath.title}`,
      resources: [
        {
          type: 'course',
          title: 'Getting Started',
          url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(selectedCareerPath.title)}+fundamentals`,
          provider: 'Udemy',
          description: 'Foundational concepts and skills',
          rating: 4.0,
          duration: '10-15 hours'
        }
      ]
    }];
  }
};

// Generate Opportunities - Now fetches real jobs from job boards
export const generateOpportunities = async (user, selectedCareerPath) => {
  console.log('Generating opportunities for career:', selectedCareerPath.title);

  try {
    // First, try to fetch real jobs from job board APIs
    console.log('Fetching real job listings...');
    const realJobsResult = await getJobRecommendations(user, selectedCareerPath);

    if (realJobsResult.jobs && realJobsResult.jobs.length > 0) {
      console.log(`Found ${realJobsResult.jobs.length} real job listings`);

      // Get search URLs for job boards
      const searchUrls = getJobBoardSearchUrls(selectedCareerPath.title);

      const opportunities = realJobsResult.jobs.map(job => ({
        id: job.id,
        type: "job",
        role: job.role,
        company: job.company,
        location: job.location,
        locationType: job.locationType || 'remote',
        matchScore: job.matchScore,
        postedDate: job.postedDate,
        description: job.description,
        salary: job.salary,
        url: job.url, // Direct link to apply
        source: job.source,
        tags: job.tags || [],
        companyLogo: job.companyLogo,
        searchUrls // Include links to search on other job boards
      }));

      // Also add some AI-generated recommendations from our API
      try {
        const aiOpportunities = await fetchAIOpportunities(user, selectedCareerPath);
        if (aiOpportunities.length > 0) {
          // Add AI recommendations with lower priority (at the end)
          opportunities.push(...aiOpportunities.slice(0, 5).map(opp => ({
            ...opp,
            source: 'NxtGrnd AI',
            searchUrls
          })));
        }
      } catch (aiError) {
        console.log('AI opportunities not available, using job board results only');
      }

      return opportunities;
    }

    // Fallback to AI-generated opportunities if job board APIs fail
    console.log('No job board results, falling back to AI recommendations');
    return await fetchAIOpportunities(user, selectedCareerPath);

  } catch (error) {
    console.error('Error in generateOpportunities:', error);
    // Final fallback
    return getFallbackOpportunities(selectedCareerPath);
  }
};

// No longer using fake company names - removed getCareerCompanies function
// AI opportunities now show job types only with links to search on job boards

// Fetch AI-generated opportunities from our recommendations API
// These are job TYPES (not fake listings) - users click to search on real job boards
const fetchAIOpportunities = async (user, selectedCareerPath) => {
  const recommendationPayload = {
    userId: user.userID,
    firstName: user?.firstName,
    lastName: user?.lastName,
    email: user?.email,
    careerPath: selectedCareerPath.title,
    pathType: 'opportunities',
    experienceLevel: user?.experienceLevel || user?.careerStage || 'entry',
    includeEnhancedDetails: true,
    skills: selectedCareerPath.requiredSkills || [],
    interests: Array.isArray(user?.interests) ? user.interests : []
  };

  const response = await fetch(API_CONFIG.recommendations.generate(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      httpMethod: 'POST',
      path: '/recommendations/generate',
      body: JSON.stringify(recommendationPayload)
    })
  });

  const data = await response.json();
  const searchUrls = getJobBoardSearchUrls(selectedCareerPath.title);

  if (data.body) {
    const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;

    if (parsedBody.recommendations?.careerPaths) {
      const careerData = parsedBody.recommendations.careerPaths;

      // Return job TYPES, not fake company listings
      return careerData.map((path) => ({
        id: `ai-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: "job_type", // Mark as job type, not actual listing
        role: path.title,
        company: null, // No fake company names
        location: "Remote/Multiple Locations",
        locationType: 'hybrid',
        matchScore: path.matchScore || calculateMatchScore(path.requiredSkills || [], user?.skills || []),
        description: path.description || `${path.title} roles matching your skills and career goals`,
        salaryRange: path.salaryRange,
        source: 'NxtGrnd AI',
        searchUrls // Links to search on real job boards
      }));
    }
  }

  return [];
};

// Fallback opportunities when APIs fail
const getFallbackOpportunities = (selectedCareerPath) => {
  const searchUrls = getJobBoardSearchUrls(selectedCareerPath.title);

  return [{
    id: `fallback-${Date.now()}`,
    type: "job",
    role: selectedCareerPath.title,
    company: "Multiple Companies Hiring",
    location: "Remote",
    locationType: 'remote',
    matchScore: 85,
    postedDate: "Recently",
    description: `Multiple ${selectedCareerPath.title} positions available. Click the links below to search on popular job boards.`,
    source: 'Search Required',
    searchUrls
  }];
};

// Generate Goals
export const generateGoals = async (user, selectedCareerPath) => {
  try {
    const steps = selectedCareerPath?.roadmap?.steps || [];
    return steps.map((step, index) => ({
      title: step.title || `Goal ${index + 1}`,
      current: 0,
      target: 100,
      unit: 'Progress',
      description: step.description || `Complete ${selectedCareerPath.title} milestone`,
      order: step.order || index + 1
    })).sort((a, b) => a.order - b.order);
  } catch (error) {
    console.error('Error generating goals:', error);
    return [{
      title: `${selectedCareerPath.title} Fundamentals`,
      current: 0,
      target: 100,
      unit: 'Progress',
      description: `Master the basics of ${selectedCareerPath.title}`,
      order: 1
    }];
  }
};

// Generate Events
export const generateEvents = async (user, selectedCareerPath) => {
  try {
    const certs = selectedCareerPath?.recommendedCertifications || [];
    return certs.map((cert) => ({
      type: 'certification',
      title: cert.name || `${selectedCareerPath.title} Certification`,
      description: `Complete ${cert.name || 'professional'} certification`,
      deadline: cert.timeframe || 'Next Month',
      provider: cert.provider || 'Industry Standard',
      difficulty: cert.difficulty || 'Medium'
    }));
  } catch (error) {
    console.error('Error generating events:', error);
    return [{
      type: 'certification',
      title: `${selectedCareerPath.title} Professional Certification`,
      description: 'Complete industry-standard certification',
      deadline: 'Next Month',
      provider: 'Industry Standard',
      difficulty: 'Medium'
    }];
  }
};
