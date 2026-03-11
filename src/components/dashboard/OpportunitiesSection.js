// Opportunities Section Component
// Shows job types with direct links to job boards - no fake company names
import React from 'react';
import { Briefcase, Building2, Search, RefreshCw, MapPin, TrendingUp, CircleDollarSign, ChevronRight, ExternalLink } from 'lucide-react';
import { HighlightText } from './SearchComponents';
import analytics from '../../utils/analytics';

const OpportunitiesSection = ({
  searchResults,
  searchFilters,
  debouncedSearchQuery,
  isLoading,
  onRefresh
}) => {
  // Don't render if filtered out
  if (!searchFilters.opportunities) return null;
  if (searchResults.opportunities.length === 0 && debouncedSearchQuery) return null;

  // Check if we have real job listings (with URLs) vs AI-generated suggestions
  const hasRealListings = searchResults.opportunities.some(opp => opp.url && opp.source !== 'NxtGrnd AI');

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 animate-fade-in hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {hasRealListings ? 'Live Job Listings' : 'Recommended Job Types'}
              {debouncedSearchQuery && searchResults.opportunities.length > 0 && (
                <span className="ml-2 text-sm font-normal text-gray-500 animate-fade-in-fast">
                  ({searchResults.opportunities.length} found)
                </span>
              )}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {hasRealListings ? 'Real-time listings from job boards' : 'Click to search on popular job sites'}
            </p>
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-2 group transition-all duration-200 bg-purple-50 px-3 py-1.5 rounded-lg hover:bg-purple-100"
        >
          <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : searchResults.opportunities.length === 0 && debouncedSearchQuery ? (
          <NoResultsMessage />
        ) : searchResults.opportunities.length === 0 ? (
          <EmptyState />
        ) : (
          searchResults.opportunities.map((opp, index) => (
            <OpportunityCard
              key={`${opp.role}-${index}`}
              opportunity={opp}
              searchTerm={debouncedSearchQuery}
              animationDelay={index * 100}
              isRealListing={opp.url && opp.source !== 'NxtGrnd AI'}
            />
          ))
        )}
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="space-y-4">
    {[1, 2, 3].map((i) => (
      <div key={i} className="border rounded-lg p-6 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1 space-y-3">
            <div className="h-5 skeleton rounded w-2/3"></div>
            <div className="h-4 skeleton rounded w-1/3"></div>
            <div className="flex gap-4">
              <div className="h-4 w-24 skeleton rounded"></div>
              <div className="h-4 w-20 skeleton rounded"></div>
            </div>
          </div>
          <div className="h-8 w-24 skeleton rounded-full"></div>
        </div>
        <div className="h-4 skeleton rounded w-full mb-4"></div>
        <div className="flex gap-2 pt-4 border-t">
          <div className="h-10 skeleton rounded-lg flex-1"></div>
          <div className="h-10 skeleton rounded-lg flex-1"></div>
          <div className="h-10 skeleton rounded-lg flex-1"></div>
        </div>
      </div>
    ))}
  </div>
);

const NoResultsMessage = () => (
  <div className="text-center py-12 animate-scale-in">
    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="h-8 w-8 text-gray-400" />
    </div>
    <p className="text-gray-500 text-lg">No opportunities match your search.</p>
    <p className="text-gray-400 text-sm mt-1">Try different keywords or filters</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-12 animate-scale-in">
    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
      <Building2 className="h-8 w-8 text-blue-400" />
    </div>
    <p className="text-gray-500 text-lg">No opportunities available yet.</p>
    <p className="text-gray-400 text-sm mt-1">New opportunities are added regularly</p>
  </div>
);

