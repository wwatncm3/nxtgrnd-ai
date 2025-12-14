// Search-related components for the dashboard
import React from 'react';
import { Search, BookOpen, Award, Users, Link, Star, Clock, ArrowRight } from 'lucide-react';

// Search Result Highlighter Component
export const HighlightText = ({ text, searchTerm }) => {
  if (!searchTerm || !text) return text;

  const regex = new RegExp(`(${searchTerm})`, 'gi');
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <mark key={index} className="bg-yellow-200 text-yellow-900 rounded px-1">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
};

// Search Results Info Component
export const SearchResultsInfo = ({ searchQuery, totalResults, hasResults }) => {
  if (!searchQuery || searchQuery.length < 2) return null;

  return (
    <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-blue-600" />
          <span className="text-blue-900 text-sm font-medium">
            {hasResults
              ? `Found ${totalResults} result${totalResults !== 1 ? 's' : ''} for "${searchQuery}"`
              : `No results found for "${searchQuery}"`
            }
          </span>
        </div>
        {!hasResults && (
          <div className="text-blue-700 text-xs">
            Try different keywords or check spelling
          </div>
        )}
      </div>
    </div>
  );
};

// Resource Card Component with Search Highlighting
export const ResourceCard = ({ resource, searchTerm }) => {
  const getIconForType = (type) => {
    switch (type) {
      case 'course':
      case 'tutorial':
        return <BookOpen className="h-5 w-5" />;
      case 'certification':
        return <Award className="h-5 w-5" />;
      case 'community':
        return <Users className="h-5 w-5" />;
      case 'resource':
      default:
        return <Link className="h-5 w-5" />;
    }
  };

  const renderMetadata = () => {
    switch (resource.type) {
      case 'course':
        return (
          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2 text-sm text-gray-500">
            {resource.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-current text-yellow-400" />
                {resource.rating}
              </span>
            )}
            {resource.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {resource.duration}
              </span>
            )}
            {resource.provider && (
              <span><HighlightText text={resource.provider} searchTerm={searchTerm} /></span>
            )}
          </div>
        );

      case 'certification':
        return (
          <div className="mt-2 text-sm text-gray-500">
            {resource.examCode && <div>Exam Code: {resource.examCode}</div>}
            {resource.preparationTime && <div>Prep Time: {resource.preparationTime}</div>}
          </div>
        );

      case 'community':
        return (
          <div className="mt-2 text-sm text-gray-500">
            {resource.platform && (
              <div>Platform: <HighlightText text={resource.platform} searchTerm={searchTerm} /></div>
            )}
            {resource.memberCount && (
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {resource.memberCount.toLocaleString()} members
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <a
      href={resource.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block p-3 sm:p-4 border rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-all"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg text-blue-600 flex-shrink-0">
          {getIconForType(resource.type)}
        </div>
        <div className="flex-grow min-w-0">
          <h4 className="font-medium text-blue-600 truncate text-sm sm:text-base">
            <HighlightText text={resource.title} searchTerm={searchTerm} />
          </h4>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            <HighlightText text={resource.description} searchTerm={searchTerm} />
          </p>
          {renderMetadata()}
        </div>
        <div className="flex-shrink-0 self-center">
          <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 text-blue-400" />
        </div>
      </div>
    </a>
  );
};
