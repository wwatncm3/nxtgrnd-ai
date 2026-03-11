// Job Search Service
// Fetches real job listings from multiple job board APIs and aggregates results

// Job board configurations
const JOB_BOARDS = {
  // Note: Most job board APIs require API keys. These are structured to be easily configured
  // via environment variables when API keys are obtained
  ADZUNA: {
    name: 'Adzuna',
    baseUrl: process.env.REACT_APP_ADZUNA_API || null,
    appId: process.env.REACT_APP_ADZUNA_APP_ID || null,
    appKey: process.env.REACT_APP_ADZUNA_APP_KEY || null,
    enabled: false // Enable when API keys are configured
  },
  JOOBLE: {
    name: 'Jooble',
    baseUrl: 'https://jooble.org/api',
    apiKey: process.env.REACT_APP_JOOBLE_API_KEY || null,
    enabled: false
  },
  REMOTIVE: {
    name: 'Remotive',
    baseUrl: 'https://remotive.com/api/remote-jobs',
    enabled: true // Free API, no key required
  },
  ARBEITNOW: {
    name: 'Arbeitnow',
    baseUrl: 'https://www.arbeitnow.com/api/job-board-api',
    enabled: true // Free API
  }
};

// Generate direct job board search URLs for user to click
export const getJobBoardSearchUrls = (role, location = '') => {
  const encodedRole = encodeURIComponent(role);
  const encodedLocation = location ? encodeURIComponent(location) : '';

  return {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}${encodedLocation ? `&location=${encodedLocation}` : ''}`,
    indeed: `https://www.indeed.com/jobs?q=${encodedRole}${encodedLocation ? `&l=${encodedLocation}` : ''}`,
    glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedRole}${encodedLocation ? `&locT=C&locId=${encodedLocation}` : ''}`,
    handshake: `https://app.joinhandshake.com/stu/jobs?keywords=${encodedRole}`,
    ziprecruiter: `https://www.ziprecruiter.com/jobs-search?search=${encodedRole}${encodedLocation ? `&location=${encodedLocation}` : ''}`,
    dice: `https://www.dice.com/jobs?q=${encodedRole}${encodedLocation ? `&location=${encodedLocation}` : ''}`,
    wellfound: `https://wellfound.com/jobs?q=${encodedRole}`, // AngelList/Wellfound for startups
    builtin: `https://builtin.com/jobs?search=${encodedRole}` // Tech jobs
  };
};

// Fetch jobs from Remotive (free API for remote jobs)
const fetchRemotiveJobs = async (keywords, category = '') => {
  try {
    let url = `${JOB_BOARDS.REMOTIVE.baseUrl}`;
    if (category) {
      url += `?category=${encodeURIComponent(category)}`;
    }

    const response = await fetch(url);
    if (!response.ok) throw new Error('Remotive API error');

    const data = await response.json();
    const jobs = data.jobs || [];

    // Filter by keywords if provided
    const filteredJobs = keywords
      ? jobs.filter(job =>
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
          job.company_name.toLowerCase().includes(keywords.toLowerCase()) ||
          (job.tags || []).some(tag => tag.toLowerCase().includes(keywords.toLowerCase()))
      )
      : jobs;

    return filteredJobs.slice(0, 20).map(job => ({
      id: `remotive-${job.id}`,
      source: 'Remotive',
      role: job.title,
      company: job.company_name,
      location: 'Remote',
      locationType: 'remote',
      description: job.description?.substring(0, 300) + '...',
      postedDate: new Date(job.publication_date).toLocaleDateString(),
      url: job.url,
      salary: job.salary || 'Not specified',
      tags: job.tags || [],
      companyLogo: job.company_logo
    }));
  } catch (error) {
    console.error('Error fetching from Remotive:', error);
    return [];
  }
};

// Fetch jobs from Arbeitnow (free API)
const fetchArbeitnowJobs = async (keywords) => {
  try {
    const response = await fetch(JOB_BOARDS.ARBEITNOW.baseUrl);
    if (!response.ok) throw new Error('Arbeitnow API error');

    const data = await response.json();
    const jobs = data.data || [];

    // Filter by keywords
    const filteredJobs = keywords
      ? jobs.filter(job =>
        job.title.toLowerCase().includes(keywords.toLowerCase()) ||
          job.company_name.toLowerCase().includes(keywords.toLowerCase()) ||
          (job.tags || []).some(tag => tag.toLowerCase().includes(keywords.toLowerCase()))
      )
      : jobs;

    return filteredJobs.slice(0, 20).map(job => ({
      id: `arbeitnow-${job.slug}`,
      source: 'Arbeitnow',
      role: job.title,
      company: job.company_name,
      location: job.location || 'Remote',
      locationType: job.remote ? 'remote' : 'onsite',
      description: job.description?.substring(0, 300) + '...',
      postedDate: new Date(job.created_at).toLocaleDateString(),
      url: job.url,
      tags: job.tags || []
    }));
  } catch (error) {
    console.error('Error fetching from Arbeitnow:', error);
    return [];
  }
};

