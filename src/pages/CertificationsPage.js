import React, { useState, useContext, useEffect, useMemo } from 'react';
import {
  ArrowLeft, Award, Search, Clock,
  ExternalLink, CheckCircle, Circle, RefreshCw, X,
  BookOpen, AlertCircle, TrendingUp
} from 'lucide-react';
import { UserContext } from '../App';
import { storageUtils } from '../utils/authUtils';
import API_CONFIG, { fetchWithTimeout } from '../config/api';
import { FullPageLoader } from '../components/ui/AnimatedComponents';
import { getDashboardFromSession } from '../components/dashboard';
import { usePageTooltip } from '../components/OnboardingTooltip';

const CertificationsPage = ({ setStage }) => {
  // Trigger certifications tooltip for new users
  usePageTooltip('certifications');
  const { user } = useContext(UserContext);
  const selectedCareerPath = user?.selectedCareerPath;

  const [certifications, setCertifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [certProgress, setCertProgress] = useState({});
  const [activeTab, setActiveTab] = useState('recommended');

  // Load data on mount
  useEffect(() => {
    loadCertifications();
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.userID, selectedCareerPath]);

  const loadProgress = () => {
    // storageUtils.getItem already returns parsed data
    const saved = storageUtils.getItem(`certProgress_${user?.userID}`);
    if (saved) setCertProgress(saved);
  };

  const loadCertifications = async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      // First try to get from stored dashboard data using the shared utility (skip if forcing refresh)
      if (!forceRefresh) {
        const dashboardData = getDashboardFromSession(user?.userID, selectedCareerPath);
        if (dashboardData?.events?.length > 0) {
          // Transform events to certifications format
          const certs = transformEventsToCertifications(dashboardData.events);
          setCertifications(certs);
          setIsLoading(false);
          return;
        }
      }

      // If no stored data or forcing refresh, generate new certifications
      const certs = await generateCertifications();
      setCertifications(certs);
    } catch (err) {
      console.error('Error loading certifications:', err);
      setError('Unable to load certifications. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const transformEventsToCertifications = (events) => {
    return events.filter(e => e.type === 'certification').map((event, idx) => ({
      id: `cert-${idx}`,
      name: event.title,
      provider: event.provider || 'Industry Standard',
      description: event.description,
      difficulty: event.difficulty || 'Intermediate',
      timeframe: event.deadline || '3-6 months',
      cost: event.cost || '$200 - $500',
      status: 'not_started',
      category: 'professional',
      ...event
    }));
  };

  const generateCertifications = async () => {
    if (!selectedCareerPath) return [];

    try {
      const response = await fetchWithTimeout(
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
              pathType: 'certifications',
              experienceLevel: user?.experienceLevel || 'entry',
              skills: selectedCareerPath.requiredSkills || []
            })
          })
        }
      );

      const data = await response.json();
      if (data.body) {
        const parsedBody = typeof data.body === 'string' ? JSON.parse(data.body) : data.body;
        return parsedBody.recommendations?.certifications || getFallbackCertifications();
      }
    } catch (error) {
      console.error('Error generating certifications:', error);
    }

    return getFallbackCertifications();
  };

  const getFallbackCertifications = () => {
    const careerTitle = selectedCareerPath?.title || 'Professional';
    return [
      {
        id: 'cert-1',
        name: `${careerTitle} Foundation Certificate`,
        provider: 'Industry Association',
        description: `Validate your foundational knowledge in ${careerTitle}. This entry-level certification demonstrates core competencies.`,
        difficulty: 'Beginner',
        timeframe: '1-2 months',
        cost: '$150 - $300',
        status: 'not_started',
        category: 'foundation',
        examFormat: 'Multiple Choice',
        passingScore: '70%',
        validity: '3 years',
        prepResources: [
          { title: 'Official Study Guide', url: `https://www.amazon.com/s?k=${encodeURIComponent(careerTitle)}+certification+guide`, type: 'book' },
          { title: 'Practice Tests', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(careerTitle)}+practice+test`, type: 'course' }
        ]
      },
      {
        id: 'cert-2',
        name: `Certified ${careerTitle} Professional`,
        provider: 'Professional Board',
        description: `Industry-recognized certification for experienced ${careerTitle}s. Demonstrates advanced skills and professional competence.`,
        difficulty: 'Intermediate',
        timeframe: '3-4 months',
        cost: '$300 - $500',
        status: 'not_started',
        category: 'professional',
        examFormat: 'Mixed (MCQ + Practical)',
        passingScore: '75%',
        validity: '2 years',
        prerequisites: ['2+ years experience', 'Foundation Certificate recommended'],
        prepResources: [
          { title: 'Coursera Specialization', url: `https://www.coursera.org/search?query=${encodeURIComponent(careerTitle)}+professional`, type: 'course' },
          { title: 'LinkedIn Learning Path', url: `https://www.linkedin.com/learning/search?keywords=${encodeURIComponent(careerTitle)}+certification`, type: 'course' }
        ]
      },
      {
        id: 'cert-3',
        name: `${careerTitle} Expert Certification`,
        provider: 'Global Certification Body',
        description: `The gold standard for ${careerTitle} expertise. Recognized globally and highly valued by employers.`,
        difficulty: 'Advanced',
        timeframe: '4-6 months',
        cost: '$500 - $800',
        status: 'not_started',
        category: 'expert',
        examFormat: 'Comprehensive (Written + Project)',
        passingScore: '80%',
        validity: '3 years',
        prerequisites: ['5+ years experience', 'Professional Certification required'],
        prepResources: [
          { title: 'Boot Camp Program', url: `https://www.udemy.com/courses/search/?q=${encodeURIComponent(careerTitle)}+expert+bootcamp`, type: 'bootcamp' },
          { title: 'Exam Prep Course', url: `https://www.pluralsight.com/search?q=${encodeURIComponent(careerTitle)}`, type: 'course' }
        ]
      },
      {
        id: 'cert-4',
        name: `${careerTitle} Specialist - Emerging Tech`,
        provider: 'Tech Academy',
        description: `Specialize in cutting-edge technologies within ${careerTitle}. Stay ahead with the latest industry trends.`,
        difficulty: 'Intermediate',
        timeframe: '2-3 months',
        cost: '$250 - $400',
        status: 'not_started',
        category: 'specialist',
        examFormat: 'Online Proctored',
        passingScore: '72%',
        validity: '2 years',
        prepResources: [
          { title: 'Official Training', url: `https://www.coursera.org/search?query=${encodeURIComponent(careerTitle)}+specialist`, type: 'course' }
        ]
      }
    ];
  };

  const updateCertStatus = (certId, status) => {
    setCertProgress(prev => {
      const newProgress = { ...prev, [certId]: status };
      // storageUtils.setItem handles JSON stringification internally
      storageUtils.setItem(`certProgress_${user?.userID}`, newProgress);
      return newProgress;
    });
  };

  // Filter and search
  const filteredCertifications = useMemo(() => {
    let filtered = certifications;

    // Apply tab filter
    if (activeTab === 'in_progress') {
      filtered = filtered.filter(cert => certProgress[cert.id] === 'in_progress');
    } else if (activeTab === 'completed') {
      filtered = filtered.filter(cert => certProgress[cert.id] === 'completed');
    }

    // Apply difficulty filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(cert => cert.difficulty?.toLowerCase() === activeFilter);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(cert =>
        cert.name?.toLowerCase().includes(query) ||
        cert.provider?.toLowerCase().includes(query) ||
        cert.description?.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [certifications, activeFilter, searchQuery, activeTab, certProgress]);

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-700';
      case 'intermediate': return 'bg-yellow-100 text-yellow-700';
      case 'advanced': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (certId) => {
    const status = certProgress[certId];
    switch (status) {
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-300" />;
    }
  };

  const getStatusLabel = (certId) => {
    const status = certProgress[certId];
    switch (status) {
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      default: return 'Not Started';
    }
  };

  if (isLoading) {
    return (
      <FullPageLoader
        icon={Award}
        message="Loading certifications..."
        subMessage="Finding relevant certifications for your career path"
      />
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Award className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Unable to Load Certifications</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => loadCertifications(true)}
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
                  <Award className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">Certifications</h1>
                  <p className="text-sm text-gray-500">{selectedCareerPath?.title || 'Your Career'}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => loadCertifications(true)}
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
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{certifications.length}</p>
                <p className="text-sm text-gray-500">Recommended</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(certProgress).filter(s => s === 'in_progress').length}
                </p>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(certProgress).filter(s => s === 'completed').length}
                </p>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.round((Object.values(certProgress).filter(s => s === 'completed').length / Math.max(certifications.length, 1)) * 100)}%
                </p>
                <p className="text-sm text-gray-500">Progress</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('recommended')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'recommended'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Recommended ({certifications.length})
              </button>
              <button
                onClick={() => setActiveTab('in_progress')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'in_progress'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                In Progress ({Object.values(certProgress).filter(s => s === 'in_progress').length})
              </button>
              <button
                onClick={() => setActiveTab('completed')}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'completed'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                Completed ({Object.values(certProgress).filter(s => s === 'completed').length})
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Search certifications, providers..."
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
                {['all', 'beginner', 'intermediate', 'advanced'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                      activeFilter === filter
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Certifications List */}
        {filteredCertifications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Award className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No certifications found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredCertifications.map((cert) => (
              <div key={cert.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    {/* Main Content */}
                    <div className="flex-1">
                      <div className="flex items-start gap-4 mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg flex-shrink-0">
                          <Award className="h-8 w-8 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="text-xl font-semibold text-gray-900">{cert.name}</h3>
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(cert.difficulty)}`}>
                              {cert.difficulty}
                            </span>
                          </div>
                          <p className="text-gray-600 font-medium">{cert.provider}</p>
                        </div>
                      </div>

                      <p className="text-gray-600 mb-4">{cert.description}</p>

                      {/* Details Grid */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Prep Time</p>
                          <p className="font-medium text-gray-900">{cert.timeframe}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500 mb-1">Cost</p>
                          <p className="font-medium text-gray-900">{cert.cost}</p>
                        </div>
                        {cert.examFormat && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Exam Format</p>
                            <p className="font-medium text-gray-900">{cert.examFormat}</p>
                          </div>
                        )}
                        {cert.validity && (
                          <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 mb-1">Validity</p>
                            <p className="font-medium text-gray-900">{cert.validity}</p>
                          </div>
                        )}
                      </div>

                      {/* Prerequisites */}
                      {cert.prerequisites && cert.prerequisites.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 text-orange-500" />
                            Prerequisites
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cert.prerequisites.map((prereq, idx) => (
                              <span key={idx} className="px-3 py-1 bg-orange-50 text-orange-700 text-sm rounded-full">
                                {prereq}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prep Resources */}
                      {cert.prepResources && cert.prepResources.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-500" />
                            Preparation Resources
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {cert.prepResources.map((resource, idx) => (
                              <a
                                key={idx}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors"
                              >
                                {resource.title}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right Side - Status & Actions */}
                    <div className="lg:w-56 flex flex-col gap-4">
                      {/* Status */}
                      <div className="bg-gray-50 rounded-lg p-4 text-center">
                        <div className="flex justify-center mb-2">
                          {getStatusIcon(cert.id)}
                        </div>
                        <p className="text-sm font-medium text-gray-700">{getStatusLabel(cert.id)}</p>
                      </div>

                      {/* Action Buttons */}
                      <div className="space-y-2">
                        {certProgress[cert.id] !== 'completed' && (
                          <>
                            {certProgress[cert.id] !== 'in_progress' ? (
                              <button
                                onClick={() => updateCertStatus(cert.id, 'in_progress')}
                                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                              >
                                Start Preparing
                              </button>
                            ) : (
                              <button
                                onClick={() => updateCertStatus(cert.id, 'completed')}
                                className="w-full px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                              >
                                Mark Completed
                              </button>
                            )}
                          </>
                        )}

                        {certProgress[cert.id] === 'completed' && (
                          <div className="w-full px-4 py-2 bg-green-100 text-green-700 rounded-lg font-medium text-center flex items-center justify-center gap-2">
                            <CheckCircle className="h-4 w-4" />
                            Certified!
                          </div>
                        )}

                        {certProgress[cert.id] && certProgress[cert.id] !== 'not_started' && (
                          <button
                            onClick={() => updateCertStatus(cert.id, 'not_started')}
                            className="w-full px-4 py-2 text-gray-600 rounded-lg font-medium hover:bg-gray-100 transition-colors text-sm"
                          >
                            Reset Progress
                          </button>
                        )}
                      </div>

                      {/* Passing Score */}
                      {cert.passingScore && (
                        <div className="text-center text-sm text-gray-500">
                          Passing Score: <span className="font-medium text-gray-700">{cert.passingScore}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default CertificationsPage;
