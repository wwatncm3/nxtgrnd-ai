// Lambda function for Mentor Search API
// This function searches for potential mentors based on user preferences

const AWS = require('aws-sdk');

// Configuration
const LINKEDIN_API_KEY = process.env.LINKEDIN_API_KEY; // If using official API
const OPENAI_API_KEY = process.env.OPENAI_API_KEY; // For AI-powered matching

exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));

  // Parse request body
  let body;
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
  } catch (e) {
    return {
      statusCode: 400,
      headers: corsHeaders(),
      body: JSON.stringify({ error: 'Invalid request body' })
    };
  }

  const {
    userLinkedIn,
    companies,
    industries,
    careerLevel,
    location,
    meetingPreference,
    userCareerPath,
    userSkills,
    userEducation
  } = body;

  try {
    // Step 1: Build search criteria
    const searchCriteria = buildSearchCriteria({
      companies,
      industries,
      careerLevel,
      location,
      userCareerPath,
      userSkills
    });

    // Step 2: Search for mentors
    // In production, this would query LinkedIn API or a pre-built mentor database
    const mentors = await searchMentors(searchCriteria);

    // Step 3: Score and rank mentors based on user preferences
    const rankedMentors = rankMentors(mentors, {
      userCareerPath,
      userSkills,
      userEducation,
      preferredCompanies: companies,
      preferredIndustries: industries,
      careerLevel
    });

    // Step 4: Return top matches
    return {
      statusCode: 200,
      headers: corsHeaders(),
      body: JSON.stringify({
        mentors: rankedMentors.slice(0, 10),
        totalFound: rankedMentors.length,
        searchCriteria: searchCriteria
      })
    };

  } catch (error) {
    console.error('Error searching mentors:', error);
    return {
      statusCode: 500,
      headers: corsHeaders(),
      body: JSON.stringify({
        error: 'Failed to search for mentors',
        message: error.message
      })
    };
  }
};

// Build search criteria from user preferences
function buildSearchCriteria({ companies, industries, careerLevel, location, userCareerPath, userSkills }) {
  const criteria = {
    keywords: [],
    filters: {}
  };

  // Add career path keywords
  if (userCareerPath) {
    criteria.keywords.push(userCareerPath);
  }

  // Add skill keywords
  if (userSkills && userSkills.length > 0) {
    criteria.keywords.push(...userSkills.slice(0, 5));
  }

  // Company filter
  if (companies && companies.length > 0) {
    criteria.filters.companies = companies;
  }

  // Industry filter
  if (industries && industries.length > 0) {
    criteria.filters.industries = industries;
  }

  // Career level mapping
  const levelMapping = {
    'entry': { minYears: 3, maxYears: 5, titles: ['engineer', 'analyst', 'associate', 'specialist'] },
    'mid': { minYears: 5, maxYears: 10, titles: ['senior', 'lead', 'manager', 'principal'] },
    'senior': { minYears: 10, maxYears: 15, titles: ['staff', 'director', 'head of', 'vp'] },
    'executive': { minYears: 15, maxYears: null, titles: ['vp', 'cto', 'ceo', 'chief', 'partner'] }
  };

  if (careerLevel && levelMapping[careerLevel]) {
    criteria.filters.experience = levelMapping[careerLevel];
  }

  // Location filter
  if (location) {
    criteria.filters.location = location;
  }

  return criteria;
}

// Search for mentors (placeholder - integrate with LinkedIn API or database)
async function searchMentors(criteria) {
  // In production, this would:
  // 1. Query LinkedIn Sales Navigator API
  // 2. Or search a pre-populated mentor database
  // 3. Or use a third-party professional network API

  // For now, return sample data
  // Replace this with actual API integration
  console.log('Search criteria:', JSON.stringify(criteria, null, 2));

  // Sample mentor data structure
  return generateSampleMentors(criteria);
}

