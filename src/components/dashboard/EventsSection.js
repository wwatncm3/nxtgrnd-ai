// Events/Milestones Section Component
import React from 'react';
import { Calendar, Award, Target, Search } from 'lucide-react';
import { HighlightText } from './SearchComponents';

const EventsSection = ({
  searchResults,
  searchFilters,
  debouncedSearchQuery,
  isLoading
}) => {
  // Don't render if filtered out
  if (!searchFilters.events) return null;
  if (searchResults.events.length === 0 && debouncedSearchQuery) return null;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6 animate-fade-in hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-md">
            <Calendar className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
            Upcoming Milestones
            {debouncedSearchQuery && searchResults.events.length > 0 && (
              <span className="ml-2 text-sm font-normal text-gray-500 animate-fade-in-fast">
                ({searchResults.events.length} found)
              </span>
            )}
          </h2>
        </div>
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <LoadingSkeleton />
        ) : searchResults.events.length === 0 && debouncedSearchQuery ? (
          <NoResultsMessage />
        ) : searchResults.events.length === 0 ? (
          <EmptyState />
        ) : (
          searchResults.events.map((event, index) => (
            <EventCard
              key={`${event.title}-${index}`}
              event={event}
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
      <div key={i} className="border rounded-lg p-4 animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 skeleton rounded-lg"></div>
          <div className="flex-1 space-y-2">
            <div className="h-5 skeleton rounded w-3/4"></div>
            <div className="h-4 skeleton rounded w-full"></div>
            <div className="h-4 skeleton rounded w-1/3"></div>
          </div>
        </div>
      </div>
    ))}
  </div>
);

const NoResultsMessage = () => (
  <div className="text-center py-10 animate-scale-in">
    <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Search className="h-7 w-7 text-gray-400" />
    </div>
    <p className="text-gray-500">No events match your search.</p>
  </div>
);

const EmptyState = () => (
  <div className="text-center py-10 animate-scale-in">
    <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
      <Calendar className="h-7 w-7 text-blue-400" />
    </div>
    <p className="text-gray-500">No upcoming milestones.</p>
    <p className="text-gray-400 text-sm mt-1">Milestones will appear here</p>
  </div>
);

const EventCard = ({ event, searchTerm, animationDelay = 0 }) => {
  return (
    <div
      className="border rounded-lg p-3 sm:p-4 hover:border-blue-300 hover:shadow-md transition-all duration-300 animate-slide-up opacity-0 bg-white"
      style={{ animationDelay: `${animationDelay}ms`, animationFillMode: 'forwards' }}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0 transition-transform duration-300 hover:scale-110">
          {event.type === 'certification' ? (
            <Award className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          ) : (
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm sm:text-base">
            <HighlightText text={event.title} searchTerm={searchTerm} />
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            <HighlightText text={event.description} searchTerm={searchTerm} />
          </p>
          <p className="text-xs sm:text-sm text-gray-600 mt-1">
            <strong>Deadline:</strong> {event.deadline}
          </p>
          {event.provider && (
            <p className="text-xs sm:text-sm text-gray-600 mt-1">
              <strong>Provider:</strong> <HighlightText text={event.provider} searchTerm={searchTerm} />
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventsSection;
