import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Building2, Search, Clock, CircleDollarSign,
  ExternalLink, Bookmark, BookmarkCheck, RefreshCw, X,
  Briefcase, TrendingUp, Users, Globe, Zap
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';
import analytics from '../utils/analytics';
import API_CONFIG from '../config/api';
import { FullPageLoader } from '../components/ui/AnimatedComponents';
import { getDashboardFromSession } from '../components/dashboard';
import { usePageTooltip } from '../components/OnboardingTooltip';

const JobsProjectsPage = ({ setStage }) => {
  // Trigger jobs tooltip for new users
  usePageTooltip('jobs');
  const { user } = useContext(UserContext);
  const selectedCareerPath = user?.selectedCareerPath;

  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [savedJobs, setSavedJobs] = useState([]);
  const [activeTab, setActiveTab] = useState('opportunities');

  // Load data on mount
  useEffect(() => {
    loadOpportunities();
    loadSavedJobs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, selectedCareerPath]);

  const loadSavedJobs = () => {
    // storageUtils.getItem already returns parsed data
    const saved = storageUtils.getItem(`savedJobs_${user?.userID}`);
    if (saved) setSavedJobs(saved);
  };

  const loadOpportunities = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // First try to get from stored dashboard data using the shared utility (skip if forcing refresh)
      if (!forceRefresh) {
        const dashboardData = getDashboardFromSession(user?.userID, selectedCareerPath);
        if (dashboardData?.opportunities?.length > 0) {
          setOpportunities(dashboardData.opportunities);
          setIsLoading(false);
          return;
        }
      }

      // If no stored data or forcing refresh, generate new opportunities
      const opps = await generateOpportunities();
      setOpportunities(opps);
    } catch (err) {
      console.error('Error loading opportunities:', err);
      setError('Unable to load opportunities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const generateOpportunities = async () => {
    if (!selectedCareerPath) return [];

    try {
      const response = await fetch(
        API_CONFIG.recommendations.generate(),
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            httpMethod: 'POST',
            path: '/recommendations/generate',
            body: JSON.stringify({
              userId: user?.userID,
              careerPath: selectedCareerPath.title,
              pathType: 'opportunities',
              experienceLevel: user?.experienceLevel || 'entry',
              skills: selectedCareerPath.requiredSkills || []
            })
          })
        }
      );

      const data = await response.json();
      if (data.body) {
        const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        return parsedBody.recommendations?.opportunities || getFallbackOpportunities();
      }
    } catch (error) {
      console.error('Error generating opportunities:', error);
    }

    return getFallbackOpportunities();
  };

  const getFallbackOpportunities = () => {
    const careerTitle = selectedCareerPath?.title || 'Professional';
    return [
      {
        id: 'opp-1',
        type: 'job',
        role: `Junior ${careerTitle}`,
        location: 'Remote',
        locationType: 'remote',
        matchScore: 92,
        description: `Entry-level ${careerTitle} position. Ideal for building foundational skills and gaining industry experience.`,
        salaryRange: '$60,000 - $80,000',
        skills: selectedCareerPath?.requiredSkills?.slice(0, 4) || ['Communication', 'Problem Solving'],
        benefits: ['Health Insurance', '401k', 'Remote Work', 'Learning Budget'],
        isRoleType: true
      },
      {
        id: 'opp-2',
        type: 'job',
        role: `${careerTitle}`,
        location: 'Hybrid',
        locationType: 'hybrid',
        matchScore: 87,
        description: `Mid-level ${careerTitle} role focused on driving innovation and delivering impactful solutions.`,
        salaryRange: '$80,000 - $110,000',
        skills: selectedCareerPath?.requiredSkills?.slice(0, 5) || ['Leadership', 'Strategy'],
        benefits: ['Stock Options', 'Unlimited PTO', 'Gym Membership'],
        isRoleType: true
      },
      {
        id: 'opp-3',
        type: 'project',
        role: `Freelance ${careerTitle}`,
        location: 'Remote',
        locationType: 'remote',
        matchScore: 85,
        description: `Contract or freelance ${careerTitle} work. Great for building your portfolio and gaining diverse experience.`,
        salaryRange: '$50 - $150/hr',
        duration: 'Varies',
        skills: selectedCareerPath?.requiredSkills?.slice(0, 3) || ['Adaptability'],
        isRoleType: true
      },
      {
        id: 'opp-4',
        type: 'job',
        role: `Senior ${careerTitle}`,
        location: 'On-site',
        locationType: 'onsite',
        matchScore: 78,
        description: `Senior role with leadership responsibilities. Mentor team members and drive strategic initiatives.`,
        salaryRange: '$120,000 - $150,000',
        skills: selectedCareerPath?.requiredSkills || ['Leadership', 'Mentoring'],
        benefits: ['Executive Benefits', 'Relocation Assistance', 'Signing Bonus'],
        isRoleType: true
      }
    ];
  };

  const toggleSaveJob = (jobId) => {
    setSavedJobs(prev => {
      const newSaved = prev.includes(jobId)
        ? prev.filter(id => id !== jobId)
        : [...prev, jobId];

      // storageUtils.setItem handles JSON stringification internally
      storageUtils.setItem(`savedJobs_${user?.userID}`, newSaved);
      return newSaved;
    });
  };

  // Helper to determine experience level from role title
  const getExperienceLevel = (role) => {
    const roleLower = (role || '').toLowerCase();
    if (roleLower.includes('senior') || roleLower.includes('lead') || roleLower.includes('principal') || roleLower.includes('director')) {
      return 'senior';
    }
    if (roleLower.includes('junior') || roleLower.includes('entry') || roleLower.includes('associate') || roleLower.includes('intern')) {
      return 'entry';
    }
    return 'mid';
  };

  // Filter and search
  const filteredOpportunities = useMemo(() => {
    let filtered = opportunities;

    // Apply tab filter
    if (activeTab === 'saved') {
      filtered = filtered.filter(opp => savedJobs.includes(opp.id));
    }

    // Apply type filter
    if (activeFilter !== 'all') {
      if (activeFilter === 'remote') {
        filtered = filtered.filter(opp => opp.locationType === 'remote');
      } else if (activeFilter === 'jobs') {
        filtered = filtered.filter(opp => opp.type === 'job');
      } else if (activeFilter === 'projects') {
        filtered = filtered.filter(opp => opp.type === 'project');
      } else if (activeFilter === 'entry' || activeFilter === 'mid' || activeFilter === 'senior') {
        filtered = filtered.filter(opp => getExperienceLevel(opp.role) === activeFilter);
      }
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(opp =>
        opp.role?.toLowerCase().includes(query) ||
        opp.company?.toLowerCase().includes(query) ||
        opp.location?.toLowerCase().includes(query) ||
        opp.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [opportunities, activeFilter, searchQuery, activeTab, savedJobs]);

  const getMatchColor = (score) => {
    if (score >= 90) return 'bg-green-100 text-green-700';
    if (score >= 80) return 'bg-blue-100 text-blue-700';
    if (score >= 70) return 'bg-yellow-100 text-yellow-700';
    return 'bg-gray-100 text-gray-700';
  };

  const getLocationIcon = (type) => {
    switch (type) {
      case 'remote': return <Globe className="h-4 w-4" />;
      case 'hybrid': return <Users className="h-4 w-4" />;
      default: return <Building2 className="h-4 w-4" />;
    }
  };

  const getJobLinks = (role) => {
    const encodedRole = encodeURIComponent(role);
    return {
      linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedRole}`,
      indeed: `https://www.indeed.com/jobs?q=${encodedRole}`,
      handshake: `https://app.joinhandshake.com/stu/postings?text=${encodedRole}`,
      glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedRole}`
    };
  };

  if (isLoading) {
    return (
      <FullPageLoader
        icon={Briefcase}
        message="Finding opportunities for you..."
        subMessage="Searching jobs and projects that match your profile"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Opportunities</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => loadOpportunities(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={() => setStage(5)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors font-medium"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setStage(5)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Jobs & Projects</h1>
                  <p className="text-sm text-gray-500">{selectedCareerPath?.title || 'Your Career'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => loadOpportunities(true)}
              className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Briefcase className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{opportunities.filter(o => o.type === 'job').length}</p>
                <p className="text-sm text-gray-500">Job Listings</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-teal-100 rounded-lg">
                <Zap className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{opportunities.filter(o => o.type === 'project').length}</p>
                <p className="text-sm text-gray-500">Projects</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round(opportunities.reduce((a, b) => a + (b.matchScore || 0), 0) / Math.max(opportunities.length, 1))}%
                </p>
                <p className="text-sm text-gray-500">Avg Match</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg">
                <Bookmark className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{savedJobs.length}</p>
                <p className="text-sm text-gray-500">Saved</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('opportunities')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'opportunities'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                All Opportunities ({opportunities.length})
              </button>
              <button
                onClick={() => setActiveTab('saved')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'saved'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Saved ({savedJobs.length})
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search roles, companies, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pl-10 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5">
                    <X className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                {['all', 'entry', 'mid', 'senior', 'jobs', 'projects', 'remote'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter === 'entry' ? 'Entry Level' :
                     filter === 'mid' ? 'Mid Level' :
                     filter === 'senior' ? 'Senior' :
                     filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Opportunities List */}
        {filteredOpportunities.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Briefcase className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {activeTab === 'saved' ? 'No saved opportunities yet' : 'No opportunities found'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'saved'
                ? 'Save opportunities you\'re interested in to view them here'
                : 'Try adjusting your search or filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOpportunities.map((opp) => {
              const jobLinks = getJobLinks(opp.role);
              const isSaved = savedJobs.includes(opp.id);

              return (
                <div key={opp.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">{opp.role}</h3>
                            {opp.type === 'project' && (
                              <span className="px-2 py-0.5 bg-teal-100 text-teal-700 text-xs font-medium rounded-full">
                                Project
                              </span>
                            )}
                            {opp.isRoleType && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                Role Type
                              </span>
                            )}
                            {opp.source && (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                                via {opp.source}
                              </span>
                            )}
                          </div>
                          {opp.company && !opp.isRoleType && (
                            <div className="flex items-center gap-2">
                              <p className="text-gray-600 font-medium">{opp.company}</p>
                              {opp.companyLogo && (
                                <img src={opp.companyLogo} alt={opp.company} className="h-5 w-5 rounded" />
                              )}
                            </div>
                          )}
                          {opp.isRoleType && (
                            <p className="text-gray-500 text-sm">Search for this role on job boards below</p>
                          )}
                        </div>
                        <button
                          onClick={() => toggleSaveJob(opp.id)}
                          className={`p-2 rounded-lg transition-colors ${
                            isSaved ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 text-gray-400'
                          }`}
                        >
                          {isSaved ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
                        </button>
                      </div>

                      <p className="text-gray-600 mb-4">{opp.description}</p>

                      {/* Meta Info */}
                      <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          {getLocationIcon(opp.locationType)}
                          {opp.location}
                        </span>
                        {opp.postedDate && !opp.isRoleType && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {opp.postedDate}
                          </span>
                        )}
                        {opp.salaryRange && (
                          <span className="flex items-center gap-1">
                            <CircleDollarSign className="h-4 w-4" />
                            {opp.salaryRange}
                          </span>
                        )}
                        {opp.duration && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {opp.duration}
                          </span>
                        )}
                      </div>

                      {/* Skills */}
                      {opp.skills && opp.skills.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {opp.skills.map((skill, idx) => (
                            <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full">
                              {skill}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Benefits */}
                      {opp.benefits && opp.benefits.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {opp.benefits.map((benefit, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                              {benefit}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Right Side - Match Score & Actions */}
                    <div className="lg:w-64 flex flex-col gap-4">
                      <div className={`text-center p-4 rounded-lg ${getMatchColor(opp.matchScore)}`}>
                        <p className="text-3xl font-bold">{opp.matchScore}%</p>
                        <p className="text-sm font-medium">Match Score</p>
                      </div>

                      {/* Direct Apply Button (for real job listings) */}
                      {opp.url && (
                        <a
                          href={opp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => analytics.trackJobApplicationClick(opp.role, opp.source || 'Direct')}
                          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Apply Now <ExternalLink className="h-4 w-4" />
                        </a>
                      )}

                      {/* Quick Apply Links */}
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          {opp.url ? 'Also search on:' : 'Apply on:'}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <a
                            href={jobLinks.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => analytics.trackJobApplicationClick(opp.role, 'LinkedIn')}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm"
                          >
                            LinkedIn <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={jobLinks.indeed}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => analytics.trackJobApplicationClick(opp.role, 'Indeed')}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors text-sm"
                          >
                            Indeed <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={jobLinks.glassdoor}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => analytics.trackJobApplicationClick(opp.role, 'Glassdoor')}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors text-sm"
                          >
                            Glassdoor <ExternalLink className="h-3 w-3" />
                          </a>
                          <a
                            href={jobLinks.handshake}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => analytics.trackJobApplicationClick(opp.role, 'Handshake')}
                            className="flex items-center justify-center gap-1 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors text-sm"
                          >
                            Handshake <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default JobsProjectsPage;