// Generate sample mentors based on criteria (for development/demo)
function generateSampleMentors(criteria) {
  const companyPool = criteria.filters.companies?.length > 0
    ? criteria.filters.companies
    : ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe', 'Airbnb'];

  const levelConfig = criteria.filters.experience || { minYears: 5, maxYears: 15 };

  const firstNames = ['Sarah', 'Marcus', 'Priya', 'David', 'Emma', 'James', 'Aisha', 'Michael', 'Jennifer', 'Carlos'];
  const lastNames = ['Chen', 'Johnson', 'Patel', 'Kim', 'Rodriguez', 'Williams', 'Ahmed', 'Lee', 'Thompson', 'Garcia'];

  const titles = [
    'Senior Software Engineer',
    'Engineering Manager',
    'Product Manager',
    'Staff Engineer',
    'Director of Engineering',
    'VP of Product',
    'Principal Engineer',
    'Tech Lead',
    'Senior Product Manager',
    'Head of Engineering'
  ];

  const schools = [
    'Stanford University',
    'MIT',
    'UC Berkeley',
    'Carnegie Mellon',
    'Georgia Tech',
    'University of Michigan',
    'Cornell University',
    'Harvard Business School',
    'Wharton School',
    'Columbia University'
  ];

  const mentors = [];
  const count = Math.min(15, 5 + Math.floor(Math.random() * 10));

  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i + 3) % lastNames.length];
    const yearsExp = levelConfig.minYears + Math.floor(Math.random() * (levelConfig.maxYears - levelConfig.minYears || 10));

    mentors.push({
      id: `mentor-${i + 1}`,
      name: `${firstName} ${lastName}`,
      title: titles[i % titles.length],
      company: companyPool[i % companyPool.length],
      location: criteria.filters.location || ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Boston, MA'][i % 5],
      linkedinUrl: `https://linkedin.com/in/${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Math.floor(Math.random() * 1000000)}`,
      yearsExperience: yearsExp,
      education: schools[i % schools.length],
      skills: extractRelevantSkills(criteria.keywords),
      industries: criteria.filters.industries?.slice(0, 2) || ['Technology'],
      bio: `Experienced ${titles[i % titles.length]} passionate about mentoring the next generation of tech professionals.`,
      profileImage: null,
      openToMentoring: true,
      responseRate: 75 + Math.floor(Math.random() * 20)
    });
  }

  return mentors;
}

// Extract relevant skills based on keywords
function extractRelevantSkills(keywords) {
  const baseSkills = ['Leadership', 'Strategy', 'Communication', 'Problem Solving', 'Team Building'];
  const techSkills = ['JavaScript', 'Python', 'Cloud Architecture', 'System Design', 'Data Analysis'];
  const businessSkills = ['Product Strategy', 'Go-to-Market', 'Stakeholder Management', 'Roadmap Planning'];

  const allSkills = [...baseSkills, ...techSkills, ...businessSkills];
  const relevantSkills = [];

  // Add skills that match keywords
  keywords.forEach(keyword => {
    const matchingSkills = allSkills.filter(skill =>
      skill.toLowerCase().includes(keyword.toLowerCase()) ||
      keyword.toLowerCase().includes(skill.toLowerCase())
    );
    relevantSkills.push(...matchingSkills);
  });

  // Add some random base skills
  for (let i = 0; i < 3; i++) {
    const randomSkill = baseSkills[Math.floor(Math.random() * baseSkills.length)];
    if (!relevantSkills.includes(randomSkill)) {
      relevantSkills.push(randomSkill);
    }
  }

  return [...new Set(relevantSkills)].slice(0, 6);
}

// Rank mentors based on user preferences
function rankMentors(mentors, userPreferences) {
  return mentors.map(mentor => {
    let score = 50; // Base score

    // Company match bonus (+20)
    if (userPreferences.preferredCompanies?.includes(mentor.company)) {
      score += 20;
    }

    // Industry match bonus (+15)
    const industryMatch = mentor.industries?.some(ind =>
      userPreferences.preferredIndustries?.includes(ind)
    );
    if (industryMatch) {
      score += 15;
    }

    // Skill overlap bonus (+2 per matching skill, max 10)
    const skillOverlap = mentor.skills?.filter(skill =>
      userPreferences.userSkills?.some(userSkill =>
        skill.toLowerCase().includes(userSkill.toLowerCase()) ||
        userSkill.toLowerCase().includes(skill.toLowerCase())
      )
    ).length || 0;
    score += Math.min(skillOverlap * 2, 10);

    // Career level alignment (+10)
    const levelYearsMap = {
      'entry': { min: 3, max: 6 },
      'mid': { min: 5, max: 12 },
      'senior': { min: 8, max: 18 },
      'executive': { min: 12, max: 30 }
    };
    const targetYears = levelYearsMap[userPreferences.careerLevel];
    if (targetYears && mentor.yearsExperience >= targetYears.min && mentor.yearsExperience <= targetYears.max) {
      score += 10;
    }

    // Response rate bonus
    score += Math.floor((mentor.responseRate || 70) / 20);

    return {
      ...mentor,
      matchScore: Math.min(score, 99)
    };
  }).sort((a, b) => b.matchScore - a.matchScore);
}

// CORS headers
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
    'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
    'Content-Type': 'application/json'
  };
}