// Calculate match score based on user skills and job requirements
export const calculateJobMatchScore = (job, userSkills = [], userInterests = [], careerPath = '') => {
  let score = 70; // Base score

  const jobText = `${job.role} ${job.description || ''} ${(job.tags || []).join(' ')}`.toLowerCase();
  const careerPathLower = careerPath.toLowerCase();

  // Match career path (+15 points)
  if (careerPathLower && jobText.includes(careerPathLower)) {
    score += 15;
  }

  // Match skills (+2 points per skill, max 10)
  const skillMatches = userSkills.filter(skill =>
    jobText.includes(skill.toLowerCase())
  ).length;
  score += Math.min(skillMatches * 2, 10);

  // Match interests (+1 point per interest, max 5)
  const interestMatches = userInterests.filter(interest =>
    jobText.includes(interest.toLowerCase())
  ).length;
  score += Math.min(interestMatches * 1, 5);

  // Remote job bonus for wider accessibility (+5)
  if (job.locationType === 'remote') {
    score += 5;
  }

  return Math.min(score, 100);
};

// Main function to search jobs across all enabled sources
export const searchJobs = async (params = {}) => {
  const {
    keywords = '',
    location = '',
    remote = false,
    userSkills = [],
    userInterests = [],
    careerPath = '',
    limit = 30
  } = params;

  console.log('Searching jobs with params:', { keywords, location, remote, careerPath });

  const allJobs = [];
  const errors = [];

  // Fetch from enabled job boards in parallel
  const fetchPromises = [];

  if (JOB_BOARDS.REMOTIVE.enabled) {
    // Map career paths to Remotive categories
    const remotiveCategory = mapToRemotiveCategory(keywords || careerPath);
    fetchPromises.push(
      fetchRemotiveJobs(keywords || careerPath, remotiveCategory)
        .then(jobs => allJobs.push(...jobs))
        .catch(err => errors.push({ source: 'Remotive', error: err.message }))
    );
  }

  if (JOB_BOARDS.ARBEITNOW.enabled) {
    fetchPromises.push(
      fetchArbeitnowJobs(keywords || careerPath)
        .then(jobs => allJobs.push(...jobs))
        .catch(err => errors.push({ source: 'Arbeitnow', error: err.message }))
    );
  }

  // Wait for all fetches to complete
  await Promise.allSettled(fetchPromises);

  // Calculate match scores for all jobs
  const jobsWithScores = allJobs.map(job => ({
    ...job,
    matchScore: calculateJobMatchScore(job, userSkills, userInterests, careerPath)
  }));

  // Sort by match score (highest first)
  jobsWithScores.sort((a, b) => b.matchScore - a.matchScore);

  // Apply location filter if specified
  let filteredJobs = jobsWithScores;
  if (location && !remote) {
    filteredJobs = jobsWithScores.filter(job =>
      job.location.toLowerCase().includes(location.toLowerCase())
    );
  }
  if (remote) {
    filteredJobs = jobsWithScores.filter(job => job.locationType === 'remote');
  }

  console.log(`Found ${filteredJobs.length} jobs after filtering`);

  return {
    jobs: filteredJobs.slice(0, limit),
    totalFound: filteredJobs.length,
    sources: Object.entries(JOB_BOARDS)
      .filter(([_, config]) => config.enabled)
      .map(([_, config]) => config.name),
    errors: errors.length > 0 ? errors : null
  };
};

// Map career paths to Remotive categories
const mapToRemotiveCategory = (careerPath) => {
  const categoryMap = {
    'software': 'software-dev',
    'developer': 'software-dev',
    'engineer': 'software-dev',
    'frontend': 'software-dev',
    'backend': 'software-dev',
    'fullstack': 'software-dev',
    'data': 'data',
    'machine learning': 'data',
    'ai': 'data',
    'product': 'product',
    'design': 'design',
    'ux': 'design',
    'ui': 'design',
    'marketing': 'marketing',
    'sales': 'sales',
    'customer': 'customer-support',
    'hr': 'hr',
    'finance': 'finance-legal',
    'devops': 'devops',
    'qa': 'qa',
    'writing': 'writing',
    'content': 'writing'
  };

  const lowerPath = careerPath.toLowerCase();
  for (const [key, category] of Object.entries(categoryMap)) {
    if (lowerPath.includes(key)) {
      return category;
    }
  }
  return ''; // No specific category
};

// Get job recommendations based on user profile
export const getJobRecommendations = async (user, careerPath) => {
  const searchParams = {
    keywords: careerPath?.title || '',
    userSkills: user?.skills || careerPath?.requiredSkills || [],
    userInterests: user?.interests || [],
    careerPath: careerPath?.title || '',
    remote: true, // Start with remote jobs as they're most accessible
    limit: 20
  };

  const results = await searchJobs(searchParams);

  // If we got less than 5 jobs, also try searching without remote filter
  if (results.jobs.length < 5) {
    const additionalResults = await searchJobs({
      ...searchParams,
      remote: false,
      limit: 20 - results.jobs.length
    });

    // Add unique jobs from additional results
    const existingIds = new Set(results.jobs.map(j => j.id));
    additionalResults.jobs.forEach(job => {
      if (!existingIds.has(job.id)) {
        results.jobs.push(job);
      }
    });
  }

  return results;
};

// Export all functions
const jobSearchService = {
  searchJobs,
  getJobRecommendations,
  getJobBoardSearchUrls,
  calculateJobMatchScore
};

export default jobSearchService;
