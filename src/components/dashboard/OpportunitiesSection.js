// Opportunities Section Component
import React from 'react';
import { Building2, Search, RefreshCw, MapPin, Clock, CircleDollarSign, ChevronRight } from 'lucide-react';
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

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 animate-fade-in card-hover">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold">
            Matched Opportunities
            {debouncedSearchQuery && searchResults.opportunities.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 animate-fade-in-fast">
                ({searchResults.opportunities.length} found)
              </span>
            )}
          </h2>
        </div>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-2 group transition-all duration-200"
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

const OpportunityCard = ({ opportunity, searchTerm, animationDelay = 0 }) => {
  const encodedTitle = encodeURIComponent(opportunity.role);
  const jobLinks = {
    linkedin: `https://www.linkedin.com/jobs/search/?keywords=${encodedTitle}`,
    indeed: `https://www.indeed.com/jobs?q=${encodedTitle}`,
    handshake: `https://app.joinhandshake.com/stu/postings?text=${encodedTitle}`
  };

  return (
    <div
      className="border rounded-lg p-4 sm:p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-300 ease-out animate-slide-up opacity-0 bg-white"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-4">
        <div className="flex-1">
          <h3 className="font-medium text-base sm:text-lg text-gray-900 mb-1">
            <HighlightText text={opportunity.role} searchTerm={searchTerm} />
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            <HighlightText text={opportunity.company} searchTerm={searchTerm} />
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-4">
            <span className="inline-flex items-center text-sm text-gray-600">
              <MapPin className="h-4 w-4 mr-1" />
              <HighlightText text={opportunity.location} searchTerm={searchTerm} />
            </span>
            <span className="inline-flex items-center text-sm text-gray-600">
              <Clock className="h-4 w-4 mr-1" />
              {opportunity.postedDate}
            </span>
            {opportunity.salaryRange && (
              <span className="inline-flex items-center text-sm text-gray-600">
                <CircleDollarSign className="h-4 w-4 mr-1" />
                {opportunity.salaryRange}
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

      <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t">
        <JobLinkButton
          href={jobLinks.linkedin}
          platform="LinkedIn"
          role={opportunity.role}
        />
        <JobLinkButton
          href={jobLinks.indeed}
          platform="Indeed"
          role={opportunity.role}
        />
        <JobLinkButton
          href={jobLinks.handshake}
          platform="Handshake"
          role={opportunity.role}
        />
      </div>
    </div>
  );
};

const JobLinkButton = ({ href, platform, role }) => (
  <a
    href={href}
    target="_blank"
    rel="noopener noreferrer"
    onClick={() => analytics.trackJobApplicationClick(role, platform)}
    className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 hover:shadow-md active:scale-95 transition-all duration-200 inline-flex items-center justify-center gap-1 text-sm font-medium group"
  >
    {platform}
    <ChevronRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform duration-200" />
  </a>
);

export default OpportunitiesSection;