const OpportunityCard = ({ opportunity, searchTerm, animationDelay = 0, isRealListing = false }) => {
  const encodedTitle = encodeURIComponent(opportunity.role);
  const jobLinks = opportunity.searchUrls || {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}`,
    indeed: `https://www.indeed.com/jobs?q=${encodedTitle}`,
    glassdoor: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encodedTitle}`,
    handshake: `https://app.joinhandshake.com/stu/postings?text=${encodedTitle}`
  };

  // For real listings, show the actual company. For AI suggestions, show job type info
  const displayCompany = isRealListing ? opportunity.company : null;

  return (
    <div
      className="border rounded-lg p-4 sm:p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 ease-out animate-slide-up opacity-0 bg-white"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-medium text-base sm:text-lg text-gray-900">
              <HighlightText text={opportunity.role} searchTerm={searchTerm} />
            </h3>
            {isRealListing && opportunity.source && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                {opportunity.source}
              </span>
            )}
          </div>

          {/* Show company only for real listings */}
          {displayCompany && (
            <p className="text-sm text-gray-600 mb-2">
              <HighlightText text={displayCompany} searchTerm={searchTerm} />
            </p>
          )}

          <div className="flex flex-wrap gap-3 sm:gap-4">
            <span className="inline-flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <HighlightText text={opportunity.location || 'Remote/Multiple Locations'} searchTerm={searchTerm} />
            </span>
            {opportunity.salaryRange && (
              <span className="inline-flex items-center text-sm text-gray-600">
                <CircleDollarSign className="h-4 w-4 mr-1" />
                {opportunity.salaryRange}
              </span>
            )}
            {!isRealListing && (
              <span className="inline-flex items-center text-sm text-blue-600">
                <TrendingUp className="h-4 w-4 mr-1" />
                High Demand
              </span>
            )}
          </div>
        </div>
        <div className="w-full sm:w-auto sm:ml-4">
          <span className="inline-block px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-sm font-medium w-full sm:w-auto text-center">
            {opportunity.matchScore}% Match
          </span>
        </div>
      </div>

      {opportunity.description && (
        <p className="text-sm text-gray-700 mb-4">
          <HighlightText text={opportunity.description} searchTerm={searchTerm} />
        </p>
      )}

      {/* For real listings with direct URL, show Apply button prominently */}
      {isRealListing && opportunity.url ? (
        <div className="pt-4 border-t">
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.trackJobApplicationClick(opportunity.role, opportunity.source || 'Direct')}
            className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 active:scale-98 transition-all duration-200 inline-flex items-center justify-center gap-2 font-medium"
          >
            <ExternalLink className="h-4 w-4" />
            Apply on {opportunity.source || 'Job Site'}
          </a>
          <div className="flex gap-2 mt-2">
            <JobLinkButton href={jobLinks.linkedin} platform="More on LinkedIn" role={opportunity.role} small />
            <JobLinkButton href={jobLinks.indeed} platform="Indeed" role={opportunity.role} small />
          </div>
        </div>
      ) : (
        /* For AI suggestions, show search buttons */
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500 mb-3 text-center">Search for "{opportunity.role}" positions:</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <JobLinkButton href={jobLinks.linkedin} platform="LinkedIn" role={opportunity.role} />
            <JobLinkButton href={jobLinks.indeed} platform="Indeed" role={opportunity.role} />
            <JobLinkButton href={jobLinks.glassdoor} platform="Glassdoor" role={opportunity.role} />
            <JobLinkButton href={jobLinks.handshake} platform="Handshake" role={opportunity.role} />
          </div>
        </div>
      )}
    </div>
  );
};

const JobLinkButton = ({ href, platform, role, small = false }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => analytics.trackJobApplicationClick(role, platform)}
    className={`${small ? 'flex-1 px-2 py-1.5 text-xs' : 'px-3 py-2 text-sm'} bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 hover:shadow-md active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-1 font-medium group`}
  >
    {platform}
    <ChevronRight className={`${small ? 'h-3 w-3' : 'h-4 w-4'} transform group-hover:translate-x-1 transition-transform duration-200`} />
  </a>
);

export default OpportunitiesSection;
