// Mentor Matching Quiz Component
// Innovative LinkedIn-based mentor discovery system

import React, { useState, useContext, useEffect } from 'react';
import {
  Users, Building2, MapPin, Briefcase, GraduationCap,
  ChevronRight, ChevronLeft, Linkedin, Search, Sparkles,
  CheckCircle, ExternalLink, MessageCircle, Target,
  Sprout, TreePine, Mountain, Globe, Handshake, Dumbbell, Rocket
} from 'lucide-react';
import { UserContext } from '../App';
import { storageService, STORAGE_KEYS } from '../services/storageService';
import API_CONFIG from '../config/api';

const MentorMatchingQuiz = ({ setStage, onBack }) => {
  const { user } = useContext(UserContext);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSearching, setIsSearching] = useState(false);
  const [mentorResults, setMentorResults] = useState(null);
  const [userGeolocation, setUserGeolocation] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({
    linkedinUrl: '',
    preferredCompanies: [],
    preferredIndustries: [],
    careerLevel: '',
    location: '',
    meetingPreference: 'remote',
    mentorStyle: '',
    focusAreas: []
  });


  // Load any saved quiz progress
  useEffect(() => {
    const savedQuiz = storageService.getItem('mentorQuiz', user?.userID);
    if (savedQuiz) {
      setQuizAnswers(prev => ({ ...prev, ...savedQuiz }));
    }
  }, [user?.userID]);

  // Quiz steps configuration
  const quizSteps = [
    {
      id: 'linkedin',
      title: 'Your LinkedIn Profile',
      description: 'Share your LinkedIn to help us find mentors with similar backgrounds',
      icon: Linkedin,
      component: LinkedInStep
    },
    {
      id: 'companies',
      title: 'Dream Companies',
      description: 'Which companies would you love your mentor to work at?',
      icon: Building2,
      component: CompaniesStep
    },
    {
      id: 'industries',
      title: 'Industries of Interest',
      description: 'What industries are you passionate about?',
      icon: Target,
      component: IndustriesStep
    },
    {
      id: 'careerLevel',
      title: 'Mentor Experience Level',
      description: 'What career level mentor are you looking for?',
      icon: Briefcase,
      component: CareerLevelStep
    },
    {
      id: 'location',
      title: 'Location Preference',
      description: 'Would you like to connect with mentors near you?',
      icon: MapPin,
      component: LocationStep
    },
    {
      id: 'style',
      title: 'Mentorship Style',
      description: 'What type of guidance would benefit you most?',
      icon: GraduationCap,
      component: MentorStyleStep
    }
  ];

  const handleNext = () => {
    // Save progress
    storageService.setItem('mentorQuiz', quizAnswers, user?.userID);

    if (currentStep < quizSteps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      // Final step - search for mentors
      searchMentors();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    } else if (onBack) {
      onBack();
    }
  };

  const updateAnswer = (field, value) => {
    setQuizAnswers(prev => ({ ...prev, [field]: value }));
  };

  const searchMentors = async () => {
    setIsSearching(true);

    try {
      // Build search criteria from quiz answers
      const searchCriteria = {
        userLinkedIn: quizAnswers.linkedinUrl,
        companies: quizAnswers.preferredCompanies,
        industries: quizAnswers.preferredIndustries,
        careerLevel: quizAnswers.careerLevel,
        location: quizAnswers.location,
        meetingPreference: quizAnswers.meetingPreference,
        mentorStyle: quizAnswers.mentorStyle,
        focusAreas: quizAnswers.focusAreas,
        userCareerPath: user?.selectedCareerPath?.title,
        userSkills: user?.resume?.skills || user?.selectedCareerPath?.requiredSkills || [],
        userEducation: user?.resume?.education || []
      };

      // Use AI recommendations API for intelligent mentor matching
      try {
        const response = await fetch(API_CONFIG.recommendations.generate(), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/recommendations/generate',
            body: JSON.stringify({
              requestType: 'mentor_matching',
              userId: user?.userID,
              careerPath: user?.selectedCareerPath?.title,
              experienceLevel: user?.experienceLevel || 'entry',
              ...searchCriteria
            })
          })
        });

        if (response.ok) {
          const data = await response.json();
          const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;

          if (parsedBody?.recommendations?.mentors) {
            // Process AI-generated mentor recommendations
            const aiMentors = parsedBody.recommendations.mentors.map((mentor, index) => ({
              ...mentor,
              id: index + 1,
              linkedinUrl: generateLinkedInSearchUrl(searchCriteria, mentor.title, mentor.company),
              isSearchProfile: true
            }));
            setMentorResults(aiMentors);
            return;
          }
        }
      } catch (apiError) {
        console.log('AI API not available, using intelligent fallback');
      }

      // Fallback to intelligent local generation
      setMentorResults(generateAIMentors(searchCriteria));
    } catch (error) {
      console.error('Error searching mentors:', error);
      setMentorResults(generateAIMentors(quizAnswers));
    } finally {
      setIsSearching(false);
    }
  };

  // Generate LinkedIn search URL for finding mentors
  const generateLinkedInSearchUrl = (criteria, role, company) => {
    const params = new URLSearchParams();

    // Build keywords from role, company, and career path
    const keywords = [role, company, user?.selectedCareerPath?.title].filter(Boolean).join(' ');
    params.set('keywords', keywords);

    // Add location if specified
    if (criteria.location) {
      params.set('location', criteria.location);
    }

    return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
  };

  // Generate AI-powered mentor suggestions based on career path and user preferences
  // These represent search profiles - clicking will search LinkedIn for real professionals
  const generateAIMentors = (criteria) => {
    const careerTitle = user?.selectedCareerPath?.title || '';
    const careerLower = careerTitle.toLowerCase();

    // Career-specific company pools
    const careerCompanyPools = {
      culinary: ['Marriott Hotels', 'Hilton', 'The French Laundry', 'Blue Apron', 'Sweetgreen', 'Chipotle', 'Williams-Sonoma'],
      chef: ['Nobu', 'Gordon Ramsay Restaurants', 'Thomas Keller Restaurant Group', 'Eleven Madison Park', 'Momofuku', 'Per Se', 'Alinea'],
      cook: ['Marriott Hotels', 'Hyatt', 'Compass Group', 'Aramark', 'Sysco', 'US Foods', 'Restaurant Brands International'],
      healthcare: ['Mayo Clinic', 'Cleveland Clinic', 'Kaiser Permanente', 'Johns Hopkins', 'HCA Healthcare', 'UnitedHealth', 'CVS Health'],
      nurse: ['Mayo Clinic', 'Cleveland Clinic', 'Mass General', 'Johns Hopkins Hospital', 'Stanford Health Care', 'UCSF Medical Center'],
      teacher: ['Khan Academy', 'Coursera', 'Teach for America', 'KIPP Schools', 'Success Academy', 'Achievement First'],
      education: ['Pearson', 'McGraw Hill', '2U', 'Chegg', 'Duolingo', 'Udemy', 'Skillshare'],
      marketing: ['HubSpot', 'Salesforce', 'Adobe', 'Hootsuite', 'Mailchimp', 'Sprout Social', 'Buffer'],
      finance: ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'BlackRock', 'Fidelity', 'Vanguard', 'Charles Schwab'],
      creative: ['IDEO', 'Pentagram', 'Frog Design', 'R/GA', 'Huge', 'Publicis', 'WPP'],
      design: ['IDEO', 'Figma', 'InVision', 'Canva', 'Adobe', 'Sketch', 'Framer'],
      default: ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Stripe']
    };

    // Career-specific role pools
    const careerRolePools = {
      culinary: {
        'entry': ['Line Cook', 'Prep Cook', 'Pastry Assistant', 'Kitchen Assistant'],
        'mid': ['Sous Chef', 'Pastry Chef', 'Kitchen Manager', 'Culinary Instructor'],
        'senior': ['Executive Chef', 'Head Chef', 'Director of Culinary', 'Corporate Chef'],
        'executive': ['VP of Culinary', 'Chief Culinary Officer', 'Restaurant Group Director', 'F&B Director']
      },
      healthcare: {
        'entry': ['Registered Nurse', 'Medical Assistant', 'Health Coach', 'Clinical Coordinator'],
        'mid': ['Nurse Manager', 'Clinical Specialist', 'Healthcare Administrator', 'Senior Nurse'],
        'senior': ['Director of Nursing', 'Chief Nursing Officer', 'VP Clinical Operations', 'Medical Director'],
        'executive': ['Hospital CEO', 'Chief Medical Officer', 'VP Healthcare', 'Chief Operating Officer']
      },
      teacher: {
        'entry': ['Teacher', 'Instructor', 'Teaching Assistant', 'Curriculum Developer'],
        'mid': ['Senior Teacher', 'Department Head', 'Academic Coordinator', 'Lead Instructor'],
        'senior': ['Principal', 'Dean', 'Director of Curriculum', 'VP of Education'],
        'executive': ['Superintendent', 'Chief Academic Officer', 'Head of School', 'Education Director']
      },
      marketing: {
        'entry': ['Marketing Coordinator', 'Social Media Specialist', 'Content Creator', 'Brand Ambassador'],
        'mid': ['Marketing Manager', 'Brand Manager', 'Digital Marketing Lead', 'Content Strategist'],
        'senior': ['Director of Marketing', 'VP Marketing', 'Head of Brand', 'Chief Marketing Officer'],
        'executive': ['CMO', 'Chief Brand Officer', 'EVP Marketing', 'Global Marketing Director']
      },
      finance: {
        'entry': ['Financial Analyst', 'Investment Analyst', 'Accountant', 'Financial Advisor'],
        'mid': ['Senior Analyst', 'Portfolio Manager', 'Finance Manager', 'Investment Associate'],
        'senior': ['Director of Finance', 'VP Finance', 'Managing Director', 'Partner'],
        'executive': ['CFO', 'Chief Investment Officer', 'Head of Investment Banking', 'Managing Partner']
      },
      default: {
        'entry': ['Software Engineer', 'Product Designer', 'Data Analyst', 'Marketing Specialist'],
        'mid': ['Senior Engineer', 'Product Manager', 'Lead Designer', 'Marketing Manager'],
        'senior': ['Staff Engineer', 'Senior PM', 'Design Director', 'VP Marketing'],
        'executive': ['Engineering Director', 'VP Product', 'Chief Design Officer', 'CMO']
      }
    };

    // Find matching career category
    const findCareerCategory = (title) => {
      const titleLower = title.toLowerCase();
      if (['culinary', 'chef', 'cook', 'food', 'kitchen', 'pastry', 'baker', 'restaurant'].some(k => titleLower.includes(k))) return 'culinary';
      if (['nurse', 'doctor', 'medical', 'health', 'hospital', 'clinical', 'therapy'].some(k => titleLower.includes(k))) return 'healthcare';
      if (['teacher', 'instructor', 'professor', 'tutor', 'education', 'academic'].some(k => titleLower.includes(k))) return 'teacher';
      if (['marketing', 'brand', 'advertising', 'social media', 'content', 'communications'].some(k => titleLower.includes(k))) return 'marketing';
      if (['finance', 'financial', 'investment', 'banking', 'accounting'].some(k => titleLower.includes(k))) return 'finance';
      if (['design', 'creative', 'artist', 'graphic', 'ux', 'ui'].some(k => titleLower.includes(k))) return 'creative';
      return 'default';
    };

    const careerCategory = findCareerCategory(careerTitle);

    // Use user-selected companies if provided, otherwise use career-specific companies
    const companyPool = criteria.companies?.length > 0
      ? criteria.companies
      : careerCompanyPools[careerCategory] || careerCompanyPools.default;

    const rolePool = careerRolePools[careerCategory] || careerRolePools.default;
    const roles = rolePool[criteria.careerLevel] || rolePool['mid'];

    // Generate location-based mentor distribution
    const generateMentorLocations = (userLocation) => {
      if (!userLocation) {
        return ['San Francisco, CA', 'New York, NY', 'Seattle, WA', 'Austin, TX', 'Remote'];
      }

      // Extract state from user location
      const statePart = userLocation.split(',')[1]?.trim();

      // Major cities by state for nearby mentor matching
      const nearbyCities = {
        'CA': ['San Francisco, CA', 'Los Angeles, CA', 'San Diego, CA', 'Sacramento, CA', 'Remote'],
        'NY': ['New York, NY', 'Buffalo, NY', 'Rochester, NY', 'Albany, NY', 'Remote'],
        'TX': ['Austin, TX', 'Houston, TX', 'Dallas, TX', 'San Antonio, TX', 'Remote'],
        'FL': ['Miami, FL', 'Orlando, FL', 'Tampa, FL', 'Jacksonville, FL', 'Remote'],
        'IL': ['Chicago, IL', 'Aurora, IL', 'Naperville, IL', 'Rockford, IL', 'Remote'],
        'WA': ['Seattle, WA', 'Spokane, WA', 'Tacoma, WA', 'Vancouver, WA', 'Remote'],
        'MA': ['Boston, MA', 'Cambridge, MA', 'Worcester, MA', 'Springfield, MA', 'Remote'],
        'CO': ['Denver, CO', 'Colorado Springs, CO', 'Aurora, CO', 'Boulder, CO', 'Remote'],
        'GA': ['Atlanta, GA', 'Augusta, GA', 'Columbus, GA', 'Savannah, GA', 'Remote'],
        'NC': ['Charlotte, NC', 'Raleigh, NC', 'Durham, NC', 'Greensboro, NC', 'Remote']
      };

      // Return nearby cities if state matches, otherwise national distribution with user's city first
      const stateCities = nearbyCities[statePart];
      if (stateCities) {
        // Put user's exact location first, then nearby cities
        return [userLocation, ...stateCities.filter(city => city !== userLocation).slice(0, 4)];
      }

      // Fallback: user's location + major cities + remote
      return [
        userLocation,
        'New York, NY',
        'San Francisco, CA',
        'Austin, TX',
        'Remote'
      ];
    };

    const mentorLocations = generateMentorLocations(criteria.location);

    // Generate mentor profiles that link to real LinkedIn searches
    return Array.from({ length: 5 }, (_, i) => {
      const role = roles[i % roles.length];
      const company = companyPool[i % companyPool.length];

      return {
        id: i + 1,
        name: `${role} at ${company}`,
        title: role,
        company: company,
        location: mentorLocations[i],
        linkedinUrl: generateLinkedInSearchUrl(criteria, role, company),
        matchScore: 95 - (i * 5),
        yearsExperience: [8, 12, 6, 15, 10][i],
        education: ['Top University', 'Leading Institution', 'Renowned Program', 'Tech School', 'Business School'][i],
        skills: ['Leadership', 'Strategy', 'Technical Architecture', 'Team Building', 'Product Vision'].slice(0, 3 + i % 3),
        bio: `Find ${role} professionals at ${company} who can help guide your ${careerTitle} career.`,
        isSearchProfile: true // Flag to indicate this links to a search, not a profile
      };
    });
  };

  // Render loading state
  if (isSearching) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="text-center animate-fade-in max-w-md">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-blue-600 rounded-full animate-spin"></div>
            <Sparkles className="absolute inset-0 m-auto h-10 w-10 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Finding Your Perfect Mentors</h2>
          <p className="text-gray-600 mb-6">
            Our AI is searching LinkedIn for professionals who match your preferences...
          </p>
          <div className="flex justify-center gap-2">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Render results
  if (mentorResults) {
    return (
      <MentorResults
        mentors={mentorResults}
        quizAnswers={quizAnswers}
        onStartOver={() => {
          setMentorResults(null);
          setCurrentStep(0);
        }}
        setStage={setStage}
      />
    );
  }

  // Render current quiz step
  const CurrentStepComponent = quizSteps[currentStep].component;
  const StepIcon = quizSteps[currentStep].icon;
  const progress = ((currentStep + 1) / quizSteps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-blue-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Find Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Perfect Mentor</span></h1>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Step {currentStep + 1} of {quizSteps.length}</span>
            <span className="text-sm font-medium text-purple-600">{Math.round(progress)}% Complete</span>
          </div>
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Quiz Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8 animate-fade-in">
          {/* Step Header */}
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md">
              <StepIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {quizSteps[currentStep].title}
              </h2>
              <p className="text-gray-600">{quizSteps[currentStep].description}</p>
            </div>
          </div>

          {/* Step Content */}
          <CurrentStepComponent
            answers={quizAnswers}
            updateAnswer={updateAnswer}
            user={user}
          />

          {/* Navigation */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
              Back
            </button>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 hover:shadow-lg active:scale-95"
            >
              {currentStep === quizSteps.length - 1 ? (
                <>
                  <Search className="h-5 w-5" />
                  Find Mentors
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="h-5 w-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Step Components
const LinkedInStep = ({ answers, updateAnswer }) => (
  <div className="space-y-4">
    <label className="block">
      <span className="text-sm font-medium text-gray-700 mb-2 block">Your LinkedIn Profile URL</span>
      <div className="relative">
        <Linkedin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="url"
          value={answers.linkedinUrl}
          onChange={(e) => updateAnswer('linkedinUrl', e.target.value)}
          placeholder="https://linkedin.com/in/your-profile"
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
        />
      </div>
    </label>
    <p className="text-sm text-gray-500">
      We'll analyze your profile to find mentors with complementary experience and backgrounds.
    </p>
  </div>
);

const CompaniesStep = ({ answers, updateAnswer }) => {
  const [customCompany, setCustomCompany] = useState('');
  const popularCompanies = [
    'Google', 'Microsoft', 'Amazon', 'Apple', 'Meta', 'Netflix',
    'Stripe', 'Airbnb', 'Uber', 'Salesforce', 'Adobe', 'IBM'
  ];

  const toggleCompany = (company) => {
    const current = answers.preferredCompanies || [];
    if (current.includes(company)) {
      updateAnswer('preferredCompanies', current.filter(c => c !== company));
    } else if (current.length < 5) {
      updateAnswer('preferredCompanies', [...current, company]);
    }
  };

  const addCustomCompany = () => {
    if (customCompany.trim() && !answers.preferredCompanies?.includes(customCompany.trim())) {
      toggleCompany(customCompany.trim());
      setCustomCompany('');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Select up to 5 companies (or add your own)</p>
      <div className="flex flex-wrap gap-2">
        {popularCompanies.map(company => (
          <button
            key={company}
            onClick={() => toggleCompany(company)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              answers.preferredCompanies?.includes(company)
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {company}
            {answers.preferredCompanies?.includes(company) && (
              <CheckCircle className="inline h-4 w-4 ml-1" />
            )}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={customCompany}
          onChange={(e) => setCustomCompany(e.target.value)}
          placeholder="Add another company..."
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          onKeyPress={(e) => e.key === 'Enter' && addCustomCompany()}
        />
        <button
          onClick={addCustomCompany}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          Add
        </button>
      </div>
    </div>
  );
};

const IndustriesStep = ({ answers, updateAnswer }) => {
  const industries = [
    'Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education',
    'Entertainment', 'Consulting', 'Manufacturing', 'Real Estate', 'Energy',
    'Automotive', 'Aerospace', 'Retail', 'Telecommunications', 'Biotechnology'
  ];

  const toggleIndustry = (industry) => {
    const current = answers.preferredIndustries || [];
    if (current.includes(industry)) {
      updateAnswer('preferredIndustries', current.filter(i => i !== industry));
    } else if (current.length < 5) {
      updateAnswer('preferredIndustries', [...current, industry]);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">Select up to 5 industries</p>
      <div className="flex flex-wrap gap-2">
        {industries.map(industry => (
          <button
            key={industry}
            onClick={() => toggleIndustry(industry)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              answers.preferredIndustries?.includes(industry)
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {industry}
          </button>
        ))}
      </div>
    </div>
  );
};

const CareerLevelStep = ({ answers, updateAnswer }) => {
  const levels = [
    { id: 'entry', title: 'Entry Level', description: '1-3 years experience', Icon: Sprout },
    { id: 'mid', title: 'Mid Level', description: '4-7 years experience', Icon: TreePine },
    { id: 'senior', title: 'Senior Level', description: '8-12 years experience', Icon: TreePine },
    { id: 'executive', title: 'Executive', description: '12+ years, leadership roles', Icon: Mountain }
  ];

  return (
    <div className="grid gap-3">
      {levels.map(level => (
        <button
          key={level.id}
          onClick={() => updateAnswer('careerLevel', level.id)}
          className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
            answers.careerLevel === level.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-blue-300'
          }`}
        >
          <level.Icon className="h-6 w-6 text-gray-600" />
          <div>
            <h3 className="font-semibold text-gray-900">{level.title}</h3>
            <p className="text-sm text-gray-600">{level.description}</p>
          </div>
          {answers.careerLevel === level.id && (
            <CheckCircle className="ml-auto h-6 w-6 text-blue-600" />
          )}
        </button>
      ))}
    </div>
  );
};

const LocationStep = ({ answers, updateAnswer }) => {
  const [customLocation, setCustomLocation] = useState(answers.location || '');
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const findNearestCity = (lat, lon) => {
    const majorCities = [
      { name: 'New York', state: 'NY', lat: 40.7128, lon: -74.0060 },
      { name: 'Los Angeles', state: 'CA', lat: 34.0522, lon: -118.2437 },
      { name: 'San Francisco', state: 'CA', lat: 37.7749, lon: -122.4194 },
      { name: 'Chicago', state: 'IL', lat: 41.8781, lon: -87.6298 },
      { name: 'Houston', state: 'TX', lat: 29.7604, lon: -95.3698 },
      { name: 'Austin', state: 'TX', lat: 30.2672, lon: -97.7431 },
      { name: 'Seattle', state: 'WA', lat: 47.6062, lon: -122.3321 },
      { name: 'Boston', state: 'MA', lat: 42.3601, lon: -71.0589 },
      { name: 'Miami', state: 'FL', lat: 25.7617, lon: -80.1918 },
      { name: 'Denver', state: 'CO', lat: 39.7392, lon: -104.9903 },
      { name: 'Atlanta', state: 'GA', lat: 33.7490, lon: -84.3880 },
      { name: 'Phoenix', state: 'AZ', lat: 33.4484, lon: -112.0740 },
      { name: 'Portland', state: 'OR', lat: 45.5152, lon: -122.6784 },
      { name: 'San Diego', state: 'CA', lat: 32.7157, lon: -117.1611 },
      { name: 'Dallas', state: 'TX', lat: 32.7767, lon: -96.7970 },
      { name: 'Philadelphia', state: 'PA', lat: 39.9526, lon: -75.1652 },
      { name: 'Charlotte', state: 'NC', lat: 35.2271, lon: -80.8431 },
      { name: 'Nashville', state: 'TN', lat: 36.1627, lon: -86.7816 }
    ];

    let nearest = majorCities[0];
    let minDistance = Infinity;

    majorCities.forEach(city => {
      const distance = Math.sqrt(
        Math.pow(lat - city.lat, 2) + Math.pow(lon - city.lon, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearest = city;
      }
    });

    return nearest;
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const nearestCity = findNearestCity(latitude, longitude);
        const locationString = `${nearestCity.name}, ${nearestCity.state}`;

        setCustomLocation(locationString);
        updateAnswer('location', locationString);
        setIsGettingLocation(false);
      },
      (error) => {
        console.warn('Geolocation error:', error);
        alert('Unable to get your location. Please enter it manually.');
        setIsGettingLocation(false);
      }
    );
  };

  const preferences = [
    { id: 'remote', title: 'Remote Only', description: 'Connect virtually from anywhere', Icon: Globe },
    { id: 'local', title: 'Local Preferred', description: 'I want to meet in person sometimes', Icon: MapPin },
    { id: 'either', title: 'No Preference', description: 'Both virtual and in-person work for me', Icon: Handshake }
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {preferences.map(pref => (
          <button
            key={pref.id}
            onClick={() => updateAnswer('meetingPreference', pref.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              answers.meetingPreference === pref.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <pref.Icon className="h-6 w-6 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{pref.title}</h3>
              <p className="text-sm text-gray-600">{pref.description}</p>
            </div>
          </button>
        ))}
      </div>

      { (answers.meetingPreference === 'local' || answers.meetingPreference === 'either') && (
        <div className="animate-fade-in space-y-3">
          <label className="block text-sm font-medium text-gray-700 mb-2">Your City</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={customLocation}
              onChange={(e) => {
                setCustomLocation(e.target.value);
                updateAnswer('location', e.target.value);
              }}
              placeholder="e.g., San Francisco, CA"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleUseMyLocation}
              disabled={isGettingLocation}
              className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 whitespace-nowrap"
            >
              {isGettingLocation ? 'Getting...' : 'Use My Location'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const MentorStyleStep = ({ answers, updateAnswer }) => {
  const styles = [
    { id: 'advisor', title: 'Strategic Advisor', description: 'Big picture career guidance and industry insights', Icon: Target },
    { id: 'coach', title: 'Skills Coach', description: 'Hands-on technical and professional development', Icon: Dumbbell },
    { id: 'sponsor', title: 'Career Sponsor', description: 'Introductions, referrals, and advocacy', Icon: Rocket },
    { id: 'peer', title: 'Peer Mentor', description: 'Someone slightly ahead sharing recent experiences', Icon: Handshake }
  ];

  const focusAreas = [
    'Technical Skills', 'Leadership', 'Career Transitions', 'Work-Life Balance',
    'Salary Negotiation', 'Interview Prep', 'Networking', 'Industry Knowledge'
  ];

  const toggleFocus = (area) => {
    const current = answers.focusAreas || [];
    if (current.includes(area)) {
      updateAnswer('focusAreas', current.filter(a => a !== area));
    } else if (current.length < 3) {
      updateAnswer('focusAreas', [...current, area]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-3">
        {styles.map(style => (
          <button
            key={style.id}
            onClick={() => updateAnswer('mentorStyle', style.id)}
            className={`flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-200 ${
              answers.mentorStyle === style.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300'
            }`}
          >
            <style.Icon className="h-6 w-6 text-gray-600" />
            <div>
              <h3 className="font-semibold text-gray-900">{style.title}</h3>
              <p className="text-sm text-gray-600">{style.description}</p>
            </div>
          </button>
        ))}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Focus Areas (select up to 3)
        </label>
        <div className="flex flex-wrap gap-2">
          {focusAreas.map(area => (
            <button
              key={area}
              onClick={() => toggleFocus(area)}
              className={`px-3 py-1.5 rounded-full text-sm transition-all duration-200 ${
                answers.focusAreas?.includes(area)
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// Mentor Results Component
const MentorResults = ({ mentors, quizAnswers, onStartOver, setStage }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Sparkles className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            {mentors.length} Mentor Search Profiles Ready!
          </h1>
          <p className="text-gray-600 max-w-lg mx-auto">
            Click any card below to search LinkedIn for real professionals matching your criteria.
            Each link opens a targeted search to find mentors in your desired role and company.
          </p>
        </div>

        {/* Mentor Cards */}
        <div className="space-y-4">
          {mentors.map((mentor, index) => (
            <div
              key={mentor.id}
              className="bg-white rounded-xl shadow-lg p-6 animate-slide-up hover:shadow-xl transition-shadow"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Avatar */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
                    {mentor.name.split(' ').map(n => n[0]).join('')}
                  </div>
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{mentor.name}</h3>
                      <p className="text-blue-600 font-medium">{mentor.title}</p>
                      <p className="text-gray-600 text-sm">{mentor.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        {mentor.matchScore}% Match
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {mentor.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      {mentor.yearsExperience} years experience
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      {mentor.education}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {mentor.skills.map(skill => (
                      <span
                        key={skill}
                        className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  <p className="mt-3 text-sm text-gray-600">{mentor.bio}</p>

                  {/* Actions */}
                  <div className="mt-4 flex flex-wrap gap-3">
                    <a
                      href={mentor.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Search className="h-4 w-4" />
                      Search on LinkedIn
                      <ExternalLink className="h-4 w-4" />
                    </a>
                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                      <Linkedin className="h-4 w-4" />
                      Open LinkedIn
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <button
            onClick={onStartOver}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Refine Search
          </button>
          <button
            onClick={() => setStage(5)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>

        {/* Tips Section */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 animate-fade-in">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Tips for Reaching Out
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            <li>• Personalize your connection request with a brief intro about yourself</li>
            <li>• Mention something specific from their profile that resonates with you</li>
            <li>• Be clear about what you're hoping to learn from them</li>
            <li>• Keep your initial message concise (2-3 sentences)</li>
            <li>• Offer value - mention how you might be able to help them too</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default MentorMatchingQuiz;
