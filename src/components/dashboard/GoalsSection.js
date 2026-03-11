// Goals Section Component
import React from 'react';
import { Target, Search } from 'lucide-react';
import { HighlightText } from './SearchComponents';

const GoalsSection = ({
  searchResults,
  searchFilters,
  debouncedSearchQuery,
  isLoading
}) => {
  // Don't render if filtered out
  if (!searchFilters.goals) return null;
  if (searchResults.goals.length === 0 && debouncedSearchQuery) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 animate-fade-in hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md">
            <Target className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Path Goals
            {debouncedSearchQuery && searchResults.goals.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 animate-fade-in-fast">
                ({searchResults.goals.length} found)
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : searchResults.goals.length === 0 && debouncedSearchQuery ? (
          <NoResultsMessage />
        ) : searchResults.goals.length === 0 ? (
          <EmptyState />
        ) : (
          searchResults.goals.map((goal, index) => (
            <GoalCard
              key={`${goal.title}-${index}`}
              goal={goal}
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
      <div key={i} className="p-4 rounded-lg animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
        <div className="flex justify-between mb-2">
          <div className="h-5 skeleton rounded w-1/2"></div>
          <div className="h-5 skeleton rounded w-20"></div>
        </div>
        <div className="h-4 skeleton rounded w-3/4 mb-3"></div>
        <div className="h-2 skeleton rounded-full w-full"></div>
      </div>
    ))}
  </div>
);

const NoResultsMessage = () => (
  <div className="text-center py-10 animate-scale-in">
    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="h-7 w-7 text-gray-400" />
    </div>
    <p className="text-gray-500">No goals match your search.</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-10 animate-scale-in">
    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
      <Target className="h-7 w-7 text-blue-400" />
    </div>
    <p className="text-gray-500">No goals set yet.</p>
    <p className="text-gray-400 text-sm mt-1">Goals will appear here</p>
  </div>
);

const GoalCard = ({ goal, searchTerm, animationDelay = 0 }) => {
  const progressPercent = (goal.current / goal.target) * 100;

  return (
    <div
      className="p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-all duration-300 animate-slide-up opacity-0"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm sm:text-base">
          <HighlightText text={goal.title} searchTerm={searchTerm} />
        </span>
        <span className="text-blue-600 text-sm font-medium">
          {goal.current}/{goal.target} {goal.unit}
        </span>
      </div>
      <p className="text-xs sm:text-sm text-gray-600 mt-1 mb-3">
        <HighlightText text={goal.description} searchTerm={searchTerm} />
      </p>
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-full h-2.5 transition-all duration-700 ease-out progress-bar"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
};

export default GoalsSection;
